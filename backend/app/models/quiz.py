"""
Quiz and Quiz Attempt Models
"""
from app import db
from datetime import datetime


class Quiz(db.Model):
    __tablename__ = 'quizzes'
    
    id = db.Column(db.Integer, primary_key=True)
    lesson_id = db.Column(db.Integer, db.ForeignKey('lessons.id'), nullable=False)
    
    # Quiz details
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    questions = db.Column(db.JSON, nullable=False)  # List of question objects
    
    # Quiz settings
    passing_score = db.Column(db.Integer, default=70)
    time_limit = db.Column(db.Integer)  # in minutes, null for no limit
    xp_reward = db.Column(db.Integer, default=20)
    
    # Status
    is_active = db.Column(db.Boolean, default=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    attempts = db.relationship('QuizAttempt', backref='quiz', lazy='dynamic')
    
    def to_dict(self):
        """Convert quiz to dictionary"""
        return {
            'id': self.id,
            'lesson_id': self.lesson_id,
            'title': self.title,
            'description': self.description,
            'questions': self.questions,
            'passing_score': self.passing_score,
            'time_limit': self.time_limit,
            'xp_reward': self.xp_reward,
            'is_active': self.is_active
        }


class QuizAttempt(db.Model):
    __tablename__ = 'quiz_attempts'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    quiz_id = db.Column(db.Integer, db.ForeignKey('quizzes.id'), nullable=False)
    
    # Attempt details
    answers = db.Column(db.JSON)  # User's answers
    score = db.Column(db.Float)
    passed = db.Column(db.Boolean, default=False)
    time_taken = db.Column(db.Integer)  # in seconds
    
    # Timestamps
    started_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime)
    
    def to_dict(self):
        """Convert quiz attempt to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'quiz_id': self.quiz_id,
            'answers': self.answers,
            'score': self.score,
            'passed': self.passed,
            'time_taken': self.time_taken,
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None
        }
