"""
Unit tests for database models
"""
import pytest
from datetime import datetime
from app.models.user import User
from app.models.lesson import Lesson
from app.models.progress import Progress
from app.models.achievement import Achievement


class TestUserModel:
    """Test User model"""
    
    def test_create_user(self, app):
        """Test creating a user"""
        with app.app_context():
            from app import db
            
            user = User(
                username='testuser',
                email='test@example.com',
                role='student'
            )
            user.set_password('password123')
            
            db.session.add(user)
            db.session.commit()
            
            assert user.id is not None
            assert user.username == 'testuser'
            assert user.email == 'test@example.com'
            assert user.role == 'student'
            assert user.total_xp == 0
            assert user.level == 1
    
    def test_password_hashing(self, app):
        """Test password hashing and verification"""
        with app.app_context():
            user = User(username='testuser', email='test@example.com')
            user.set_password('mysecretpassword')
            
            # Password should be hashed
            assert user.password_hash != 'mysecretpassword'
            
            # Should verify correct password
            assert user.check_password('mysecretpassword') == True
            
            # Should reject incorrect password
            assert user.check_password('wrongpassword') == False
    
    def test_add_xp_no_level_up(self, app):
        """Test adding XP without leveling up"""
        with app.app_context():
            from app import db
            
            user = User(username='testuser', email='test@example.com')
            user.total_xp = 100
            user.level = 1
            user.set_password('pass')
            
            leveled_up = user.add_xp(50)
            
            assert leveled_up == False
            assert user.total_xp == 150
            assert user.level == 1  # sqrt(150/100) = 1.22, floor = 1
    
    def test_add_xp_with_level_up(self, app):
        """Test adding XP causes level up"""
        with app.app_context():
            from app import db
            
            user = User(username='testuser', email='test@example.com')
            user.total_xp = 350
            user.level = 1
            user.set_password('pass')
            
            leveled_up = user.add_xp(50)
            
            assert leveled_up == True
            assert user.total_xp == 400
            assert user.level == 2  # sqrt(400/100) = 2
    
    def test_user_to_dict(self, app, test_student):
        """Test user to_dict method"""
        with app.app_context():
            user = User.query.get(test_student['id'])
            user_dict = user.to_dict()
            
            assert 'id' in user_dict
            assert 'username' in user_dict
            assert 'email' in user_dict
            assert 'role' in user_dict
            assert 'total_xp' in user_dict
            assert 'level' in user_dict
            assert 'current_streak' in user_dict
            assert 'password_hash' not in user_dict  # Should not expose password


class TestLessonModel:
    """Test Lesson model"""
    
    def test_create_lesson(self, app):
        """Test creating a lesson"""
        with app.app_context():
            from app import db
            
            lesson = Lesson(
                title='Test Lesson',
                description='A test lesson',
                category='math',
                difficulty_level='beginner',
                content='Do this',
                xp_reward=50,
                estimated_time=15,
                order_index=1,
                is_active=True
            )
            
            db.session.add(lesson)
            db.session.commit()
            
            assert lesson.id is not None
            assert lesson.title == 'Test Lesson'
            assert lesson.category == 'math'
            assert lesson.xp_reward == 50
            assert lesson.is_active == True
    
    def test_lesson_to_dict(self, app, test_lesson):
        """Test lesson to_dict method"""
        with app.app_context():
            lesson = Lesson.query.get(test_lesson['id'])
            lesson_dict = lesson.to_dict()
            
            assert 'id' in lesson_dict
            assert 'title' in lesson_dict
            assert 'description' in lesson_dict
            assert 'category' in lesson_dict
            assert 'difficulty_level' in lesson_dict
            assert 'xp_reward' in lesson_dict


class TestProgressModel:
    """Test Progress model"""
    
    def test_create_progress(self, app, test_student, test_lesson):
        """Test creating progress record"""
        with app.app_context():
            from app import db
            
            progress = Progress(
                user_id=test_student['id'],
                lesson_id=test_lesson['id'],
                status='in_progress',
                completion_percentage=0,
                attempts=1,
                started_at=datetime.utcnow()
            )
            
            db.session.add(progress)
            db.session.commit()
            
            assert progress.id is not None
            assert progress.user_id == test_student['id']
            assert progress.lesson_id == test_lesson['id']
            assert progress.status == 'in_progress'
    
    def test_progress_update(self, app, test_progress):
        """Test updating progress"""
        with app.app_context():
            from app import db
            
            progress = Progress.query.get(test_progress['id'])
            progress.status = 'completed'
            progress.completion_percentage = 100
            progress.completed_at = datetime.utcnow()
            
            db.session.commit()
            
            updated_progress = Progress.query.get(test_progress['id'])
            assert updated_progress.status == 'completed'
            assert updated_progress.completion_percentage == 100
            assert updated_progress.completed_at is not None


class TestAchievementModel:
    """Test Achievement model"""
    
    def test_create_achievement(self, app, test_student):
        """Test creating achievement"""
        with app.app_context():
            from app import db
            
            achievement = Achievement(
                user_id=test_student['id'],
                achievement_type='first_lesson',
                title='First Steps',
                description='Complete first lesson',
                badge_icon='🎓',
                xp_bonus=10
            )
            
            db.session.add(achievement)
            db.session.commit()
            
            assert achievement.id is not None
            assert achievement.user_id == test_student['id']
            assert achievement.achievement_type == 'first_lesson'
            assert achievement.xp_bonus == 10
    
    def test_achievement_to_dict(self, app, test_achievement):
        """Test achievement to_dict method"""
        with app.app_context():
            achievement = Achievement.query.get(test_achievement['id'])
            achievement_dict = achievement.to_dict()
            
            assert 'id' in achievement_dict
            assert 'achievement_type' in achievement_dict
            assert 'title' in achievement_dict
            assert 'xp_bonus' in achievement_dict
            assert 'earned_at' in achievement_dict
