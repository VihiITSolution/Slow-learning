"""
Pytest configuration and fixtures for backend tests
"""
import pytest
import os
import sys
from datetime import datetime

# Set environment variables BEFORE importing app
os.environ['SECRET_KEY'] = 'test-secret-key-for-pytest'
os.environ['JWT_SECRET_KEY'] = 'test-jwt-secret-key-for-pytest'
os.environ['DATABASE_URL'] = 'sqlite:///:memory:'
os.environ['TESTING'] = 'True'

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import db
from app.models.user import User
from app.models.lesson import Lesson
from app.models.progress import Progress
from app.models.achievement import Achievement


@pytest.fixture(scope='function')
def app():
    """Create and configure a test Flask application"""
    # Import here to use the environment variables set above
    from app import create_app
    
    # Set testing configuration
    os.environ['TESTING'] = 'True'
    os.environ['DATABASE_URL'] = 'sqlite:///:memory:'
    
    # Use the testing config: the default (development) config points at the
    # real instance/dev_database.db, and drop_all() below would wipe it.
    app = create_app('testing')
    app.config.update({
        'TESTING': True,
        'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:',
        'WTF_CSRF_ENABLED': False,
        'JWT_SECRET_KEY': 'test-jwt-secret',
        'SECRET_KEY': 'test-secret-key'
    })
    
    # Create database tables
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture(scope='function')
def client(app):
    """Create a test client"""
    return app.test_client()


@pytest.fixture(scope='function')
def runner(app):
    """Create a test CLI runner"""
    return app.test_cli_runner()


@pytest.fixture(scope='function')
def test_student(app):
    """Create a test student user"""
    with app.app_context():
        user = User(
            username='test_student',
            email='student@test.com',
            role='student',
            total_xp=100,
            level=2,
            current_streak=3,
            longest_streak=5,
            lessons_completed=2,
            quizzes_taken=3
        )
        user.set_password('password123')
        db.session.add(user)
        db.session.commit()
        
        # Return user data
        return {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'password': 'password123',
            'role': user.role
        }


@pytest.fixture(scope='function')
def test_teacher(app):
    """Create a test teacher user"""
    with app.app_context():
        user = User(
            username='test_teacher',
            email='teacher@test.com',
            role='teacher',
            total_xp=0,
            level=1
        )
        user.set_password('teacher123')
        db.session.add(user)
        db.session.commit()
        
        return {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'password': 'teacher123',
            'role': user.role
        }


@pytest.fixture(scope='function')
def test_admin(app):
    """Create a test admin user"""
    with app.app_context():
        user = User(
            username='test_admin',
            email='admin@test.com',
            role='admin',
            total_xp=1000,
            level=10
        )
        user.set_password('admin123')
        db.session.add(user)
        db.session.commit()
        
        return {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'password': 'admin123',
            'role': user.role
        }


@pytest.fixture(scope='function')
def student_token(client, test_student):
    """Get JWT token for test student"""
    response = client.post('/api/auth/login', json={
        'username': test_student['username'],
        'password': test_student['password']
    })
    data = response.get_json()
    return data['access_token']


@pytest.fixture(scope='function')
def teacher_token(client, test_teacher):
    """Get JWT token for test teacher"""
    response = client.post('/api/auth/login', json={
        'username': test_teacher['username'],
        'password': test_teacher['password']
    })
    data = response.get_json()
    return data['access_token']


@pytest.fixture(scope='function')
def admin_token(client, test_admin):
    """Get JWT token for test admin"""
    response = client.post('/api/auth/login', json={
        'username': test_admin['username'],
        'password': test_admin['password']
    })
    data = response.get_json()
    return data['access_token']


@pytest.fixture(scope='function')
def test_lesson(app):
    """Create a test lesson"""
    with app.app_context():
        lesson = Lesson(
            title='Test Lesson',
            description='A test lesson for unit tests',
            category='math',
            difficulty_level='beginner',
            content='Test instructions',
            xp_reward=50,
            estimated_time=15,
            order_index=1,
            is_active=True
        )
        db.session.add(lesson)
        db.session.commit()
        
        return {
            'id': lesson.id,
            'title': lesson.title,
            'category': lesson.category,
            'difficulty_level': lesson.difficulty_level,
            'xp_reward': lesson.xp_reward
        }


@pytest.fixture(scope='function')
def test_lessons(app):
    """Create multiple test lessons"""
    with app.app_context():
        lessons = [
            Lesson(
                title='Math Lesson 1',
                description='Basic addition',
                category='math',
                difficulty_level='beginner',
                content='Add numbers',
                xp_reward=50,
                estimated_time=15,
                order_index=1,
                is_active=True
            ),
            Lesson(
                title='Reading Lesson 1',
                description='Basic reading',
                category='reading',
                difficulty_level='beginner',
                content='Read text',
                xp_reward=40,
                estimated_time=20,
                order_index=2,
                is_active=True
            ),
            Lesson(
                title='Math Lesson 2',
                description='Intermediate addition',
                category='math',
                difficulty_level='intermediate',
                content='Add larger numbers',
                xp_reward=75,
                estimated_time=25,
                order_index=3,
                is_active=True
            )
        ]
        
        for lesson in lessons:
            db.session.add(lesson)
        db.session.commit()
        
        return [{'id': l.id, 'title': l.title, 'category': l.category} for l in lessons]


@pytest.fixture(scope='function')
def test_progress(app, test_student, test_lesson):
    """Create a test progress record"""
    with app.app_context():
        progress = Progress(
            user_id=test_student['id'],
            lesson_id=test_lesson['id'],
            status='in_progress',
            completion_percentage=50,
            attempts=1,
            started_at=datetime.utcnow()
        )
        db.session.add(progress)
        db.session.commit()
        
        return {
            'id': progress.id,
            'user_id': progress.user_id,
            'lesson_id': progress.lesson_id,
            'status': progress.status
        }


@pytest.fixture(scope='function')
def test_achievement(app, test_student):
    """Create a test achievement"""
    with app.app_context():
        achievement = Achievement(
            user_id=test_student['id'],
            achievement_type='first_lesson',
            title='First Steps',
            description='Completed your first lesson',
            badge_icon='🎓',
            xp_bonus=10
        )
        db.session.add(achievement)
        db.session.commit()
        
        return {
            'id': achievement.id,
            'achievement_type': achievement.achievement_type,
            'title': achievement.title
        }


def get_auth_headers(token):
    """Helper function to create authentication headers"""
    return {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
