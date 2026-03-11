"""
Leaderboard Model
"""
from app import db
from datetime import datetime


class Leaderboard(db.Model):
    __tablename__ = 'leaderboard'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Leaderboard metrics
    period = db.Column(db.String(20), nullable=False)  # daily, weekly, monthly, all_time
    rank = db.Column(db.Integer)
    score = db.Column(db.Integer, default=0)
    
    # Timestamp
    period_start = db.Column(db.DateTime, nullable=False)
    period_end = db.Column(db.DateTime, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship
    user = db.relationship('User', backref='leaderboard_entries', lazy=True)
    
    def to_dict(self):
        """Convert leaderboard entry to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'username': self.user.username if self.user else None,
            'period': self.period,
            'rank': self.rank,
            'score': self.score,
            'total_xp': self.score,  # alias for frontend compatibility
            'period_start': self.period_start.isoformat() if self.period_start else None,
            'period_end': self.period_end.isoformat() if self.period_end else None
        }
