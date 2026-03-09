"""
Lesson Routes
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.lesson import Lesson
from app.models.progress import Progress
from app.models.user import User
from datetime import datetime

bp = Blueprint('lessons', __name__)


@bp.route('/', methods=['GET'])
@jwt_required()
def get_lessons():
    """
    Get all active lessons with optional filtering
    ---
    tags:
      - Lessons
    security:
      - Bearer: []
    parameters:
      - in: query
        name: category
        type: string
        required: false
        description: Filter by lesson category
        example: math
      - in: query
        name: difficulty
        type: string
        required: false
        description: Filter by difficulty level
        enum: [beginner, intermediate, advanced]
        example: beginner
    responses:
      200:
        description: List of lessons
        schema:
          type: object
          properties:
            lessons:
              type: array
              items:
                $ref: '#/definitions/Lesson'
      401:
        description: Unauthorized - invalid or missing token
        schema:
          $ref: '#/definitions/Error'
    """
    category = request.args.get('category')
    difficulty = request.args.get('difficulty')
    
    query = Lesson.query.filter_by(is_active=True)
    
    if category:
        query = query.filter_by(category=category)
    if difficulty:
        query = query.filter_by(difficulty_level=difficulty)
    
    lessons = query.order_by(Lesson.order_index).all()
    
    return jsonify({
        'lessons': [lesson.to_dict() for lesson in lessons]
    }), 200


@bp.route('/<int:lesson_id>', methods=['GET'])
@jwt_required()
def get_lesson(lesson_id):
    """
    Get a specific lesson by ID
    ---
    tags:
      - Lessons
    security:
      - Bearer: []
    parameters:
      - in: path
        name: lesson_id
        type: integer
        required: true
        description: Lesson ID
        example: 1
    responses:
      200:
        description: Lesson details
        schema:
          $ref: '#/definitions/Lesson'
      401:
        description: Unauthorized - invalid or missing token
        schema:
          $ref: '#/definitions/Error'
      404:
        description: Lesson not found
        schema:
          $ref: '#/definitions/Error'
    """
    lesson = Lesson.query.get(lesson_id)
    
    if not lesson:
        return jsonify({'error': 'Lesson not found'}), 404
    
    return jsonify(lesson.to_dict()), 200


@bp.route('/<int:lesson_id>/start', methods=['POST'])
@jwt_required()
def start_lesson(lesson_id):
    """
    Start a lesson (create or update progress)
    ---
    tags:
      - Lessons
    security:
      - Bearer: []
    parameters:
      - in: path
        name: lesson_id
        type: integer
        required: true
        description: Lesson ID
        example: 1
    responses:
      200:
        description: Lesson started successfully
        schema:
          type: object
          properties:
            message:
              type: string
            progress:
              type: object
              description: Progress record
      401:
        description: Unauthorized - invalid or missing token
        schema:
          $ref: '#/definitions/Error'
      404:
        description: Lesson not found
        schema:
          $ref: '#/definitions/Error'
    """
    user_id = int(get_jwt_identity())
    
    # Check if lesson exists
    lesson = Lesson.query.get(lesson_id)
    if not lesson:
        return jsonify({'error': 'Lesson not found'}), 404
    
    # Check if progress already exists
    progress = Progress.query.filter_by(
        user_id=user_id,
        lesson_id=lesson_id
    ).first()
    
    if not progress:
        progress = Progress(
            user_id=user_id,
            lesson_id=lesson_id,
            status='in_progress',
            started_at=datetime.utcnow()
        )
        db.session.add(progress)
    else:
        progress.status = 'in_progress'
        progress.last_accessed = datetime.utcnow()
        if not progress.started_at:
            progress.started_at = datetime.utcnow()
    
    progress.attempts += 1
    db.session.commit()
    
    return jsonify({
        'message': 'Lesson started',
        'progress': progress.to_dict()
    }), 200


@bp.route('/<int:lesson_id>/complete', methods=['POST'])
@jwt_required()
def complete_lesson(lesson_id):
    """
    Complete a lesson and award XP
    ---
    tags:
      - Lessons
    security:
      - Bearer: []
    parameters:
      - in: path
        name: lesson_id
        type: integer
        required: true
        description: Lesson ID
        example: 1
      - in: body
        name: body
        required: false
        schema:
          type: object
          properties:
            time_spent:
              type: integer
              description: Time spent in seconds (0-86400)
              example: 1200
    responses:
      200:
        description: Lesson completed successfully
        schema:
          type: object
          properties:
            message:
              type: string
            progress:
              type: object
            xp_earned:
              type: integer
            total_xp:
              type: integer
            level:
              type: integer
            leveled_up:
              type: boolean
            new_level:
              type: integer
      400:
        description: Invalid time_spent value
        schema:
          $ref: '#/definitions/Error'
      401:
        description: Unauthorized - invalid or missing token
        schema:
          $ref: '#/definitions/Error'
      404:
        description: Lesson not found
        schema:
          $ref: '#/definitions/Error'
    """
    user_id = int(get_jwt_identity())
    data = request.get_json()
    
    # Get lesson
    lesson = Lesson.query.get(lesson_id)
    if not lesson:
        return jsonify({'error': 'Lesson not found'}), 404
    
    # Get or create progress
    progress = Progress.query.filter_by(
        user_id=user_id,
        lesson_id=lesson_id
    ).first()
    
    if not progress:
        progress = Progress(
            user_id=user_id,
            lesson_id=lesson_id
        )
        db.session.add(progress)
    
    # Validate time_spent (prevent negative or unrealistic values)
    time_spent = data.get('time_spent', 0)
    if not isinstance(time_spent, (int, float)) or time_spent < 0 or time_spent > 86400:
        return jsonify({'error': 'Invalid time_spent. Must be between 0 and 86400 seconds (24 hours)'}), 400
    
    # Update progress
    progress.status = 'completed'
    progress.completion_percentage = 100
    progress.completed_at = datetime.utcnow()
    progress.time_spent = int(time_spent)
    
    # Award XP to user
    user = User.query.get(user_id)
    leveled_up = user.add_xp(lesson.xp_reward)
    user.lessons_completed += 1
    
    db.session.commit()
    
    response = {
        'message': 'Lesson completed',
        'progress': progress.to_dict(),
        'xp_earned': lesson.xp_reward,
        'total_xp': user.total_xp,
        'level': user.level
    }
    
    if leveled_up:
        response['leveled_up'] = True
        response['new_level'] = user.level
    
    return jsonify(response), 200


@bp.route('/<int:lesson_id>/progress', methods=['PUT'])
@jwt_required()
def update_progress(lesson_id):
    """Update lesson progress"""
    user_id = int(get_jwt_identity())
    data = request.get_json()
    
    progress = Progress.query.filter_by(
        user_id=user_id,
        lesson_id=lesson_id
    ).first()
    
    if not progress:
        return jsonify({'error': 'Progress not found'}), 404
    
    # Update fields
    if 'completion_percentage' in data:
        progress.completion_percentage = data['completion_percentage']
    if 'time_spent' in data:
        progress.time_spent = data['time_spent']
    
    progress.last_accessed = datetime.utcnow()
    
    db.session.commit()
    
    return jsonify({
        'message': 'Progress updated',
        'progress': progress.to_dict()
    }), 200
