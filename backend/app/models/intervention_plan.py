"""Teacher-authored support plans and their measurable review outcomes."""
from datetime import datetime

from app import db


class InterventionPlan(db.Model):
    __tablename__ = 'intervention_plans'

    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    teacher_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    intervention_type = db.Column(db.String(50), nullable=False)
    custom_intervention = db.Column(db.String(255))
    goal = db.Column(db.Text, nullable=False)
    notes = db.Column(db.Text)
    review_date = db.Column(db.DateTime, nullable=False, index=True)
    status = db.Column(db.String(20), nullable=False, default='active', index=True)
    outcome = db.Column(db.String(30))
    outcome_notes = db.Column(db.Text)
    baseline_snapshot = db.Column(db.JSON, nullable=False)
    review_snapshot = db.Column(db.JSON)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    reviewed_at = db.Column(db.DateTime)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    student = db.relationship('User', foreign_keys=[student_id])
    teacher = db.relationship('User', foreign_keys=[teacher_id])

    def to_dict(self, include_comparison=True):
        data = {
            'id': self.id,
            'student_id': self.student_id,
            'student_name': self.student.username if self.student else None,
            'teacher_id': self.teacher_id,
            'teacher_name': self.teacher.username if self.teacher else None,
            'intervention_type': self.intervention_type,
            'custom_intervention': self.custom_intervention,
            'goal': self.goal,
            'notes': self.notes,
            'review_date': self.review_date.isoformat() if self.review_date else None,
            'status': self.status,
            'outcome': self.outcome,
            'outcome_notes': self.outcome_notes,
            'baseline_snapshot': self.baseline_snapshot or {},
            'review_snapshot': self.review_snapshot or None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'reviewed_at': self.reviewed_at.isoformat() if self.reviewed_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
        if include_comparison:
            data['metric_comparison'] = self.metric_comparison()
        return data

    def metric_comparison(self):
        if not self.review_snapshot:
            return None

        baseline = self.baseline_snapshot or {}
        review = self.review_snapshot or {}
        numeric_fields = ('total_xp', 'lessons_completed', 'quizzes_taken', 'total_time_spent', 'current_streak')
        comparison = {
            field: {
                'baseline': baseline.get(field, 0),
                'review': review.get(field, 0),
                'change': (review.get(field, 0) or 0) - (baseline.get(field, 0) or 0),
            }
            for field in numeric_fields
        }
        # Practice accuracy (% right first time) - None when the student had
        # not practised yet at that point
        before = (baseline.get('engagement_features') or {}).get('practice_accuracy')
        after = (review.get('engagement_features') or {}).get('practice_accuracy')
        comparison['practice_accuracy'] = {
            'baseline': before,
            'review': after,
            'change': round(after - before, 1) if before is not None and after is not None else None,
        }
        comparison['engagement'] = {
            'baseline': baseline.get('engaged'),
            'review': review.get('engaged'),
        }
        comparison['risk_level'] = {
            'baseline': baseline.get('risk_level'),
            'review': review.get('risk_level'),
        }
        return comparison
