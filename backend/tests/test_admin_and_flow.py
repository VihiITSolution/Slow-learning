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
