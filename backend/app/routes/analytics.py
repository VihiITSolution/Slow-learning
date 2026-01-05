"""
Analytics Routes
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User
from app.models.progress import Progress
from app.models.quiz import QuizAttempt
from app.ml_models.engagement_predictor import EngagementPredictor
from datetime import datetime, timedelta
from sqlalchemy import func

bp = Blueprint('analytics', __name__)

engagement_predictor = EngagementPredictor()


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
    
    # Calculate engagement metrics
    today = datetime.utcnow().date()
    week_ago = datetime.utcnow() - timedelta(days=7)
    
    # Time spent today
    today_progress = Progress.query.filter(
        Progress.user_id == user_id,
        func.date(Progress.last_accessed) == today
    ).all()
    time_spent_today = sum(p.time_spent for p in today_progress) / 60  # Convert to minutes
    
    # Lessons completed this week
    lessons_this_week = Progress.query.filter(
        Progress.user_id == user_id,
        Progress.status == 'completed',
        Progress.completed_at >= week_ago
    ).count()
    
    # Average quiz score
    avg_quiz_score = db.session.query(func.avg(QuizAttempt.score)).filter_by(
        user_id=user_id
    ).scalar() or 0
    
    # Days inactive
    if user.last_login:
        days_inactive = (datetime.utcnow() - user.last_login).days
    else:
        days_inactive = 0
    
    # Prepare data for ML model
    user_data = {
        'time_spent_today': time_spent_today,
        'avg_quiz_score': avg_quiz_score,
        'login_streak': user.current_streak,
        'lessons_completed_week': lessons_this_week,
        'days_inactive': days_inactive
    }
    
    # Get engagement prediction
    prediction = engagement_predictor.predict_engagement(user_data)
    
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
