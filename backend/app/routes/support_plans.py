"""Authenticated staff APIs for teacher support plans and outcome tracking."""
import csv
import io
from datetime import datetime

from flask import Blueprint, Response, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app import db
from app.models.intervention_plan import InterventionPlan
from app.models.user import User
from app.services.engagement_service import EngagementService


bp = Blueprint('support_plans', __name__)

INTERVENTION_TYPES = {
    'visual_support',
    'shorter_sessions',
    'interactive_game',
    'one_to_one_support',
    'peer_support',
    'extra_practice',
    'other',
}
OUTCOMES = {'improved', 'unchanged', 'needs_support'}
engagement_service = EngagementService()


def current_staff_user():
    user = User.query.get(int(get_jwt_identity()))
    if not user or user.role not in ('teacher', 'admin'):
        return None
    return user


def staff_required():
    user = current_staff_user()
    if not user:
        return None, (jsonify({'success': False, 'error': 'Teacher or admin role required'}), 403)
    return user, None


def parse_review_date(value):
    if not value or not isinstance(value, str):
        raise ValueError('Review date is required')
    try:
        return datetime.fromisoformat(value.replace('Z', '+00:00')).replace(tzinfo=None)
    except ValueError as exc:
        raise ValueError('Review date must be an ISO date or datetime') from exc


def capture_snapshot(student):
    prediction = engagement_service.predict_user_engagement(student.id)
    return {
        'total_xp': student.total_xp or 0,
        'lessons_completed': student.lessons_completed or 0,
        'quizzes_taken': student.quizzes_taken or 0,
        'total_time_spent': student.total_time_spent or 0,
        'current_streak': student.current_streak or 0,
        'engaged': prediction.get('engaged'),
        'risk_level': prediction.get('risk_level'),
        'confidence': prediction.get('confidence'),
        'engagement_features': prediction.get('features', {}),
        'captured_at': datetime.utcnow().isoformat(),
    }


def get_student(student_id):
    student = User.query.get(student_id)
    if not student or student.role != 'student':
        return None
    return student


def validate_plan_data(data, require_review_date=True):
    intervention_type = (data.get('intervention_type') or '').strip()
    goal = (data.get('goal') or '').strip()
    custom_intervention = (data.get('custom_intervention') or '').strip() or None

    if intervention_type not in INTERVENTION_TYPES:
        raise ValueError('Invalid intervention type')
    if intervention_type == 'other' and not custom_intervention:
        raise ValueError('Custom intervention is required when intervention type is other')
    if not goal:
        raise ValueError('Goal is required')

    validated = {
        'intervention_type': intervention_type,
        'custom_intervention': custom_intervention,
        'goal': goal,
        'notes': (data.get('notes') or '').strip() or None,
    }
    if require_review_date:
        review_date = parse_review_date(data.get('review_date'))
        if review_date.date() < datetime.utcnow().date():
            raise ValueError('Review date cannot be in the past')
        validated['review_date'] = review_date
    return validated


@bp.route('/', methods=['POST'])
@jwt_required()
def create_plan():
    staff, error = staff_required()
    if error:
        return error

    data = request.get_json() or {}
    student = get_student(data.get('student_id'))
    if not student:
        return jsonify({'success': False, 'error': 'Student not found'}), 404
    try:
        values = validate_plan_data(data)
    except ValueError as exc:
        return jsonify({'success': False, 'error': str(exc)}), 400

    plan = InterventionPlan(
        student_id=student.id,
        teacher_id=staff.id,
        baseline_snapshot=capture_snapshot(student),
        **values,
    )
    db.session.add(plan)
    db.session.commit()
    return jsonify({'success': True, 'data': plan.to_dict()}), 201


@bp.route('/', methods=['GET'])
@jwt_required()
def list_plans():
    _, error = staff_required()
    if error:
        return error

    query = InterventionPlan.query
    status = request.args.get('status', 'all')
    if status not in ('all', 'active', 'reviewed'):
        return jsonify({'success': False, 'error': 'Status must be active, reviewed, or all'}), 400
    if status != 'all':
        query = query.filter_by(status=status)
    student_id = request.args.get('student_id', type=int)
    if student_id is not None:
        query = query.filter_by(student_id=student_id)

    plans = query.order_by(InterventionPlan.review_date.asc(), InterventionPlan.created_at.desc()).all()
    return jsonify({'success': True, 'data': [plan.to_dict() for plan in plans]}), 200


@bp.route('/export', methods=['GET'])
@jwt_required()
def export_reviewed_plans():
    _, error = staff_required()
    if error:
        return error

    plans = InterventionPlan.query.filter_by(status='reviewed').order_by(InterventionPlan.reviewed_at.desc()).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        'plan_id', 'student_id', 'teacher_id', 'intervention_type', 'custom_intervention',
        'goal', 'review_date', 'created_at', 'reviewed_at', 'outcome', 'outcome_notes',
        'baseline_xp', 'review_xp', 'baseline_lessons_completed', 'review_lessons_completed',
        'baseline_quizzes_taken', 'review_quizzes_taken', 'baseline_total_time_spent',
        'review_total_time_spent', 'baseline_current_streak', 'review_current_streak',
        'baseline_engaged', 'review_engaged', 'baseline_risk_level', 'review_risk_level',
    ])
    for plan in plans:
        baseline, review = plan.baseline_snapshot or {}, plan.review_snapshot or {}
        writer.writerow([
            plan.id, plan.student_id, plan.teacher_id, plan.intervention_type, plan.custom_intervention,
            plan.goal, plan.review_date.isoformat(), plan.created_at.isoformat(),
            plan.reviewed_at.isoformat() if plan.reviewed_at else '', plan.outcome, plan.outcome_notes,
            baseline.get('total_xp'), review.get('total_xp'), baseline.get('lessons_completed'), review.get('lessons_completed'),
            baseline.get('quizzes_taken'), review.get('quizzes_taken'), baseline.get('total_time_spent'), review.get('total_time_spent'),
            baseline.get('current_streak'), review.get('current_streak'), baseline.get('engaged'), review.get('engaged'),
            baseline.get('risk_level'), review.get('risk_level'),
        ])
    return Response(
        output.getvalue(),
        mimetype='text/csv',
        headers={'Content-Disposition': 'attachment; filename=reviewed-support-plans.csv'},
    )


@bp.route('/<int:plan_id>', methods=['GET'])
@jwt_required()
def get_plan(plan_id):
    _, error = staff_required()
    if error:
        return error
    plan = InterventionPlan.query.get(plan_id)
    if not plan:
        return jsonify({'success': False, 'error': 'Support plan not found'}), 404
    return jsonify({'success': True, 'data': plan.to_dict()}), 200


@bp.route('/<int:plan_id>', methods=['PUT'])
@jwt_required()
def update_plan(plan_id):
    staff, error = staff_required()
    if error:
        return error
    plan = InterventionPlan.query.get(plan_id)
    if not plan:
        return jsonify({'success': False, 'error': 'Support plan not found'}), 404
    if plan.status != 'active':
        return jsonify({'success': False, 'error': 'Reviewed support plans cannot be changed'}), 409
    if staff.role != 'admin' and plan.teacher_id != staff.id:
        return jsonify({'success': False, 'error': 'Only the plan author or an admin can update this plan'}), 403
    try:
        values = validate_plan_data(request.get_json() or {})
    except ValueError as exc:
        return jsonify({'success': False, 'error': str(exc)}), 400
    for key, value in values.items():
        setattr(plan, key, value)
    db.session.commit()
    return jsonify({'success': True, 'data': plan.to_dict()}), 200


@bp.route('/<int:plan_id>/review', methods=['POST'])
@jwt_required()
def review_plan(plan_id):
    staff, error = staff_required()
    if error:
        return error
    plan = InterventionPlan.query.get(plan_id)
    if not plan:
        return jsonify({'success': False, 'error': 'Support plan not found'}), 404
    if plan.status != 'active':
        return jsonify({'success': False, 'error': 'This support plan has already been reviewed'}), 409
    if staff.role != 'admin' and plan.teacher_id != staff.id:
        return jsonify({'success': False, 'error': 'Only the plan author or an admin can review this plan'}), 403

    data = request.get_json() or {}
    outcome = (data.get('outcome') or '').strip()
    if outcome not in OUTCOMES:
        return jsonify({'success': False, 'error': 'Outcome must be improved, unchanged, or needs_support'}), 400
    plan.outcome = outcome
    plan.outcome_notes = (data.get('outcome_notes') or '').strip() or None
    plan.review_snapshot = capture_snapshot(plan.student)
    plan.status = 'reviewed'
    plan.reviewed_at = datetime.utcnow()
    db.session.commit()
    return jsonify({'success': True, 'data': plan.to_dict()}), 200
