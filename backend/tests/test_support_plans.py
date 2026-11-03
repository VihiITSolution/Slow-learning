"""API and persistence tests for teacher support plan outcome tracking."""
from datetime import datetime, timedelta

from conftest import get_auth_headers
from app import db
from app.models.intervention_plan import InterventionPlan
from app.models.user import User
import app.routes.support_plans as support_plans


def snapshot(student):
    return {
        'total_xp': student.total_xp or 0,
        'lessons_completed': student.lessons_completed or 0,
        'quizzes_taken': student.quizzes_taken or 0,
        'total_time_spent': student.total_time_spent or 0,
        'current_streak': student.current_streak or 0,
        'engaged': True,
        'risk_level': 'low',
        'confidence': 0.9,
        'engagement_features': {},
        'captured_at': datetime.utcnow().isoformat(),
    }


def plan_payload(student_id, **overrides):
    payload = {
        'student_id': student_id,
        'intervention_type': 'visual_support',
        'goal': 'Complete two short reading activities this week.',
        'notes': 'Use illustrated cards.',
        'review_date': (datetime.utcnow() + timedelta(days=7)).date().isoformat(),
    }
    payload.update(overrides)
    return payload


class TestInterventionPlanModel:
    def test_serializes_baseline_and_review_comparison(self, app, test_student, test_teacher):
        with app.app_context():
            plan = InterventionPlan(
                student_id=test_student['id'],
                teacher_id=test_teacher['id'],
                intervention_type='visual_support',
                goal='Improve lesson participation',
                review_date=datetime.utcnow() + timedelta(days=7),
                baseline_snapshot={'total_xp': 10, 'lessons_completed': 1, 'quizzes_taken': 1, 'total_time_spent': 5, 'current_streak': 1, 'engaged': False, 'risk_level': 'high'},
                review_snapshot={'total_xp': 40, 'lessons_completed': 3, 'quizzes_taken': 2, 'total_time_spent': 20, 'current_streak': 3, 'engaged': True, 'risk_level': 'low'},
                status='reviewed',
                outcome='improved',
                reviewed_at=datetime.utcnow(),
            )
            db.session.add(plan)
            db.session.commit()

            data = plan.to_dict()
            assert data['baseline_snapshot']['risk_level'] == 'high'
            assert data['metric_comparison']['total_xp']['change'] == 30
            assert data['metric_comparison']['engagement'] == {'baseline': False, 'review': True}


class TestSupportPlanRoutes:
    def test_teacher_creates_and_lists_plan(self, client, teacher_token, test_student, monkeypatch):
        monkeypatch.setattr(support_plans, 'capture_snapshot', snapshot)
        headers = get_auth_headers(teacher_token)

        response = client.post('/api/support-plans/', json=plan_payload(test_student['id']), headers=headers)
        assert response.status_code == 201
        created = response.get_json()['data']
        assert created['status'] == 'active'
        assert created['student_id'] == test_student['id']
        assert created['baseline_snapshot']['risk_level'] == 'low'

        response = client.get('/api/support-plans/?status=active', headers=headers)
        assert response.status_code == 200
        assert len(response.get_json()['data']) == 1

    def test_student_cannot_access_support_plans(self, client, student_token):
        response = client.get('/api/support-plans/', headers=get_auth_headers(student_token))
        assert response.status_code == 403

    def test_create_rejects_bad_student_and_invalid_data(self, client, teacher_token, test_student, test_teacher, monkeypatch):
        monkeypatch.setattr(support_plans, 'capture_snapshot', snapshot)
        headers = get_auth_headers(teacher_token)

        assert client.post('/api/support-plans/', json=plan_payload(test_teacher['id']), headers=headers).status_code == 404
        assert client.post('/api/support-plans/', json=plan_payload(test_student['id'], intervention_type='unsupported'), headers=headers).status_code == 400
        assert client.post('/api/support-plans/', json=plan_payload(test_student['id'], review_date='2020-01-01'), headers=headers).status_code == 400

    def test_author_or_admin_can_update_active_plan(self, app, client, teacher_token, admin_token, test_student, test_teacher, monkeypatch):
        monkeypatch.setattr(support_plans, 'capture_snapshot', snapshot)
        headers = get_auth_headers(teacher_token)
        plan_id = client.post('/api/support-plans/', json=plan_payload(test_student['id']), headers=headers).get_json()['data']['id']

        updated = plan_payload(test_student['id'], goal='Use a visual timetable each day.')
        assert client.put(f'/api/support-plans/{plan_id}', json=updated, headers=headers).status_code == 200
        assert client.put(f'/api/support-plans/{plan_id}', json=updated, headers=get_auth_headers(admin_token)).status_code == 200

        with app.app_context():
            another_teacher = User(username='another_teacher', email='another@example.com', role='teacher')
            another_teacher.set_password('password123')
            db.session.add(another_teacher)
            db.session.commit()
        another_token = client.post('/api/auth/login', json={'username': 'another_teacher', 'password': 'password123'}).get_json()['access_token']
        assert client.put(f'/api/support-plans/{plan_id}', json=updated, headers=get_auth_headers(another_token)).status_code == 403

    def test_review_captures_outcome_and_locks_plan(self, app, client, teacher_token, test_student, monkeypatch):
        monkeypatch.setattr(support_plans, 'capture_snapshot', snapshot)
        headers = get_auth_headers(teacher_token)
        plan_id = client.post('/api/support-plans/', json=plan_payload(test_student['id']), headers=headers).get_json()['data']['id']

        with app.app_context():
            student = User.query.get(test_student['id'])
            student.total_xp = 50
            student.lessons_completed = 3
            db.session.commit()

        response = client.post(f'/api/support-plans/{plan_id}/review', json={'outcome': 'improved', 'outcome_notes': 'The student finished the activities.'}, headers=headers)
        assert response.status_code == 200
        reviewed = response.get_json()['data']
        assert reviewed['status'] == 'reviewed'
        assert reviewed['outcome'] == 'improved'
        assert reviewed['metric_comparison']['total_xp']['change'] == 50
        assert client.post(f'/api/support-plans/{plan_id}/review', json={'outcome': 'improved'}, headers=headers).status_code == 409
        assert client.put(f'/api/support-plans/{plan_id}', json=plan_payload(test_student['id']), headers=headers).status_code == 409

    def test_csv_export_has_only_reviewed_pseudonymous_records(self, client, teacher_token, test_student, monkeypatch):
        monkeypatch.setattr(support_plans, 'capture_snapshot', snapshot)
        headers = get_auth_headers(teacher_token)
        plan_id = client.post('/api/support-plans/', json=plan_payload(test_student['id']), headers=headers).get_json()['data']['id']
        client.post(f'/api/support-plans/{plan_id}/review', json={'outcome': 'unchanged'}, headers=headers)

        response = client.get('/api/support-plans/export', headers=headers)
        body = response.get_data(as_text=True)
        assert response.status_code == 200
        assert response.mimetype == 'text/csv'
        assert 'student_id' in body
        assert str(test_student['id']) in body
        assert test_student['username'] not in body
