"""
Activity Attempt Model - every short learning activity a student does outside
the lesson quiz: practice rounds, the activities inside a lesson, learning-game
runs and the daily check-in.

These rows feed the engagement model (practice_accuracy, activities_week and
time_spent_today) and let teachers see more than lessons and quizzes.
"""
from datetime import datetime

from app import db


class ActivityAttempt(db.Model):
    __tablename__ = 'activity_attempts'

    # What kind of activity this row is
    PRACTICE = 'practice'          # a 5-question practice round
    LESSON_STEPS = 'lesson_steps'  # the practice questions inside a lesson
    GAME = 'game'                  # one run of the learning games
    CHECK_IN = 'check_in'          # "How do you feel about learning today?"
    TYPES = (PRACTICE, LESSON_STEPS, GAME, CHECK_IN)

    # Types whose score says how accurately the student answered
    SCORED_TYPES = (PRACTICE, LESSON_STEPS, GAME)
    # Types that are a separate piece of activity (lessons are counted elsewhere)
    COUNTED_TYPES = (PRACTICE, GAME)

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    activity_type = db.Column(db.String(20), nullable=False, index=True)
    category = db.Column(db.String(50))     # math / words / world, or the lesson category
    lesson_id = db.Column(db.Integer, db.ForeignKey('lessons.id'))

    # Results (None for a check-in)
    correct = db.Column(db.Integer)          # answered right first time
    total = db.Column(db.Integer)
    score = db.Column(db.Float)              # percentage right first time
    hints_used = db.Column(db.Integer, default=0)
    retries = db.Column(db.Integer, default=0)  # wrong tries before getting it right
    time_spent = db.Column(db.Integer, default=0)  # seconds
    xp_earned = db.Column(db.Integer, default=0)

    mood = db.Column(db.String(20))          # check-in answer
    details = db.Column(db.JSON)             # per-question detail

    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    user = db.relationship('User', backref=db.backref('activity_attempts', lazy='dynamic'))

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'activity_type': self.activity_type,
            'category': self.category,
            'lesson_id': self.lesson_id,
            'correct': self.correct,
            'total': self.total,
            'score': self.score,
            'hints_used': self.hints_used,
            'retries': self.retries,
            'time_spent': self.time_spent,
            'xp_earned': self.xp_earned,
            'mood': self.mood,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
