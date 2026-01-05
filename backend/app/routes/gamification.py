"""
Gamification Routes
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User
from app.models.achievement import Achievement
from app.models.leaderboard import Leaderboard
from datetime import datetime, timedelta

bp = Blueprint('gamification', __name__)


@bp.route('/achievements', methods=['GET'])
@jwt_required()
def get_achievements():
    """Get user's achievements"""
    user_id = int(get_jwt_identity())
    
    achievements = Achievement.query.filter_by(user_id=user_id).order_by(
        Achievement.earned_at.desc()
    ).all()
    
    return jsonify({
        'achievements': [achievement.to_dict() for achievement in achievements]
    }), 200


@bp.route('/achievements/unlock', methods=['POST'])
@jwt_required()
def unlock_achievement():
    """Unlock an achievement for the user"""
    user_id = int(get_jwt_identity())
    data = request.get_json()
    
    achievement_type = data.get('achievement_type')
    if not achievement_type:
        return jsonify({'error': 'Achievement type required'}), 400
    
    # Check if achievement already unlocked
    existing = Achievement.query.filter_by(
        user_id=user_id,
        achievement_type=achievement_type
    ).first()
    
    if existing:
        return jsonify({'error': 'Achievement already unlocked'}), 409
    
    # Create achievement
    achievement = Achievement(
        user_id=user_id,
        achievement_type=achievement_type,
        title=data.get('title', ''),
        description=data.get('description', ''),
        badge_icon=data.get('badge_icon', ''),
        xp_bonus=data.get('xp_bonus', 0)
    )
    
    db.session.add(achievement)
    
    # Award XP bonus
    if achievement.xp_bonus > 0:
        user = User.query.get(user_id)
        user.add_xp(achievement.xp_bonus)
    
    db.session.commit()
    
    return jsonify({
        'message': 'Achievement unlocked!',
        'achievement': achievement.to_dict()
    }), 201


@bp.route('/leaderboard', methods=['GET'])
def get_leaderboard():
    """Get leaderboard rankings"""
    period = request.args.get('period', 'all_time')  # daily, weekly, monthly, all_time
    limit = request.args.get('limit', 10, type=int)
    
    if period == 'all_time':
        # Get top users by total XP
        top_users = User.query.order_by(User.total_xp.desc()).limit(limit).all()
        
        leaderboard = []
        for rank, user in enumerate(top_users, start=1):
            leaderboard.append({
                'rank': rank,
                'user_id': user.id,
                'username': user.username,
                'score': user.total_xp,
                'level': user.level,
                'avatar_url': user.avatar_url
            })
    else:
        # Get leaderboard for specific period
        now = datetime.utcnow()
        
        if period == 'daily':
            period_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        elif period == 'weekly':
            period_start = now - timedelta(days=now.weekday())
            period_start = period_start.replace(hour=0, minute=0, second=0, microsecond=0)
        elif period == 'monthly':
            period_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        else:
            period_start = None
        
        if period_start:
            entries = Leaderboard.query.filter(
                Leaderboard.period == period,
                Leaderboard.period_start >= period_start
            ).order_by(Leaderboard.rank).limit(limit).all()
            
            leaderboard = [entry.to_dict() for entry in entries]
        else:
            leaderboard = []
    
    return jsonify({
        'period': period,
        'leaderboard': leaderboard
    }), 200


@bp.route('/streak', methods=['GET'])
@jwt_required()
def get_streak():
    """Get user's streak information"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify({
        'current_streak': user.current_streak,
        'longest_streak': user.longest_streak,
        'last_login': user.last_login.isoformat() if user.last_login else None
    }), 200


@bp.route('/xp/add', methods=['POST'])
@jwt_required()
def add_xp():
    """Add XP to user (for completing activities)"""
    user_id = int(get_jwt_identity())
    data = request.get_json()
    
    xp_amount = data.get('xp_amount', 0)
    if xp_amount <= 0:
        return jsonify({'error': 'Invalid XP amount'}), 400
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    leveled_up = user.add_xp(xp_amount)
    db.session.commit()
    
    response = {
        'message': 'XP added',
        'xp_earned': xp_amount,
        'total_xp': user.total_xp,
        'level': user.level
    }
    
    if leveled_up:
        response['leveled_up'] = True
        response['new_level'] = user.level
    
    return jsonify(response), 200
