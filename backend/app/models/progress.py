"""
Progress Tracking Model

Records user progress through individual lessons. Enables:
- Resume functionality (pick up where you left off)
- Completion tracking (what's done vs. pending)
- Time analytics (study duration insights)
- Performance measurement (scores, attempts)

Each user-lesson pair has at most one Progress record.

Status Flow:
    not_started -> in_progress -> completed
    
Attributes:
    id (int): Primary key
    user_id (int): Student working on lesson (FK to users)
    lesson_id (int): Lesson being tracked (FK to lessons)
    
    status (str): Current state
        - 'not_started': Lesson opened but not begun
        - 'in_progress': Partial completion
        - 'completed': Fully finished
        
    completion_percentage (int): 0-100, granular progress within lesson
    time_spent (int): Total seconds spent on this lesson
    
    Timestamps:
        started_at: When first accessed
        completed_at: When finished (if completed)
        last_accessed: Most recent interaction
        
    Performance:
        attempts (int): Number of tries at lesson content
        score (float): Final score/grade if applicable
        
Relationships:
    user: Many-to-one with User (student)
    lesson: Many-to-one with Lesson (content)
    
Indexes:
    - (user_id, lesson_id): Fast lookups of "has user done this lesson?"
    - user_id: User's full progress history
    - lesson_id: All students who attempted lesson
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
        """
        Serialize progress to dictionary for JSON responses.
        
        Returns:
            dict: Progress data including:
                - status: Current lesson state
                - completion_percentage: 0-100 progress
                - time_spent: Seconds invested
                - timestamps: ISO 8601 formatted dates
                - score: Performance metric
                
        Note:
            All datetime fields converted to ISO format for frontend
        """
        return {
            'id': self.id,
            'user_id': self.user_id,
            'lesson_id': self.lesson_id,
            'status': self.status,
            'completion_percentage': self.completion_percentage,
            'time_spent': self.time_spent,
            'attempts': self.attempts,
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'last_accessed': self.last_accessed.isoformat() if self.last_accessed else None,
            'score': self.score
        }
