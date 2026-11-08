"""
AI assistant models.

AISuggestion  - an audit log of every AI suggestion shown to a teacher: what
                (anonymous) numbers were sent, what came back, where it came
                from (Gemini or the built-in rules) and whether the teacher
                used it. This lets the research report how often teachers
                accepted the AI's advice.
TeacherMessage - a short message from a teacher to a student (often drafted
                 by the AI and edited by the teacher), shown on the student's
                 dashboard.
"""
from datetime import datetime

from app import db


class AISuggestion(db.Model):
    __tablename__ = 'ai_suggestions'

    PLAN = 'plan_suggestion'
    REVIEW = 'review_summary'
    CLASS = 'class_summary'
    ENCOURAGEMENT = 'encouragement'
    KINDS = (PLAN, REVIEW, CLASS, ENCOURAGEMENT)

    id = db.Column(db.Integer, primary_key=True)
    kind = db.Column(db.String(30), nullable=False, index=True)
    teacher_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    student_id = db.Column(db.Integer, db.ForeignKey('users.id'), index=True)
    plan_id = db.Column(db.Integer, db.ForeignKey('intervention_plans.id'), index=True)

    source = db.Column(db.String(20), nullable=False)   # 'gemini' or 'rules'
    model = db.Column(db.String(80))                    # Gemini model name when source is gemini
    input_data = db.Column(db.JSON)                     # exactly what was sent (anonymous numbers)
    output = db.Column(db.JSON)
    latency_ms = db.Column(db.Integer)
    used = db.Column(db.Boolean, default=False, nullable=False)  # teacher applied it
    used_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)

    def to_dict(self):
        return {
            'id': self.id,
            'kind': self.kind,
            'student_id': self.student_id,
            'plan_id': self.plan_id,
            'source': self.source,
            'model': self.model,
            'used': self.used,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class TeacherMessage(db.Model):
    __tablename__ = 'teacher_messages'

    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    teacher_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    body = db.Column(db.Text, nullable=False)
    ai_suggestion_id = db.Column(db.Integer, db.ForeignKey('ai_suggestions.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)
    read_at = db.Column(db.DateTime)

    teacher = db.relationship('User', foreign_keys=[teacher_id])

    def to_dict(self):
        return {
            'id': self.id,
            'student_id': self.student_id,
            'teacher_name': self.teacher.username if self.teacher else None,
            'body': self.body,
            'ai_assisted': self.ai_suggestion_id is not None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'read': self.read_at is not None,
        }
