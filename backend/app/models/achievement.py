"""
Achievement and Badge Model
"""
from app import db
from datetime import datetime


class Achievement(db.Model):
    __tablename__ = 'achievements'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Achievement details
    achievement_type = db.Column(db.String(50), nullable=False)  # streak, perfect_quiz, level_up, etc.
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    badge_icon = db.Column(db.String(255))
    
    # Reward
    xp_bonus = db.Column(db.Integer, default=0)
    
    # Timestamp
    earned_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        """Convert achievement to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'achievement_type': self.achievement_type,
            'title': self.title,
            'description': self.description,
            'badge_icon': self.badge_icon,
            'xp_bonus': self.xp_bonus,
            'earned_at': self.earned_at.isoformat() if self.earned_at else None
        }
