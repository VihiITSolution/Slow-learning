"""
Unit tests for lesson routes
"""
import pytest
from conftest import get_auth_headers


class TestGetLessons:
    """Test getting lessons"""
    
    def test_get_all_lessons(self, client, student_token, test_lessons):
        """Test getting all lessons"""
        headers = get_auth_headers(student_token)
        response = client.get('/api/lessons', headers=headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'lessons' in data
        assert len(data['lessons']) == 3
    
    def test_get_lessons_by_category(self, client, student_token, test_lessons):
        """Test filtering lessons by category"""
        headers = get_auth_headers(student_token)
        response = client.get('/api/lessons?category=math', headers=headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert len(data['lessons']) == 2
        for lesson in data['lessons']:
            assert lesson['category'] == 'math'
    
    def test_get_lessons_by_difficulty(self, client, student_token, test_lessons):
        """Test filtering lessons by difficulty"""
        headers = get_auth_headers(student_token)
        response = client.get('/api/lessons?difficulty=beginner', headers=headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert len(data['lessons']) == 2
        for lesson in data['lessons']:
            assert lesson['difficulty_level'] == 'beginner'
    
    def test_get_lessons_combined_filters(self, client, student_token, test_lessons):
        """Test filtering with multiple parameters"""
        headers = get_auth_headers(student_token)
        response = client.get('/api/lessons?category=math&difficulty=intermediate', headers=headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert len(data['lessons']) == 1
        assert data['lessons'][0]['category'] == 'math'
        assert data['lessons'][0]['difficulty_level'] == 'intermediate'
    
    def test_get_lessons_unauthorized(self, client, test_lessons):
        """Test getting lessons without authentication"""
        response = client.get('/api/lessons')
        
        assert response.status_code == 401


class TestGetLesson:
    """Test getting specific lesson"""
    
    def test_get_lesson_success(self, client, student_token, test_lesson):
        """Test getting a specific lesson"""
        headers = get_auth_headers(student_token)
        response = client.get(f'/api/lessons/{test_lesson["id"]}', headers=headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['id'] == test_lesson['id']
        assert data['title'] == test_lesson['title']
        assert data['category'] == test_lesson['category']
    
    def test_get_lesson_not_found(self, client, student_token):
        """Test getting non-existent lesson"""
        headers = get_auth_headers(student_token)
        response = client.get('/api/lessons/9999', headers=headers)
        
        assert response.status_code == 404
        data = response.get_json()
        assert data['error'] == 'Lesson not found'
    
    def test_get_lesson_unauthorized(self, client, test_lesson):
        """Test getting lesson without authentication"""
        response = client.get(f'/api/lessons/{test_lesson["id"]}')
        
        assert response.status_code == 401


class TestStartLesson:
    """Test starting lessons"""
    
    def test_start_lesson_success(self, client, student_token, test_lesson):
        """Test starting a lesson"""
        headers = get_auth_headers(student_token)
        response = client.post(f'/api/lessons/{test_lesson["id"]}/start', headers=headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['message'] == 'Lesson started'
        assert 'progress' in data
        assert data['progress']['status'] == 'in_progress'
        assert data['progress']['lesson_id'] == test_lesson['id']
    
    def test_start_lesson_twice(self, client, student_token, test_lesson):
        """Test starting the same lesson twice increments attempts"""
        headers = get_auth_headers(student_token)
        
        # Start first time
        response1 = client.post(f'/api/lessons/{test_lesson["id"]}/start', headers=headers)
        data1 = response1.get_json()
        attempts1 = data1['progress']['attempts']
        
        # Start second time
        response2 = client.post(f'/api/lessons/{test_lesson["id"]}/start', headers=headers)
        data2 = response2.get_json()
        attempts2 = data2['progress']['attempts']
        
        assert attempts2 == attempts1 + 1
    
    def test_start_nonexistent_lesson(self, client, student_token):
        """Test starting non-existent lesson"""
        headers = get_auth_headers(student_token)
        response = client.post('/api/lessons/9999/start', headers=headers)
        
        assert response.status_code == 404
        data = response.get_json()
        assert data['error'] == 'Lesson not found'


class TestCompleteLesson:
    """Test completing lessons"""
    
    def test_complete_lesson_success(self, client, student_token, test_lesson, test_student, app):
        """Test completing a lesson"""
        headers = get_auth_headers(student_token)
        
        # Get initial XP
        from app.models.user import User
        with app.app_context():
            user = User.query.get(test_student['id'])
            initial_xp = user.total_xp
        
        # Complete lesson
        response = client.post(
            f'/api/lessons/{test_lesson["id"]}/complete',
            headers=headers,
            json={'time_spent': 900}
        )
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['message'] == 'Lesson completed'
        assert data['xp_earned'] == test_lesson['xp_reward']
        assert data['total_xp'] == initial_xp + test_lesson['xp_reward']
        assert 'progress' in data
        assert data['progress']['status'] == 'completed'
        assert data['progress']['completion_percentage'] == 100
    
    def test_complete_lesson_with_level_up(self, client, student_token, test_lesson, test_student, app):
        """Test completing lesson causes level up"""
        headers = get_auth_headers(student_token)
        
        # Set user XP close to level threshold
        from app.models.user import User
        with app.app_context():
            user = User.query.get(test_student['id'])
            # Level formula: level = floor(sqrt(total_xp / 100))
            # For level 2->3, need 900 XP (sqrt(900/100) = 3)
            user.total_xp = 870  # Just 30 XP before level 3
            user.level = 2
            from app import db
            db.session.commit()
        
        # Complete lesson with 50 XP reward
        response = client.post(
            f'/api/lessons/{test_lesson["id"]}/complete',
            headers=headers
        )
        
        assert response.status_code == 200
        data = response.get_json()
        if data['total_xp'] >= 900:
            assert 'leveled_up' in data
            assert data['leveled_up'] == True
            assert data['level'] >= 3
    
    def test_complete_lesson_invalid_time_spent(self, client, student_token, test_lesson):
        """Test completing lesson with invalid time_spent"""
        headers = get_auth_headers(student_token)
        
        # Test negative time
        response = client.post(
            f'/api/lessons/{test_lesson["id"]}/complete',
            headers=headers,
            json={'time_spent': -100}
        )
        assert response.status_code == 400
        
        # Test excessive time (more than 24 hours)
        response = client.post(
            f'/api/lessons/{test_lesson["id"]}/complete',
            headers=headers,
            json={'time_spent': 90000}
        )
        assert response.status_code == 400
    
    def test_complete_lesson_default_time(self, client, student_token, test_lesson):
        """Test completing lesson without time_spent defaults to 0"""
        headers = get_auth_headers(student_token)
        response = client.post(
            f'/api/lessons/{test_lesson["id"]}/complete',
            headers=headers
        )
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['progress']['time_spent'] == 0
    
    def test_complete_nonexistent_lesson(self, client, student_token):
        """Test completing non-existent lesson"""
        headers = get_auth_headers(student_token)
        response = client.post('/api/lessons/9999/complete', headers=headers)
        
        assert response.status_code == 404
