"""
Lesson Routes
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.lesson import Lesson
from app.models.progress import Progress
from app.models.user import User
from app.models.quiz import Quiz, QuizAttempt
from datetime import datetime

bp = Blueprint('lessons', __name__)


@bp.route('/', methods=['GET'], strict_slashes=False)
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
    
    # Include the current student's own progress so the lesson list can show
    # what is completed / in progress
    user_id = int(get_jwt_identity())
    progress_by_lesson = {
        p.lesson_id: p for p in Progress.query.filter_by(user_id=user_id).all()
    }
    
    def with_progress(lesson):
        data = lesson.to_dict()
        progress = progress_by_lesson.get(lesson.id)
        data['status'] = progress.status if progress else None
        data['completion_percentage'] = progress.completion_percentage if progress else 0
        return data
    
    return jsonify({
        'lessons': [with_progress(lesson) for lesson in lessons]
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
    
    # attempts is None on a new Progress object until it is flushed
    progress.attempts = (progress.attempts or 0) + 1
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
    data = request.get_json(silent=True) or {}
    
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
    progress.last_accessed = datetime.utcnow()  # keep feature extraction accurate
    progress.time_spent = int(time_spent)
    
    # Award XP to user and record time for ML feature tracking
    user = User.query.get(user_id)
    leveled_up = user.add_xp(lesson.xp_reward)
    user.lessons_completed = (user.lessons_completed or 0) + 1
    # Update total_time_spent (in minutes) so ML engagement features are accurate
    user.total_time_spent = (user.total_time_spent or 0) + max(0, int(time_spent) // 60)
    
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


@bp.route('/<int:lesson_id>/quiz', methods=['POST'])
@jwt_required()
def submit_quiz(lesson_id):
    """Submit quiz answers for a lesson and record attempt for ML data collection."""
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}

    lesson = Lesson.query.get(lesson_id)
    if not lesson:
        return jsonify({'error': 'Lesson not found'}), 404

    quiz = Quiz.query.filter_by(lesson_id=lesson_id, is_active=True).first()
    if not quiz:
        return jsonify({'error': 'No quiz found for this lesson'}), 404

    answers = data.get('answers', [])
    time_taken = data.get('time_taken', 0)

    if not isinstance(answers, list):
        return jsonify({'error': 'answers must be a list'}), 400
    if not isinstance(time_taken, (int, float)) or time_taken < 0:
        time_taken = 0

    questions = quiz.questions or []
    total = len(questions)
    if total == 0:
        return jsonify({'error': 'Quiz has no questions'}), 500

    correct_count = 0
    for i, question in enumerate(questions):
        if i < len(answers) and answers[i] == question.get('correct'):
            correct_count += 1

    score = round((correct_count / total) * 100, 1)
    passed = score >= quiz.passing_score

    attempt = QuizAttempt(
        user_id=user_id,
        quiz_id=quiz.id,
        answers=answers,
        score=score,
        passed=passed,
        time_taken=int(time_taken),
        completed_at=datetime.utcnow()
    )
    db.session.add(attempt)

    xp_earned = 0
    leveled_up = False
    user = User.query.get(user_id)
    if passed:
        xp_earned = quiz.xp_reward
        leveled_up = user.add_xp(xp_earned)
        user.quizzes_taken = (user.quizzes_taken or 0) + 1

    db.session.commit()

    return jsonify({
        'score': score,
        'passed': passed,
        'correct': correct_count,
        'total': total,
        'xp_earned': xp_earned,
        'total_xp': user.total_xp,
        'level': user.level,
        'leveled_up': leveled_up
    }), 200
