"""
Achievement and Badge Model

Tracks earned achievements and badges that reward user accomplishments.
Part of the gamification system that motivates learning through recognition.

Achievement Types:
    - streak: Daily activity milestones (3, 7, 14, 30 day streaks)
    - perfect_quiz: 100% score on quiz attempts
    - level_up: Reaching new XP levels
    - lesson_master: Completing specific lesson types
    - speed_learner: Completing lessons quickly
    - consistent_learner: Regular study patterns

Attributes:
    id (int): Primary key
    user_id (int): Owner of the achievement (FK to users)
    achievement_type (str): Category of achievement (see types above)
    title (str): Display name (e.g., "7 Day Streak Master")
    description (str): Achievement details and requirements
    badge_icon (str): Icon identifier for display
    xp_bonus (int): XP reward for earning this achievement
    earned_at (datetime): When achievement was unlocked
    
Relationships:
    user: Many-to-one with User (achievement owner)
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
        """
        Serialize achievement to dictionary for JSON responses.
        
        Returns:
            dict: Achievement data including:
                - id: Achievement identifier
                - achievement_type: Category (streak/quiz/level/etc)
                - title: Display name
                - xp_bonus: Reward amount
                - earned_at: ISO 8601 timestamp
        """
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
