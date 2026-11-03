"""
Admin Routes

Read-only data for the admin pages (dashboard, users, lessons, analytics).

    GET /api/admin/overview   counts, lesson statistics, recent sign-ups, support plans
    GET /api/admin/users      every account with its learning activity (?role=&search=)
"""
from datetime import datetime, timedelta

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from sqlalchemy import func

from app import db
from app.models.intervention_plan import InterventionPlan
from app.models.lesson import Lesson
from app.models.progress import Progress
from app.models.quiz import Quiz, QuizAttempt
from app.models.user import User

bp = Blueprint('admin', __name__, url_prefix='/api/admin')

ROLES = ('student', 'teacher', 'admin')


def _require_admin():
    try:
        user = db.session.get(User, int(get_jwt_identity()))
    except (TypeError, ValueError):
        user = None
    if not user or user.role != 'admin':
        return jsonify({'success': False, 'error': 'Admin role required'}), 403
    return None


def _iso(value):
    return value.isoformat() if value else None


@bp.route('/overview', methods=['GET'])
@jwt_required()
def overview():
    """
    Platform overview for the admin dashboard and analytics pages
    ---
    tags:
      - Admin
    security:
      - Bearer: []
    responses:
      200: {description: Overview}
      403: {description: Admin role required}
    """
    error = _require_admin()
    if error:
        return error

    now = datetime.utcnow()
    today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_ago = now - timedelta(days=7)

    role_counts = dict(db.session.query(User.role, func.count(User.id)).group_by(User.role).all())
    students = User.query.filter_by(role='student')

    completions = dict(
        db.session.query(Progress.lesson_id, func.count(Progress.id))
        .filter(Progress.status == 'completed').group_by(Progress.lesson_id).all()
    )
    in_progress = dict(
        db.session.query(Progress.lesson_id, func.count(Progress.id))
        .filter(Progress.status == 'in_progress').group_by(Progress.lesson_id).all()
    )
    quiz_scores = dict(
        db.session.query(Quiz.lesson_id, func.avg(QuizAttempt.score))
        .join(QuizAttempt, QuizAttempt.quiz_id == Quiz.id).group_by(Quiz.lesson_id).all()
    )
    quiz_attempts = dict(
        db.session.query(Quiz.lesson_id, func.count(QuizAttempt.id))
        .join(QuizAttempt, QuizAttempt.quiz_id == Quiz.id).group_by(Quiz.lesson_id).all()
    )

    lessons = []
    for lesson in Lesson.query.order_by(Lesson.order_index, Lesson.id).all():
        avg_score = quiz_scores.get(lesson.id)
        lessons.append({
            'id': lesson.id,
            'title': lesson.title,
            'category': lesson.category,
            'difficulty_level': lesson.difficulty_level,
            'xp_reward': lesson.xp_reward,
            'is_active': lesson.is_active,
            'completions': completions.get(lesson.id, 0),
            'in_progress': in_progress.get(lesson.id, 0),
            'quiz_attempts': quiz_attempts.get(lesson.id, 0),
            'avg_quiz_score': round(float(avg_score), 1) if avg_score is not None else None,
        })

    plan_status = dict(db.session.query(InterventionPlan.status, func.count(InterventionPlan.id))
                       .group_by(InterventionPlan.status).all())
    plan_outcomes = dict(db.session.query(InterventionPlan.outcome, func.count(InterventionPlan.id))
                         .filter(InterventionPlan.outcome.isnot(None)).group_by(InterventionPlan.outcome).all())

    avg_quiz = db.session.query(func.avg(QuizAttempt.score)).scalar()
    recent = User.query.order_by(User.created_at.desc()).limit(5).all()

    return jsonify({
        'success': True,
        'data': {
            'users': {
                'total': sum(role_counts.values()),
                'by_role': {role: role_counts.get(role, 0) for role in ROLES},
                'students_active_today': students.filter(User.last_login >= today).count(),
                'students_active_week': students.filter(User.last_login >= week_ago).count(),
                'new_this_week': User.query.filter(User.created_at >= week_ago).count(),
            },
            'learning': {
                'active_lessons': Lesson.query.filter_by(is_active=True).count(),
                'lessons_completed': sum(completions.values()),
                'quiz_attempts': QuizAttempt.query.count(),
                'avg_quiz_score': round(float(avg_quiz), 1) if avg_quiz is not None else None,
            },
            'support_plans': {
                'active': plan_status.get('active', 0),
                'reviewed': plan_status.get('reviewed', 0),
                'outcomes': {key: plan_outcomes.get(key, 0) for key in ('improved', 'unchanged', 'needs_support')},
            },
            'lessons': lessons,
            'recent_users': [
                {'id': u.id, 'username': u.username, 'role': u.role, 'created_at': _iso(u.created_at)}
                for u in recent
            ],
        },
    }), 200


@bp.route('/users', methods=['GET'])
@jwt_required()
def list_users():
    """
    Every account with its learning activity
    ---
    tags:
      - Admin
    security:
      - Bearer: []
    parameters:
      - {in: query, name: role, type: string, enum: [student, teacher, admin]}
      - {in: query, name: search, type: string}
    responses:
      200: {description: Users}
      400: {description: Invalid role}
      403: {description: Admin role required}
    """
    error = _require_admin()
    if error:
        return error

    query = User.query
    role = request.args.get('role')
    if role:
        if role not in ROLES:
            return jsonify({'success': False, 'error': 'role must be student, teacher or admin'}), 400
        query = query.filter(User.role == role)
    search = (request.args.get('search') or '').strip()
    if search:
        like = f'%{search}%'
        query = query.filter((User.username.ilike(like)) | (User.email.ilike(like)))

    completed = dict(
        db.session.query(Progress.user_id, func.count(Progress.id))
        .filter(Progress.status == 'completed').group_by(Progress.user_id).all()
    )
    quizzes = dict(db.session.query(QuizAttempt.user_id, func.count(QuizAttempt.id)).group_by(QuizAttempt.user_id).all())

    users = [{
        'id': u.id,
        'username': u.username,
        'email': u.email,
        'role': u.role,
        'level': u.level,
        'total_xp': u.total_xp or 0,
        'current_streak': u.current_streak or 0,
        'lessons_completed': completed.get(u.id, 0),
        'quiz_attempts': quizzes.get(u.id, 0),
        'last_login': _iso(u.last_login),
        'created_at': _iso(u.created_at),
    } for u in query.order_by(User.role, User.username).all()]

    return jsonify({'success': True, 'data': users, 'count': len(users)}), 200
