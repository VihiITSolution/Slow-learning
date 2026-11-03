"""
Analytics Routes
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User
from app.models.progress import Progress
from app.models.quiz import QuizAttempt
from app.ml_models.engagement_predictor import FEATURE_NAMES
from datetime import datetime, timedelta
from sqlalchemy import func

bp = Blueprint('analytics', __name__)

_engagement_service = None


def _get_engagement_service():
    global _engagement_service
    if _engagement_service is None:
        from app.services.engagement_service import EngagementService
        _engagement_service = EngagementService()
    return _engagement_service


@bp.route('/dashboard', methods=['GET'])
@jwt_required()
def get_dashboard():
    """Get user analytics dashboard data"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Get progress statistics
    total_lessons = Progress.query.filter_by(user_id=user_id).count()
    completed_lessons = Progress.query.filter_by(
        user_id=user_id,
        status='completed'
    ).count()
    
    # Get quiz statistics
    total_quizzes = QuizAttempt.query.filter_by(user_id=user_id).count()
    avg_quiz_score = db.session.query(func.avg(QuizAttempt.score)).filter_by(
        user_id=user_id
    ).scalar() or 0
    
    # Get recent activity
    recent_progress = Progress.query.filter_by(user_id=user_id).order_by(
        Progress.last_accessed.desc()
    ).limit(5).all()
    
    return jsonify({
        'user_stats': {
            'total_xp': user.total_xp,
            'level': user.level,
            'current_streak': user.current_streak,
            'longest_streak': user.longest_streak,
            'lessons_completed': completed_lessons,
            'total_lessons_attempted': total_lessons,
            'quizzes_taken': total_quizzes,
            'avg_quiz_score': round(avg_quiz_score, 2)
        },
        'recent_activity': [p.to_dict() for p in recent_progress]
    }), 200


@bp.route('/engagement', methods=['GET'])
@jwt_required()
def check_engagement():
    """Check user engagement status using ML model"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Use the same feature extraction as the teacher reports so both always
    # agree (no-quiz students are "missing", stale streaks are reset, ...)
    prediction = _get_engagement_service().predict_user_engagement(user_id)
    user_data = {name: prediction['features'][name] for name in FEATURE_NAMES}
    
    return jsonify({
        'engagement_status': prediction,
        'metrics': user_data
    }), 200


@bp.route('/progress-over-time', methods=['GET'])
@jwt_required()
def get_progress_over_time():
    """Get user's progress over time"""
    user_id = int(get_jwt_identity())
    days = request.args.get('days', 30, type=int)
    
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Get completed lessons over time
    progress_data = db.session.query(
        func.date(Progress.completed_at).label('date'),
        func.count(Progress.id).label('count')
    ).filter(
        Progress.user_id == user_id,
        Progress.status == 'completed',
        Progress.completed_at >= start_date
    ).group_by(func.date(Progress.completed_at)).all()
    
    # Format response
    timeline = [
        {
            'date': str(date),
            'lessons_completed': count
        }
        for date, count in progress_data
    ]
    
    return jsonify({
        'period_days': days,
        'timeline': timeline
    }), 200
