"""
User Model
"""
from app import db
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash


class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), default='student')  # 'student' or 'teacher'
    
    # Gamification fields
    total_xp = db.Column(db.Integer, default=0)
    level = db.Column(db.Integer, default=1)
    current_streak = db.Column(db.Integer, default=0)
    longest_streak = db.Column(db.Integer, default=0)
    last_login = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Avatar customization
    avatar_url = db.Column(db.String(255), default='default_avatar.png')
    avatar_items = db.Column(db.JSON, default=[])
    
    # Engagement metrics
    total_time_spent = db.Column(db.Integer, default=0)  # in minutes
    lessons_completed = db.Column(db.Integer, default=0)
    quizzes_taken = db.Column(db.Integer, default=0)
    
    # Learning Assessment Results
    learning_style = db.Column(db.String(100))  # Primary learning style
    assessment_score = db.Column(db.Integer)  # Last assessment score
    assessment_date = db.Column(db.DateTime)  # When assessed
    assessment_data = db.Column(db.JSON)  # Detailed assessment results
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    progress = db.relationship('Progress', backref='user', lazy='dynamic')
    achievements = db.relationship('Achievement', backref='user', lazy='dynamic')
    quiz_attempts = db.relationship('QuizAttempt', backref='user', lazy='dynamic')
    
    def set_password(self, password):
        """Hash and set password"""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """Check password against hash"""
        return check_password_hash(self.password_hash, password)
    
    def add_xp(self, xp_amount):
        """Add XP and level up if needed"""
        self.total_xp += xp_amount
        # Level up formula: level = sqrt(total_xp / 100)
        new_level = int((self.total_xp / 100) ** 0.5) + 1
        if new_level > self.level:
            self.level = new_level
            return True  # Level up occurred
        return False
    
    def to_dict(self):
        """Convert user to dictionary"""
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'role': self.role,
            'total_xp': self.total_xp,
            'level': self.level,
            'current_streak': self.current_streak,
            'longest_streak': self.longest_streak,
            'avatar_url': self.avatar_url,
            'lessons_completed': self.lessons_completed,
            'quizzes_taken': self.quizzes_taken,
            'learning_style': self.learning_style,
            'assessment_score': self.assessment_score,
            'assessment_date': self.assessment_date.isoformat() if self.assessment_date else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
