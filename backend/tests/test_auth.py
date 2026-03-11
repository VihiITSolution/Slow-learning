"""
Unit tests for authentication routes
"""
import pytest
from conftest import get_auth_headers


class TestRegistration:
    """Test user registration"""
    
    def test_register_student_success(self, client):
        """Test successful student registration"""
        response = client.post('/api/auth/register', json={
            'username': 'newstudent',
            'email': 'newstudent@test.com',
            'password': 'password123',
            'role': 'student'
        })
        
        assert response.status_code == 201
        data = response.get_json()
        assert data['message'] == 'User registered successfully'
        assert data['user']['username'] == 'newstudent'
        assert data['user']['email'] == 'newstudent@test.com'
        assert data['user']['role'] == 'student'
        assert 'access_token' in data
        assert data['user']['total_xp'] == 0
        assert data['user']['level'] == 1
    
    def test_register_teacher_success(self, client):
        """Test successful teacher registration"""
        response = client.post('/api/auth/register', json={
            'username': 'newteacher',
            'email': 'newteacher@test.com',
            'password': 'teacher123',
            'role': 'teacher'
        })
        
        assert response.status_code == 201
        data = response.get_json()
        assert data['user']['role'] == 'teacher'
    
    def test_register_missing_fields(self, client):
        """Test registration with missing fields"""
        response = client.post('/api/auth/register', json={
            'username': 'incomplete'
        })
        
        assert response.status_code == 400
        data = response.get_json()
        assert 'error' in data
        assert data['error'] == 'Missing required fields'
    
    def test_register_duplicate_username(self, client, test_student):
        """Test registration with existing username"""
        response = client.post('/api/auth/register', json={
            'username': test_student['username'],
            'email': 'different@test.com',
            'password': 'password123'
        })
        
        assert response.status_code == 409
        data = response.get_json()
        assert data['error'] == 'Username already exists'
    
    def test_register_duplicate_email(self, client, test_student):
        """Test registration with existing email"""
        response = client.post('/api/auth/register', json={
            'username': 'differentuser',
            'email': test_student['email'],
            'password': 'password123'
        })
        
        assert response.status_code == 409
        data = response.get_json()
        assert data['error'] == 'Email already exists'
    
    def test_register_invalid_role(self, client):
        """Test registration with invalid role"""
        response = client.post('/api/auth/register', json={
            'username': 'testuser',
            'email': 'test@test.com',
            'password': 'password123',
            'role': 'admin'  # Admin role not allowed via registration
        })
        
        assert response.status_code == 400
        data = response.get_json()
        assert 'Invalid role' in data['error']
    
    def test_register_default_role(self, client):
        """Test registration defaults to student role"""
        response = client.post('/api/auth/register', json={
            'username': 'defaultuser',
            'email': 'default@test.com',
            'password': 'password123'
        })
        
        assert response.status_code == 201
        data = response.get_json()
        assert data['user']['role'] == 'student'


class TestLogin:
    """Test user login"""
    
    def test_login_success(self, client, test_student):
        """Test successful login"""
        response = client.post('/api/auth/login', json={
            'username': test_student['username'],
            'password': test_student['password']
        })
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['message'] == 'Login successful'
        assert data['user']['username'] == test_student['username']
        assert 'access_token' in data
        assert data['user']['current_streak'] >= 1
    
    def test_login_invalid_username(self, client):
        """Test login with non-existent username"""
        response = client.post('/api/auth/login', json={
            'username': 'nonexistent',
            'password': 'password123'
        })
        
        assert response.status_code == 401
        data = response.get_json()
        assert data['error'] == 'Invalid credentials'
    
    def test_login_invalid_password(self, client, test_student):
        """Test login with wrong password"""
        response = client.post('/api/auth/login', json={
            'username': test_student['username'],
            'password': 'wrongpassword'
        })
        
        assert response.status_code == 401
        data = response.get_json()
        assert data['error'] == 'Invalid credentials'
    
    def test_login_missing_fields(self, client):
        """Test login with missing fields"""
        response = client.post('/api/auth/login', json={
            'username': 'testuser'
        })
        
        assert response.status_code == 400
        data = response.get_json()
        assert data['error'] == 'Missing username or password'
    
    def test_login_updates_streak(self, client, test_student):
        """Test that login updates streak correctly"""
        # First login
        response1 = client.post('/api/auth/login', json={
            'username': test_student['username'],
            'password': test_student['password']
        })
        data1 = response1.get_json()
        initial_streak = data1['user']['current_streak']
        
        # Note: Same-day login won't increment streak
        # This test verifies streak is maintained
        response2 = client.post('/api/auth/login', json={
            'username': test_student['username'],
            'password': test_student['password']
        })
        data2 = response2.get_json()
        assert data2['user']['current_streak'] == initial_streak


class TestProfile:
    """Test profile endpoints"""
    
    def test_get_profile_success(self, client, student_token):
        """Test getting current user profile"""
        headers = get_auth_headers(student_token)
        response = client.get('/api/auth/profile', headers=headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'username' in data
        assert 'email' in data
        assert 'role' in data
        assert 'total_xp' in data
        assert 'level' in data
    
    def test_get_profile_unauthorized(self, client):
        """Test getting profile without token"""
        response = client.get('/api/auth/profile')
        
        assert response.status_code == 401
    
    def test_get_profile_invalid_token(self, client):
        """Test getting profile with invalid token"""
        headers = get_auth_headers('invalid-token')
        response = client.get('/api/auth/profile', headers=headers)
        
        assert response.status_code == 422  # Unprocessable entity for invalid JWT


class TestStudentsList:
    """Test students list endpoint (teacher/admin only)"""
    
    def test_get_students_as_teacher(self, client, teacher_token, test_student):
        """Test teacher can get students list"""
        headers = get_auth_headers(teacher_token)
        response = client.get('/api/auth/students', headers=headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'students' in data
        assert 'total' in data
        assert data['total'] >= 1
        assert len(data['students']) >= 1
    
    def test_get_students_as_admin(self, client, admin_token, test_student):
        """Test admin can get students list"""
        headers = get_auth_headers(admin_token)
        response = client.get('/api/auth/students', headers=headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'students' in data
        assert data['total'] >= 1
    
    def test_get_students_as_student_denied(self, client, student_token):
        """Test student cannot get students list"""
        headers = get_auth_headers(student_token)
        response = client.get('/api/auth/students', headers=headers)
        
        assert response.status_code == 403
        data = response.get_json()
        assert 'Access denied' in data['error']
    
    def test_get_students_unauthorized(self, client):
        """Test getting students list without authentication"""
        response = client.get('/api/auth/students')
        
        assert response.status_code == 401
