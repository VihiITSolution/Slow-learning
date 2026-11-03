"""
Tests for the ML models: engagement predictor, feature extraction, retraining
and the lesson recommender.

Tests that train a model write it to a temporary folder, never to the real
app/ml_models/saved_models/engagement_model.pkl.
"""
import os
import shutil
from datetime import datetime, timedelta

import pandas as pd
import pytest

from app import db
from app.ml_models.engagement_predictor import (
    EngagementPredictor,
    FEATURE_NAMES,
    generate_synthetic_training_data,
    rule_based_engagement_label,
)
from app.ml_models.learning_recommender import LearningRecommender, difficulty_rank
from app.models.lesson import Lesson
from app.models.progress import Progress
from app.models.user import User
from conftest import get_auth_headers

REAL_MODEL = os.path.join(os.path.dirname(__file__), '..', 'app', 'ml_models', 'saved_models', 'engagement_model.pkl')


@pytest.fixture
def trained(tmp_path):
    """A small logistic model trained into a temporary file."""
    predictor = EngagementPredictor(model_path=str(tmp_path / 'model.pkl'), algorithm='logistic')
    predictor.train_model(generate_synthetic_training_data(600, random_state=1))
    return predictor


def features(**overrides):
    base = dict(time_spent_today=20, avg_quiz_score=60, login_streak=3, lessons_completed_week=2, days_inactive=1)
    base.update(overrides)
    return base


# ---------------------------------------------------------------------- #
# Engagement predictor
# ---------------------------------------------------------------------- #
class TestEngagementPredictor:

    def test_missing_quiz_score_is_neutral_not_zero(self, trained):
        prepared = trained.prepare_features(features(avg_quiz_score=None))
        assert prepared['avg_quiz_score'][0] == pytest.approx(trained.scaler.mean_[FEATURE_NAMES.index('avg_quiz_score')])

        missing = trained.predict_engagement(features(avg_quiz_score=None))['engaged_probability']
        zero = trained.predict_engagement(features(avg_quiz_score=0))['engaged_probability']
        assert missing > zero

    def test_out_of_range_values_are_clipped(self, trained):
        prepared = trained.prepare_features(features(days_inactive=999, avg_quiz_score=150, time_spent_today=-5))
        assert prepared['days_inactive'][0] == 60
        assert prepared['avg_quiz_score'][0] == 100
        assert prepared['time_spent_today'][0] == 0

    def test_requested_algorithm_is_used_even_when_a_model_exists(self, tmp_path):
        path = str(tmp_path / 'model.pkl')
        EngagementPredictor(model_path=path, algorithm='neural').train_model(generate_synthetic_training_data(400, random_state=2))

        predictor = EngagementPredictor(model_path=path, algorithm='logistic')
        assert predictor.algorithm == 'neural'  # what is on disk
        result = predictor.train_model(generate_synthetic_training_data(400, random_state=3))
        assert result['metrics']['algorithm'] == 'logistic'
        assert EngagementPredictor(model_path=path).algorithm == 'logistic'

    def test_auto_selects_by_cross_validation_and_reports_held_out_metrics(self, tmp_path):
        predictor = EngagementPredictor(model_path=str(tmp_path / 'model.pkl'), algorithm='auto')
        metrics = predictor.train_model(generate_synthetic_training_data(500, random_state=4), data_source='test')['metrics']

        assert set(metrics['model_selection']) == {'logistic', 'svm', 'neural'}
        best = max(metrics['model_selection'], key=lambda a: metrics['model_selection'][a]['cv_accuracy_mean'])
        assert metrics['algorithm'] == best
        assert metrics['test_samples'] == 100 and metrics['training_samples'] == 400
        for key in ('accuracy', 'precision', 'recall', 'f1_score', 'roc_auc'):
            assert 0 <= metrics[key] <= 1
        assert metrics['data_source'] == 'test'
        assert 'held-out' in metrics['evaluation']

    def test_running_predictor_picks_up_a_retrained_model(self, tmp_path):
        path = str(tmp_path / 'model.pkl')
        EngagementPredictor(model_path=path, algorithm='neural').train_model(generate_synthetic_training_data(400, random_state=5))
        running = EngagementPredictor(model_path=path)
        assert running.algorithm == 'neural'

        EngagementPredictor(model_path=path, algorithm='logistic').train_model(generate_synthetic_training_data(400, random_state=6))
        os.utime(path, (datetime.now().timestamp() + 5,) * 2)  # make sure the mtime differs on coarse filesystems
        assert running.predict_engagement(features())['algorithm_used'] == 'logistic'

    def test_training_tolerates_missing_quiz_scores(self, tmp_path):
        data = generate_synthetic_training_data(300, random_state=7)
        data.loc[data.index[:40], 'avg_quiz_score'] = None
        predictor = EngagementPredictor(model_path=str(tmp_path / 'model.pkl'), algorithm='logistic')
        assert predictor.train_model(data)['success'] is True

    def test_synthetic_generator_seed_gives_fresh_data(self):
        a = generate_synthetic_training_data(50, random_state=1)
        b = generate_synthetic_training_data(50, random_state=2)
        assert not a.equals(b)
        assert generate_synthetic_training_data(50).equals(generate_synthetic_training_data(50))

    def test_shipped_model_loads_and_predicts(self):
        assert os.path.exists(REAL_MODEL)
        predictor = EngagementPredictor(model_path=REAL_MODEL)
        assert predictor.model is not None
        result = predictor.predict_engagement(features())
        assert 0 <= result['engaged_probability'] <= 1
        assert result['risk_level'] in {'low', 'moderate-low', 'moderate', 'high', 'critical'}


def test_rule_based_label():
    assert rule_based_engagement_label(features(time_spent_today=30, avg_quiz_score=80, login_streak=5,
                                                lessons_completed_week=2, days_inactive=0)) == 1
    assert rule_based_engagement_label(features(time_spent_today=0, avg_quiz_score=40, login_streak=0,
                                                lessons_completed_week=0, days_inactive=10)) == 0
    # missing quiz counts as "not met": 2 of the other 4 is not enough
    assert rule_based_engagement_label(features(time_spent_today=0, avg_quiz_score=None, login_streak=3,
                                                lessons_completed_week=1, days_inactive=10)) == 0


# ---------------------------------------------------------------------- #
# Feature extraction for real students
# ---------------------------------------------------------------------- #
class TestFeatureExtraction:

    def _student(self, **fields):
        user = User(username=fields.pop('username', 'feat_student'), email=fields.pop('email', 'feat@x.com'), role='student', **fields)
        user.set_password('pw')
        db.session.add(user)
        db.session.commit()
        return user

    def test_stale_streak_is_reset(self, app):
        from app.services.engagement_service import EngagementService
        with app.app_context():
            gone = self._student(current_streak=8, last_login=datetime.utcnow() - timedelta(days=20))
            recent = self._student(username='recent', email='recent@x.com', current_streak=4,
                                   last_login=datetime.utcnow() - timedelta(days=1))
            service = EngagementService()
            assert service.extract_user_features(gone.id)['login_streak'] == 0
            assert service.extract_user_features(gone.id)['days_inactive'] == 20
            assert service.extract_user_features(recent.id)['login_streak'] == 4

    def test_no_quiz_is_missing_and_inactivity_is_capped(self, app):
        from app.services.engagement_service import EngagementService
        with app.app_context():
            student = self._student(last_login=datetime.utcnow() - timedelta(days=400))
            extracted = EngagementService().extract_user_features(student.id)
            assert extracted['avg_quiz_score'] is None
            assert extracted['days_inactive'] == 60

    def test_student_engagement_route_uses_shared_features(self, client, app, student_token):
        response = client.get('/api/analytics/engagement', headers=get_auth_headers(student_token))
        assert response.status_code == 200
        metrics = response.get_json()['metrics']
        assert set(metrics) == set(FEATURE_NAMES)
        assert metrics['avg_quiz_score'] is None  # fixture student has no quiz attempts


# ---------------------------------------------------------------------- #
# Retrain endpoint
# ---------------------------------------------------------------------- #
class TestRetrainEndpoint:

    @pytest.fixture
    def isolated_model_dir(self, tmp_path, monkeypatch):
        """Run the endpoint against a copy of the model so the real file is never touched."""
        target = tmp_path / 'app' / 'ml_models' / 'saved_models'
        target.mkdir(parents=True)
        shutil.copy(REAL_MODEL, target / 'engagement_model.pkl')
        monkeypatch.chdir(tmp_path)
        return target / 'engagement_model.pkl'

    def test_rejects_unknown_algorithm(self, client, teacher_token):
        response = client.post('/api/ml/model/train', json={'algorithm': 'random-forest'},
                               headers=get_auth_headers(teacher_token))
        assert response.status_code == 400

    def test_retrain_uses_requested_algorithm_and_takes_effect_immediately(self, client, teacher_token, isolated_model_dir):
        from app.routes import ml_analytics
        ml_analytics.engagement_service.predictor.load_model()

        response = client.post('/api/ml/model/train', headers=get_auth_headers(teacher_token),
                               json={'algorithm': 'logistic', 'use_synthetic_data': True, 'n_samples': 400})
        assert response.status_code == 200
        body = response.get_json()
        metrics = body['data']['metrics']
        assert metrics['algorithm'] == 'logistic'
        assert 0 < metrics['accuracy'] <= 1  # top-level, so the UI can always show it
        assert 'synthetic' in body['labels']
        assert ml_analytics.engagement_service.predictor.algorithm == 'logistic'


# ---------------------------------------------------------------------- #
# Lesson recommender
# ---------------------------------------------------------------------- #
LESSONS = pd.DataFrame([
    {'id': 1, 'title': 'Counting to ten', 'description': 'count numbers', 'category': 'math', 'difficulty_level': 'beginner', 'order_index': 1},
    {'id': 2, 'title': 'Adding small numbers', 'description': 'add numbers math', 'category': 'math', 'difficulty_level': 'beginner', 'order_index': 2},
    {'id': 3, 'title': 'Letters and sounds', 'description': 'reading letters', 'category': 'reading', 'difficulty_level': 'beginner', 'order_index': 3},
    {'id': 4, 'title': 'Short words', 'description': 'reading words', 'category': 'reading', 'difficulty_level': 'beginner', 'order_index': 4},
    {'id': 5, 'title': 'Bigger numbers', 'description': 'count numbers to fifty math', 'category': 'math', 'difficulty_level': 'intermediate', 'order_index': 5},
    {'id': 6, 'title': 'Story time', 'description': 'reading a story', 'category': 'reading', 'difficulty_level': 'advanced', 'order_index': 6},
])


class TestLearningRecommender:

    def test_difficulty_names_are_normalised(self):
        assert difficulty_rank('beginner') == difficulty_rank('easy') == 1
        assert difficulty_rank('Intermediate') == difficulty_rank('medium') == 2
        assert difficulty_rank('advanced') == difficulty_rank('hard') == 3

    def test_new_student_gets_easiest_lessons_in_order(self):
        recs = LearningRecommender().get_adaptive_recommendations({'completed_lessons': []}, LESSONS, 3)
        assert [r['lesson_id'] for r in recs] == [1, 2, 3]

    def test_history_drives_recommendations(self):
        recs = LearningRecommender().get_adaptive_recommendations(
            {'completed_lessons': [1], 'avg_quiz_score': 70}, LESSONS, 2)
        ids = [r['lesson_id'] for r in recs]
        assert 1 not in ids
        assert ids[0] in (2, 5)  # math lessons are most similar to "Counting to ten"
        assert recs[0]['reason'].startswith('Similar to lessons you completed')

    def test_high_scores_target_harder_lessons_with_fallback(self):
        recs = LearningRecommender().get_adaptive_recommendations(
            {'completed_lessons': [1, 2, 3], 'avg_quiz_score': 90}, LESSONS, 5)
        assert {r['lesson_id'] for r in recs} == {5, 6}
        everything_but_6 = [1, 2, 3, 4, 5]
        recs = LearningRecommender().get_adaptive_recommendations(
            {'completed_lessons': everything_but_6, 'avg_quiz_score': 30}, LESSONS, 5)
        assert [r['lesson_id'] for r in recs] == [6]  # nothing left at beginner level

    def test_all_completed_returns_nothing(self):
        assert LearningRecommender().get_content_based_recommendations([1, 2, 3, 4, 5, 6], LESSONS) == []

    def test_cached_features_follow_catalogue_changes(self):
        recommender = LearningRecommender()
        recommender.get_content_based_recommendations([1], LESSONS.iloc[:4])
        bigger = pd.concat([LESSONS, pd.DataFrame([{'id': 7, 'title': 'Counting by twos', 'description': 'count numbers math',
                                                     'category': 'math', 'difficulty_level': 'beginner', 'order_index': 7}])])
        ids = [r['lesson_id'] for r in recommender.get_content_based_recommendations([1], bigger, 10)]
        assert 7 in ids


class TestRecommendationEndpoint:

    def test_new_student_gets_recommendations(self, client, student_token, test_lessons):
        response = client.get('/api/recommendations/', headers=get_auth_headers(student_token))
        assert response.status_code == 200
        assert len(response.get_json()['recommendations']) == 3

    def test_recommendations_use_history(self, client, student_token, test_lessons):
        headers = get_auth_headers(student_token)
        client.post(f"/api/lessons/{test_lessons[0]['id']}/complete", json={'time_spent': 300}, headers=headers)
        recs = client.get('/api/recommendations/', headers=headers).get_json()['recommendations']
        assert test_lessons[0]['id'] not in [r['lesson']['id'] for r in recs]
        assert recs[0]['reason'].startswith('Similar to lessons you completed')


def test_seed_lessons_can_run_more_than_once(app):
    from seed_lessons import seed
    with app.app_context():
        seed()
        first = Lesson.query.count()
        db.drop_all()
        db.create_all()
        seed()
        assert Lesson.query.count() == first > 0


# ---------------------------------------------------------------------- #
# New students (no activity history yet)
# ---------------------------------------------------------------------- #
class TestNewStudents:

    def _make(self, username, created_days_ago):
        user = User(username=username, email=f'{username}@x.com', role='student',
                    created_at=datetime.utcnow() - timedelta(days=created_days_ago),
                    last_login=datetime.utcnow())
        user.set_password('pw')
        db.session.add(user)
        db.session.commit()
        return user

    def test_brand_new_student_is_reported_as_new_not_critical(self, app):
        from app.services.engagement_service import EngagementService
        with app.app_context():
            student = self._make('day_one', 0)
            service = EngagementService()
            result = service.predict_user_engagement(student.id)
            assert result['insufficient_data'] is True
            assert result['engaged'] is None and result['risk_level'] == 'new'
            assert 'model_prediction' in result

            actions = service.trigger_engagement_actions(student.id, result)
            assert actions['actions_taken'] == [] and 'skipped' in actions
            assert all(p['user_info']['user_id'] != student.id for p in service.get_disengaged_users(0.0))

            stats = service.get_engagement_statistics()
            assert stats['new_students'] == 1
            assert stats['engaged_users'] + stats['disengaged_users'] + stats['new_students'] == stats['total_users']

    def test_after_first_lesson_the_model_judges_the_student(self, app, test_lesson):
        from app.services.engagement_service import EngagementService
        with app.app_context():
            student = self._make('first_lesson', 0)
            db.session.add(Progress(user_id=student.id, lesson_id=test_lesson['id'], status='completed',
                                    completed_at=datetime.utcnow(), last_accessed=datetime.utcnow(), time_spent=900))
            db.session.commit()
            result = EngagementService().predict_user_engagement(student.id)
            assert result['insufficient_data'] is False
            assert result['engaged'] in (True, False)

    def test_inactive_old_account_is_still_judged(self, app):
        from app.services.engagement_service import EngagementService
        with app.app_context():
            student = self._make('old_idle', 30)
            result = EngagementService().predict_user_engagement(student.id)
            assert result['insufficient_data'] is False
            assert result['engaged'] in (True, False)
