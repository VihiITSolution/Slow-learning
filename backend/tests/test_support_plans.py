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
            student.total_xp = 150  # fixture student starts at 100 XP
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


class TestSupportPlanHardening:
    def test_students_are_forbidden_on_every_endpoint(self, client, teacher_token, student_token, test_student, monkeypatch):
        monkeypatch.setattr(support_plans, 'capture_snapshot', snapshot)
        plan_id = client.post('/api/support-plans/', json=plan_payload(test_student['id']),
                              headers=get_auth_headers(teacher_token)).get_json()['data']['id']
        headers = get_auth_headers(student_token)
        responses = [
            client.post('/api/support-plans/', json=plan_payload(test_student['id']), headers=headers),
            client.get(f'/api/support-plans/{plan_id}', headers=headers),
            client.put(f'/api/support-plans/{plan_id}', json={'goal': 'x'}, headers=headers),
            client.post(f'/api/support-plans/{plan_id}/review', json={'outcome': 'improved'}, headers=headers),
            client.get('/api/support-plans/export', headers=headers),
        ]
        assert [r.status_code for r in responses] == [403] * len(responses)

    def test_ml_failure_does_not_block_create_or_review(self, client, teacher_token, test_student, monkeypatch):
        def broken_prediction(_user_id):
            raise RuntimeError('model unavailable')
        monkeypatch.setattr(support_plans.engagement_service, 'predict_user_engagement', broken_prediction)
        headers = get_auth_headers(teacher_token)

        response = client.post('/api/support-plans/', json=plan_payload(test_student['id']), headers=headers)
        assert response.status_code == 201
        baseline = response.get_json()['data']['baseline_snapshot']
        assert baseline['total_xp'] == 100
        assert baseline['engaged'] is None and baseline['risk_level'] is None
        assert 'ml_error' in baseline

        plan_id = response.get_json()['data']['id']
        response = client.post(f'/api/support-plans/{plan_id}/review', json={'outcome': 'unchanged'}, headers=headers)
        assert response.status_code == 200

    def test_missing_or_invalid_fields_return_400_not_500(self, client, teacher_token, test_student, monkeypatch):
        monkeypatch.setattr(support_plans, 'capture_snapshot', snapshot)
        headers = get_auth_headers(teacher_token)
        payload = plan_payload(test_student['id'])

        assert client.post('/api/support-plans/', json={**payload, 'student_id': None}, headers=headers).status_code == 400
        assert client.post('/api/support-plans/', json={**payload, 'student_id': 'abc'}, headers=headers).status_code == 404
        assert client.post('/api/support-plans/', json={**payload, 'goal': 123}, headers=headers).status_code == 400
        assert client.post('/api/support-plans/', json={**payload, 'goal': '   '}, headers=headers).status_code == 400
        assert client.post('/api/support-plans/', json={**payload, 'intervention_type': 'other'}, headers=headers).status_code == 400
        assert client.post('/api/support-plans/', json={**payload, 'notes': ['x']}, headers=headers).status_code == 400

        plan_id = client.post('/api/support-plans/', json=payload, headers=headers).get_json()['data']['id']
        review_url = f'/api/support-plans/{plan_id}/review'
        assert client.post(review_url, json={'outcome': 5}, headers=headers).status_code == 400
        assert client.post(review_url, json={'outcome': 'great'}, headers=headers).status_code == 400

    def test_partial_update_keeps_other_fields(self, client, teacher_token, test_student, monkeypatch):
        monkeypatch.setattr(support_plans, 'capture_snapshot', snapshot)
        headers = get_auth_headers(teacher_token)
        created = client.post('/api/support-plans/', json=plan_payload(test_student['id']), headers=headers).get_json()['data']

        response = client.put(f"/api/support-plans/{created['id']}", json={'notes': 'Now using a visual timetable.'}, headers=headers)
        assert response.status_code == 200
        updated = response.get_json()['data']
        assert updated['notes'] == 'Now using a visual timetable.'
        assert updated['goal'] == created['goal']
        assert updated['intervention_type'] == created['intervention_type']
        assert updated['review_date'] == created['review_date']
        assert updated['baseline_snapshot'] == created['baseline_snapshot']

        past = (datetime.utcnow() - timedelta(days=3)).date().isoformat()
        assert client.put(f"/api/support-plans/{created['id']}", json={'review_date': past}, headers=headers).status_code == 400

    def test_overdue_plan_can_still_be_edited(self, app, client, teacher_token, test_student, monkeypatch):
        monkeypatch.setattr(support_plans, 'capture_snapshot', snapshot)
        headers = get_auth_headers(teacher_token)
        plan_id = client.post('/api/support-plans/', json=plan_payload(test_student['id']), headers=headers).get_json()['data']['id']
        overdue = datetime.utcnow() - timedelta(days=3)
        with app.app_context():
            plan = InterventionPlan.query.get(plan_id)
            plan.review_date = overdue
            db.session.commit()

        response = client.put(f'/api/support-plans/{plan_id}', headers=headers, json={
            'goal': 'Updated goal', 'review_date': overdue.date().isoformat(),
        })
        assert response.status_code == 200
        assert response.get_json()['data']['goal'] == 'Updated goal'

    def test_csv_export_neutralises_spreadsheet_formulas(self, client, teacher_token, test_student, monkeypatch):
        monkeypatch.setattr(support_plans, 'capture_snapshot', snapshot)
        headers = get_auth_headers(teacher_token)
        plan_id = client.post('/api/support-plans/', json=plan_payload(test_student['id'], goal='=HYPERLINK("http://x")'),
                              headers=headers).get_json()['data']['id']
        client.post(f'/api/support-plans/{plan_id}/review', json={'outcome': 'improved', 'outcome_notes': '+cmd'}, headers=headers)

        import csv, io
        rows = list(csv.DictReader(io.StringIO(client.get('/api/support-plans/export', headers=headers).get_data(as_text=True))))
        assert len(rows) == 1
        assert rows[0]['goal'].startswith("'=")
        assert rows[0]['outcome_notes'] == "'+cmd"
        assert rows[0]['student_id'] == str(test_student['id'])

    def test_csv_export_redacts_student_identity_in_free_text(self, client, teacher_token, test_student, monkeypatch):
        monkeypatch.setattr(support_plans, 'capture_snapshot', snapshot)
        headers = get_auth_headers(teacher_token)
        goal = f"Help {test_student['username']} read two pages"
        plan_id = client.post('/api/support-plans/', json=plan_payload(test_student['id'], goal=goal),
                              headers=headers).get_json()['data']['id']
        client.post(f'/api/support-plans/{plan_id}/review', headers=headers,
                    json={'outcome': 'improved', 'outcome_notes': f"Emailed {test_student['email']} parents"})

        body = client.get('/api/support-plans/export', headers=headers).get_data(as_text=True)
        assert test_student['username'] not in body
        assert test_student['email'] not in body
        assert 'Help [student] read two pages' in body
        assert 'Emailed [student] parents' in body
