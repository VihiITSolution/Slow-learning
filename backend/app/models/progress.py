"""
Progress Tracking Model
"""
from app import db
from datetime import datetime


class Progress(db.Model):
    __tablename__ = 'progress'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    lesson_id = db.Column(db.Integer, db.ForeignKey('lessons.id'), nullable=False)
    
    # Progress tracking
    status = db.Column(db.String(20), default='not_started')  # not_started, in_progress, completed
    completion_percentage = db.Column(db.Integer, default=0)
    time_spent = db.Column(db.Integer, default=0)  # in seconds
    
    # Timestamps
    started_at = db.Column(db.DateTime)
    completed_at = db.Column(db.DateTime)
    last_accessed = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Additional metadata
    attempts = db.Column(db.Integer, default=0)
    score = db.Column(db.Float)
    
    def to_dict(self):
        """Convert progress to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'lesson_id': self.lesson_id,
            'status': self.status,
            'completion_percentage': self.completion_percentage,
            'time_spent': self.time_spent,
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'last_accessed': self.last_accessed.isoformat() if self.last_accessed else None,
            'score': self.score
        }
