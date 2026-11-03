"""Tests for the admin endpoints and the API changes behind the UI flow fixes."""
from datetime import datetime

from app import db
from app.models.progress import Progress
from conftest import get_auth_headers


class TestAdminEndpoints:

    def test_only_admins_can_use_admin_endpoints(self, client, student_token, teacher_token):
        for token in (student_token, teacher_token):
            assert client.get('/api/admin/overview', headers=get_auth_headers(token)).status_code == 403
            assert client.get('/api/admin/users', headers=get_auth_headers(token)).status_code == 403
        assert client.get('/api/admin/overview').status_code == 401

    def test_overview_reports_real_counts(self, client, admin_token, test_student, test_teacher, test_lessons, app):
        with app.app_context():
            db.session.add(Progress(user_id=test_student['id'], lesson_id=test_lessons[0]['id'],
                                    status='completed', completed_at=datetime.utcnow()))
            db.session.commit()
        data = client.get('/api/admin/overview', headers=get_auth_headers(admin_token)).get_json()['data']
        assert data['users']['by_role'] == {'student': 1, 'teacher': 1, 'admin': 1}
        assert data['learning']['active_lessons'] == 3
        assert data['learning']['lessons_completed'] == 1
        first = next(l for l in data['lessons'] if l['id'] == test_lessons[0]['id'])
        assert first['completions'] == 1
        assert data['support_plans'] == {'active': 0, 'reviewed': 0,
                                         'outcomes': {'improved': 0, 'unchanged': 0, 'needs_support': 0}}

    def test_users_list_filters(self, client, admin_token, test_student, test_teacher):
        headers = get_auth_headers(admin_token)
        everyone = client.get('/api/admin/users', headers=headers).get_json()
        assert everyone['count'] == 3
        students = client.get('/api/admin/users?role=student', headers=headers).get_json()['data']
        assert [u['username'] for u in students] == ['test_student']
        found = client.get('/api/admin/users?search=teach', headers=headers).get_json()['data']
        assert [u['username'] for u in found] == ['test_teacher']
        assert client.get('/api/admin/users?role=king', headers=headers).status_code == 400


class TestFlowSupport:

    def test_login_accepts_email(self, client, test_admin):
        response = client.post('/api/auth/login', json={'username': test_admin['email'].upper(), 'password': test_admin['password']})
        assert response.status_code == 200
        assert response.get_json()['user']['role'] == 'admin'

    def test_lessons_list_includes_my_progress(self, client, student_token, test_lessons):
        headers = get_auth_headers(student_token)
        client.post(f"/api/lessons/{test_lessons[0]['id']}/complete", json={'time_spent': 60}, headers=headers)
        lessons = client.get('/api/lessons', headers=headers).get_json()['lessons']
        by_id = {l['id']: l for l in lessons}
        assert by_id[test_lessons[0]['id']]['status'] == 'completed'
        assert by_id[test_lessons[1]['id']]['status'] is None

    def test_dashboard_reports_completion_percentage(self, client, student_token, test_lessons):
        headers = get_auth_headers(student_token)
        client.post(f"/api/lessons/{test_lessons[0]['id']}/complete", json={'time_spent': 60}, headers=headers)
        stats = client.get('/api/analytics/dashboard', headers=headers).get_json()['user_stats']
        assert stats['total_lessons'] == 3
        assert stats['completion_percentage'] == 33


class TestQuizAndLessonData:
    """The lesson quiz must reach the browser and its attempts must reach the ML features."""

    def _quiz(self, app, lesson_id):
        from app.models.quiz import Quiz
        with app.app_context():
            quiz = Quiz(lesson_id=lesson_id, title='Q', passing_score=60, xp_reward=20, is_active=True, questions=[
                {'q': '1+1?', 'options': ['1', '2', '3'], 'correct': 1},
                {'q': '2+2?', 'options': ['4', '5', '3'], 'correct': 0},
            ])
            db.session.add(quiz)
            db.session.commit()

    def test_get_quiz_hides_answers(self, client, app, student_token, test_lessons):
        lesson_id = test_lessons[0]['id']
        self._quiz(app, lesson_id)
        response = client.get(f'/api/lessons/{lesson_id}/quiz', headers=get_auth_headers(student_token))
        assert response.status_code == 200
        questions = response.get_json()['questions']
        assert questions == [{'q': '1+1?', 'options': ['1', '2', '3']}, {'q': '2+2?', 'options': ['4', '5', '3']}]
        assert client.get(f"/api/lessons/{test_lessons[1]['id']}/quiz", headers=get_auth_headers(student_token)).status_code == 404

    def test_quiz_attempt_feeds_ml_features(self, client, app, student_token, test_student, test_lessons):
        lesson_id = test_lessons[0]['id']
        self._quiz(app, lesson_id)
        headers = get_auth_headers(student_token)
        result = client.post(f'/api/lessons/{lesson_id}/quiz', json={'answers': [1, 2], 'time_taken': 40}, headers=headers).get_json()
        assert result['score'] == 50.0 and result['passed'] is False and result['xp_earned'] == 0
        assert [r['is_correct'] for r in result['review']] == [True, False]
        client.post(f'/api/lessons/{lesson_id}/complete', json={'time_spent': 600}, headers=headers)

        with app.app_context():
            from app.models.user import User
            from app.services.engagement_service import EngagementService
            assert db.session.get(User, test_student['id']).quizzes_taken == 4  # fixture had 3; failed attempts count too
            features = EngagementService().extract_user_features(test_student['id'])
        assert features['avg_quiz_score'] == 50.0
        assert features['lessons_completed_week'] == 1
        assert features['time_spent_today'] == 10.0

    def test_quiz_xp_only_on_first_pass(self, client, app, student_token, test_lessons):
        lesson_id = test_lessons[0]['id']
        self._quiz(app, lesson_id)
        headers = get_auth_headers(student_token)
        first = client.post(f'/api/lessons/{lesson_id}/quiz', json={'answers': [1, 0]}, headers=headers).get_json()
        again = client.post(f'/api/lessons/{lesson_id}/quiz', json={'answers': [1, 0]}, headers=headers).get_json()
        assert first['xp_earned'] == 20 and again['xp_earned'] == 0

    def test_reviewing_a_finished_lesson_keeps_it_finished_and_pays_no_xp_twice(self, client, app, student_token, test_student, test_lessons):
        lesson_id = test_lessons[0]['id']
        headers = get_auth_headers(student_token)
        first = client.post(f'/api/lessons/{lesson_id}/complete', json={'time_spent': 300}, headers=headers).get_json()
        start = client.post(f'/api/lessons/{lesson_id}/start', headers=headers).get_json()
        assert start['progress']['status'] == 'completed'
        again = client.post(f'/api/lessons/{lesson_id}/complete', json={'time_spent': 120}, headers=headers).get_json()
        assert first['xp_earned'] == 50 and again['xp_earned'] == 0 and again['already_completed'] is True
        with app.app_context():
            from app.models.user import User
            assert db.session.get(User, test_student['id']).lessons_completed == 3  # fixture 2 + 1, not +2


class TestAssessmentProfile:

    def test_only_staff_can_save_a_learning_style(self, client, student_token, teacher_token, test_student):
        payload = {'user_id': test_student['id'], 'learning_style': 'Visual Learner', 'assessment_score': 4, 'total_questions': 5}
        assert client.post('/api/assessment/save-to-profile', json=payload).status_code == 401
        assert client.post('/api/assessment/save-to-profile', json=payload, headers=get_auth_headers(student_token)).status_code == 403
        response = client.post('/api/assessment/save-to-profile', json=payload, headers=get_auth_headers(teacher_token))
        assert response.status_code == 200
        assert response.get_json()['user']['learning_style'] == 'Visual Learner'


class TestRealDataReachesTheModel:

    def test_sign_up_starts_the_streak(self, client, app):
        response = client.post('/api/auth/register', json={'username': 'dilan', 'email': 'dilan@x.com', 'password': 'Passw0rd!'})
        assert response.status_code == 201
        assert response.get_json()['user']['current_streak'] == 1
        with app.app_context():
            from app.models.user import User
            from app.services.engagement_service import EngagementService
            user = User.query.filter_by(username='dilan').first()
            assert EngagementService().extract_user_features(user.id)['login_streak'] == 1

    def test_recommendations_carry_lesson_titles(self, client, student_token, teacher_token, test_lessons):
        client.post(f"/api/lessons/{test_lessons[0]['id']}/complete", json={'time_spent': 60}, headers=get_auth_headers(student_token))
        mine = client.get('/api/ml/engagement/my-report', headers=get_auth_headers(student_token)).get_json()['data']
        titles = {l['id']: l['title'] for l in test_lessons}
        assert mine['recommendations'] and all(r['title'] == titles[r['lesson_id']] for r in mine['recommendations'])
        report = client.get('/api/ml/engagement/class-report', headers=get_auth_headers(teacher_token)).get_json()['data']
        student = report['students'][0]
        assert all('title' in r for r in student['recommendations'])
