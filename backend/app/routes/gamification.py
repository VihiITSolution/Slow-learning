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
    """
    Get user's unlocked achievements
    ---
    tags:
      - Gamification
    security:
      - Bearer: []
    responses:
      200:
        description: List of user achievements
        schema:
          type: object
          properties:
            achievements:
              type: array
              items:
                type: object
                properties:
                  id:
                    type: integer
                  achievement_type:
                    type: string
                  title:
                    type: string
                  description:
                    type: string
                  badge_icon:
                    type: string
                  xp_bonus:
                    type: integer
                  earned_at:
                    type: string
      401:
        description: Unauthorized - invalid or missing token
        schema:
          $ref: '#/definitions/Error'
    """
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
    
    # Validate XP bonus (prevent negative or excessive values)
    xp_bonus = data.get('xp_bonus', 0)
    if not isinstance(xp_bonus, (int, float)) or xp_bonus < 0 or xp_bonus > 10000:
        return jsonify({'error': 'Invalid XP bonus. Must be between 0 and 10000'}), 400
    
    # Create achievement
    achievement = Achievement(
        user_id=user_id,
        achievement_type=achievement_type,
        title=data.get('title', ''),
        description=data.get('description', ''),
        badge_icon=data.get('badge_icon', ''),
        xp_bonus=int(xp_bonus)
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
    """
    Get leaderboard rankings by period
    ---
    tags:
      - Gamification
    parameters:
      - in: query
        name: period
        type: string
        required: false
        default: all_time
        enum: [daily, weekly, monthly, all_time]
        description: Leaderboard period
        example: weekly
      - in: query
        name: limit
        type: integer
        required: false
        default: 10
        description: Maximum number of entries to return
        example: 10
    responses:
      200:
        description: Leaderboard rankings
        schema:
          type: object
          properties:
            period:
              type: string
            leaderboard:
              type: array
              items:
                type: object
                properties:
                  rank:
                    type: integer
                  user_id:
                    type: integer
                  username:
                    type: string
                  score:
                    type: integer
                  level:
                    type: integer
                  avatar_url:
                    type: string
    """
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
    """
    Get user's login streak information
    ---
    tags:
      - Gamification
    security:
      - Bearer: []
    responses:
      200:
        description: User streak information
        schema:
          type: object
          properties:
            current_streak:
              type: integer
              description: Current consecutive login streak
            longest_streak:
              type: integer
              description: Longest streak achieved
            last_login:
              type: string
              format: date-time
              description: Last login timestamp (ISO 8601)
      401:
        description: Unauthorized - invalid or missing token
        schema:
          $ref: '#/definitions/Error'
      404:
        description: User not found
        schema:
          $ref: '#/definitions/Error'
    """
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
