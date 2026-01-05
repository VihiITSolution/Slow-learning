"""
Game Session Model - Track student game plays
"""
from app import db
from datetime import datetime


class GameSession(db.Model):
    __tablename__ = 'game_sessions'
    
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.String(50), unique=True, nullable=False)
    
    # Session info
    games_completed = db.Column(db.Integer, default=0)
    total_stars = db.Column(db.Integer, default=0)
    total_errors = db.Column(db.Integer, default=0)
    total_time = db.Column(db.Integer, default=0)  # in seconds
    
    # Game-specific scores
    math_score = db.Column(db.Integer, default=0)
    color_score = db.Column(db.Integer, default=0)
    memory_score = db.Column(db.Integer, default=0)
    story_score = db.Column(db.Integer, default=0)
    drawing_score = db.Column(db.Integer, default=0)
    
    # Assessment results (if linked to a student)
    student_name = db.Column(db.String(100))
    primary_learning_style = db.Column(db.String(100))
    learning_strengths = db.Column(db.JSON)  # Array of styles with scores
    
    # Timestamps
    started_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'session_id': self.session_id,
            'games_completed': self.games_completed,
            'total_stars': self.total_stars,
            'total_errors': self.total_errors,
            'total_time': self.total_time,
            'math_score': self.math_score,
            'color_score': self.color_score,
            'memory_score': self.memory_score,
            'story_score': self.story_score,
            'drawing_score': self.drawing_score,
            'student_name': self.student_name,
            'primary_learning_style': self.primary_learning_style,
            'learning_strengths': self.learning_strengths,
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None
        }
