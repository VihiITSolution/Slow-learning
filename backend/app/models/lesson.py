"""
Lesson Model
"""
from app import db
from datetime import datetime


class Lesson(db.Model):
    __tablename__ = 'lessons'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    content = db.Column(db.Text, nullable=False)
    
    # Lesson metadata
    category = db.Column(db.String(100))
    difficulty_level = db.Column(db.String(20))  # easy, medium, hard
    estimated_time = db.Column(db.Integer)  # in minutes
    xp_reward = db.Column(db.Integer, default=10)
    
    # Content organization
    order_index = db.Column(db.Integer, default=0)
    prerequisites = db.Column(db.JSON, default=[])  # list of lesson IDs
    
    # Media
    thumbnail_url = db.Column(db.String(255))
    video_url = db.Column(db.String(255))
    
    # Status
    is_active = db.Column(db.Boolean, default=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    progress = db.relationship('Progress', backref='lesson', lazy='dynamic')
    quizzes = db.relationship('Quiz', backref='lesson', lazy='dynamic')
    
    def to_dict(self):
        """Convert lesson to dictionary"""
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'content': self.content,
            'category': self.category,
            'difficulty_level': self.difficulty_level,
            'estimated_time': self.estimated_time,
            'xp_reward': self.xp_reward,
            'order_index': self.order_index,
            'prerequisites': self.prerequisites,
            'thumbnail_url': self.thumbnail_url,
            'video_url': self.video_url,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
