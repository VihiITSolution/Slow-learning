"""
Tests for the student activities (practice rounds, lesson activities, learning
games, daily check-in) and how they reach the engagement model.
"""
import json
import os
from datetime import datetime, timedelta

import joblib
import pytest
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler

from app import db
from app.ml_models.engagement_predictor import (EngagementPredictor, FEATURE_NAMES,
                                                generate_synthetic_training_data, rule_based_engagement_label)
from app.models.activity import ActivityAttempt
from app.models.lesson import Lesson
from app.models.user import User
from app.services import practice_generator
from conftest import get_auth_headers


def answer_all(questions, right=True, **extra):
    """Answers for a practice round: the correct option (or a wrong one) for every question."""
    answers = []
    for q in questions:
        choice = q['answer'] if right else (q['answer'] + 1) % len(q['options'])
        answers.append({'choice': choice, 'tries': 1 if right else 2, 'hint_used': False, 'seconds': 20, **extra})
    return answers


def play_round(client, token, category='math', right=True, **extra):
    round_ = client.get(f'/api/activities/practice/{category}', headers=get_auth_headers(token)).get_json()
    return client.post('/api/activities/practice', headers=get_auth_headers(token), json={
        'category': category, 'seed': round_['seed'], 'answers': answer_all(round_['questions'], right, **extra)})


# ---------------------------------------------------------------- generator
class TestPracticeGenerator:

    @pytest.mark.parametrize('category', ['math', 'words', 'world'])
    def test_rounds_are_valid_and_repeatable(self, category):
        questions = practice_generator.build_round(category, 1234)
        assert len(questions) == practice_generator.QUESTIONS_PER_ROUND
        assert questions == practice_generator.build_round(category, 1234)
        for q in questions:
            assert len(q['options']) == len(set(q['options'])) >= 2
            assert 0 <= q['answer'] < len(q['options'])
            assert q['prompt'] and q['hint']

    def test_many_seeds_never_break(self):
        for category in practice_generator.CATEGORIES:
            for seed in range(1, 300):
                for q in practice_generator.build_round(category, seed):
                    assert len(set(q['options'])) == len(q['options'])

    def test_unknown_area(self):
        with pytest.raises(ValueError):
            practice_generator.build_round('history', 1)


# ----------------------------------------------------------------- practice
class TestPracticeRounds:

    def test_get_round(self, client, student_token):
        body = client.get('/api/activities/practice/words', headers=get_auth_headers(student_token)).get_json()
        assert body['category'] == 'words' and isinstance(body['seed'], int) and len(body['questions']) == 5
        assert client.get('/api/activities/practice/history', headers=get_auth_headers(student_token)).status_code == 404

    def test_needs_login(self, client):
        assert client.get('/api/activities/practice/math').status_code == 401

    def test_perfect_round_scores_and_pays_xp(self, client, app, student_token, test_student):
        response = play_round(client, student_token)
        assert response.status_code == 201
        body = response.get_json()
        assert body['score'] == 100.0 and body['correct'] == 5 and body['stars'] == 3
        assert body['xp_earned'] == 10 and len(body['review']) == 5
        with app.app_context():
            attempt = ActivityAttempt.query.one()
            assert attempt.activity_type == 'practice' and attempt.time_spent == 100
            assert User.query.get(test_student['id']).total_xp == 110

    def test_server_marks_the_answers_not_the_browser(self, client, student_token):
        body = play_round(client, student_token, right=False).get_json()
        assert body['score'] == 0.0 and body['stars'] == 1 and body['xp_earned'] == 5
        assert all(not r['is_correct'] for r in body['review'])

    def test_hints_and_retries_are_recorded(self, client, app, student_token):
        play_round(client, student_token, right=False, hint_used=True)
        with app.app_context():
            attempt = ActivityAttempt.query.one()
            assert attempt.hints_used == 5 and attempt.retries == 5

    def test_same_round_cannot_be_saved_twice(self, client, student_token):
        round_ = client.get('/api/activities/practice/math', headers=get_auth_headers(student_token)).get_json()
        payload = {'category': 'math', 'seed': round_['seed'], 'answers': answer_all(round_['questions'])}
        assert client.post('/api/activities/practice', headers=get_auth_headers(student_token), json=payload).status_code == 201
        assert client.post('/api/activities/practice', headers=get_auth_headers(student_token), json=payload).status_code == 409

    def test_bad_requests(self, client, student_token):
        headers = get_auth_headers(student_token)
        assert client.post('/api/activities/practice', headers=headers, json={'category': 'x', 'seed': 1, 'answers': []}).status_code == 400
        assert client.post('/api/activities/practice', headers=headers, json={'category': 'math', 'answers': []}).status_code == 400
        assert client.post('/api/activities/practice', headers=headers, json={'category': 'math', 'seed': 5, 'answers': [{}]}).status_code == 400

    def test_xp_is_capped_per_day(self, client, student_token):
        earned = [play_round(client, student_token).get_json()['xp_earned'] for _ in range(6)]
        assert earned == [10, 10, 10, 10, 10, 0]


# --------------------------------------------------------- lesson activities
class TestLessonSteps:

    @pytest.fixture
    def interactive_lesson(self, app):
        with app.app_context():
            lesson = Lesson(title='Counting', category='math', difficulty_level='beginner', xp_reward=30, content=json.dumps({
                'type': 'interactive', 'steps': [
                    {'type': 'learn', 'title': 'Learn', 'content': '<p>1 2 3</p>'},
                    {'type': 'activity', 'title': 'A', 'question': '1+1?', 'options': ['1', '2'], 'correct': 1},
                    {'type': 'activity', 'title': 'B', 'question': '2+1?', 'options': ['3', '4'], 'correct': 0},
                ]}))
            plain = Lesson(title='Plain', category='math', difficulty_level='beginner', xp_reward=10, content='<p>Hi</p>')
            db.session.add_all([lesson, plain])
            db.session.commit()
            return lesson.id, plain.id

    def test_activity_steps_are_marked_with_the_lesson_answers(self, client, student_token, interactive_lesson):
        lesson_id, _ = interactive_lesson
        body = client.post('/api/activities/lesson-steps', headers=get_auth_headers(student_token),
                           json={'lesson_id': lesson_id, 'answers': [1, 1], 'time_spent': 90}).get_json()
        assert body['correct'] == 1 and body['total'] == 2 and body['score'] == 50.0

    def test_lesson_without_activities_and_wrong_length(self, client, student_token, interactive_lesson):
        lesson_id, plain_id = interactive_lesson
        headers = get_auth_headers(student_token)
        assert client.post('/api/activities/lesson-steps', headers=headers, json={'lesson_id': plain_id, 'answers': []}).status_code == 400
        assert client.post('/api/activities/lesson-steps', headers=headers, json={'lesson_id': lesson_id, 'answers': [1]}).status_code == 400
        assert client.post('/api/activities/lesson-steps', headers=headers, json={'lesson_id': 999, 'answers': [1]}).status_code == 404


# ------------------------------------------------------- games and check-in
class TestGamesAndCheckIn:

    def test_game_run_score_and_xp_cap(self, client, student_token):
        headers = get_auth_headers(student_token)
        first = client.post('/api/activities/game', headers=headers,
                            json={'games_completed': 4, 'games_total': 5, 'errors': 1, 'time_spent': 300}).get_json()
        assert first['score'] == 80.0 and first['xp_earned'] == 5
        more = [client.post('/api/activities/game', headers=headers, json={'games_completed': 5, 'games_total': 5}).get_json()['xp_earned']
                for _ in range(3)]
        assert more == [5, 5, 0]
        skipped = client.post('/api/activities/game', headers=headers, json={'games_completed': 0, 'games_total': 5}).get_json()
        assert skipped['score'] is None and skipped['xp_earned'] == 0

    def test_check_in_once_per_day(self, client, app, student_token):
        headers = get_auth_headers(student_token)
        assert client.post('/api/activities/check-in', headers=headers, json={'mood': 'angry'}).status_code == 400
        assert client.post('/api/activities/check-in', headers=headers, json={'mood': 'hard'}).get_json()['check_in']['label'] == 'Hard day'
        body = client.post('/api/activities/check-in', headers=headers, json={'mood': 'great'}).get_json()
        assert body['check_in']['emoji'] == '😄' and body['message']
        with app.app_context():
            assert ActivityAttempt.query.filter_by(activity_type='check_in').count() == 1

    def test_today_challenges_follow_real_activity(self, client, student_token):
        headers = get_auth_headers(student_token)
        before = client.get('/api/activities/today', headers=headers).get_json()
        assert before['done'] == 0 and before['total'] == 4
        client.post('/api/activities/check-in', headers=headers, json={'mood': 'okay'})
        play_round(client, student_token)
        after = client.get('/api/activities/today', headers=headers).get_json()
        done = {c['id'] for c in after['challenges'] if c['done']}
        assert done == {'check_in', 'practice'} and after['check_in']['mood'] == 'okay'

    def test_teacher_summary(self, client, student_token, teacher_token, test_student):
        play_round(client, student_token, 'words')
        client.post('/api/activities/check-in', headers=get_auth_headers(student_token), json={'mood': 'unsure'})
        assert client.get(f"/api/activities/student/{test_student['id']}", headers=get_auth_headers(student_token)).status_code == 403
        body = client.get(f"/api/activities/student/{test_student['id']}", headers=get_auth_headers(teacher_token)).get_json()
        summary = body['summary']
        assert summary['practice_rounds_week'] == 1 and summary['accuracy_by_area']['words'] == 100.0
        assert summary['latest_check_in']['mood'] == 'unsure' and summary['checked_in_today'] is True
        assert summary['hints_per_question'] == 0
        assert len(body['recent']) == 2


# ------------------------------------------------------- reaching the model
class TestActivitiesReachTheModel:

    def test_features_include_practice_and_games(self, client, app, student_token, test_student):
        from app.services.engagement_service import EngagementService
        play_round(client, student_token, 'math')          # 100%, 100 s
        play_round(client, student_token, 'world', right=False)  # 0%, 100 s
        client.post('/api/activities/game', headers=get_auth_headers(student_token),
                    json={'games_completed': 5, 'games_total': 5, 'errors': 0, 'time_spent': 200})
        with app.app_context():
            features = EngagementService().extract_user_features(test_student['id'])
        assert features['practice_accuracy'] == pytest.approx(66.7, abs=0.1)
        assert features['activities_week'] == 3
        assert features['time_spent_today'] == pytest.approx(400 / 60)

    def test_report_has_all_inputs_and_a_practising_student_is_not_new(self, client, student_token):
        headers = get_auth_headers(student_token)
        new = client.get('/api/ml/engagement/my-report', headers=headers).get_json()['data']
        assert new['insufficient_data'] is True and new['features']['practice_accuracy'] is None
        play_round(client, student_token)
        report = client.get('/api/ml/engagement/my-report', headers=headers).get_json()['data']
        assert set(report['features']) == set(FEATURE_NAMES)
        assert report['insufficient_data'] is False and report['engaged'] in (True, False)
        assert report['activity']['practice_rounds_week'] == 1

    def test_old_activity_is_outside_the_windows(self, client, app, student_token, test_student):
        from app.services.engagement_service import EngagementService
        play_round(client, student_token)
        with app.app_context():
            ActivityAttempt.query.update({'created_at': datetime.utcnow() - timedelta(days=20)})
            db.session.commit()
            features = EngagementService().extract_user_features(test_student['id'])
        assert features['practice_accuracy'] is None and features['activities_week'] == 0
        assert features['time_spent_today'] == 0

    def test_class_report_shows_activity(self, client, student_token, teacher_token):
        play_round(client, student_token)
        students = client.get('/api/ml/engagement/class-report', headers=get_auth_headers(teacher_token)).get_json()['data']['students']
        assert students[0]['activity']['practice_rounds_week'] == 1
        assert students[0]['features']['activities_week'] == 1


class TestModelInputs:

    def test_rule_counts_activities(self):
        practising = dict(time_spent_today=20, avg_quiz_score=None, login_streak=2, lessons_completed_week=0,
                          days_inactive=0, practice_accuracy=80, activities_week=3)
        assert rule_based_engagement_label(practising) == 1
        guessing = dict(practising, practice_accuracy=30, activities_week=3, login_streak=0, days_inactive=5)
        assert rule_based_engagement_label(guessing) == 0

    def test_synthetic_data_has_all_inputs(self):
        data = generate_synthetic_training_data(200)
        assert list(data.columns) == FEATURE_NAMES + ['engaged']
        assert data['practice_accuracy'].between(0, 100).all() and (data['activities_week'] >= 0).all()

    def test_shipped_model_uses_all_inputs(self):
        path = os.path.join(os.path.dirname(__file__), '..', 'app', 'ml_models', 'saved_models', 'engagement_model.pkl')
        assert EngagementPredictor(model_path=path).feature_names == FEATURE_NAMES

    def test_old_five_input_model_still_works_and_retrains_with_seven(self, tmp_path):
        data = generate_synthetic_training_data(300, random_state=3)
        old_inputs = FEATURE_NAMES[:5]
        scaler = StandardScaler().fit(data[old_inputs])
        model = LogisticRegression(max_iter=500).fit(scaler.transform(data[old_inputs]), data['engaged'])
        path = str(tmp_path / 'old.pkl')
        joblib.dump({'model': model, 'scaler': scaler, 'algorithm': 'logistic', 'metrics': {},
                     'feature_names': old_inputs}, path)

        predictor = EngagementPredictor(model_path=path, algorithm='logistic')
        everything = dict(time_spent_today=20, avg_quiz_score=70, login_streak=3, lessons_completed_week=2,
                          days_inactive=0, practice_accuracy=75, activities_week=4)
        assert 0 <= predictor.predict_engagement(everything)['engaged_probability'] <= 1

        predictor.train_model(data)
        assert predictor.feature_names == FEATURE_NAMES
        assert EngagementPredictor(model_path=path).feature_names == FEATURE_NAMES

    def test_low_practice_accuracy_gives_a_tip(self):
        tips = EngagementPredictor._activity_tips({'practice_accuracy': 30, 'activities_week': 0})
        assert len(tips) == 2


def test_support_plan_review_compares_practice_accuracy(app, test_student, test_teacher):
    from app.models.intervention_plan import InterventionPlan
    with app.app_context():
        plan = InterventionPlan(student_id=test_student['id'], teacher_id=test_teacher['id'],
                                intervention_type='extra_practice', goal='More practice',
                                review_date=datetime.utcnow() + timedelta(days=7),
                                baseline_snapshot={'engagement_features': {'practice_accuracy': 40.0}},
                                review_snapshot={'engagement_features': {'practice_accuracy': 75.5}},
                                status='reviewed', outcome='improved', reviewed_at=datetime.utcnow())
        never_practised = InterventionPlan(student_id=test_student['id'], teacher_id=test_teacher['id'],
                                           intervention_type='extra_practice', goal='More practice',
                                           review_date=datetime.utcnow(), baseline_snapshot={},
                                           review_snapshot={'engagement_features': {'practice_accuracy': 60.0}},
                                           status='reviewed', outcome='improved', reviewed_at=datetime.utcnow())
        db.session.add_all([plan, never_practised])
        db.session.commit()
        assert plan.metric_comparison()['practice_accuracy'] == {'baseline': 40.0, 'review': 75.5, 'change': 35.5}
        assert never_practised.metric_comparison()['practice_accuracy']['change'] is None
