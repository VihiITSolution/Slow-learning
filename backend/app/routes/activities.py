"""
Student Activities API - practice rounds, lesson activities, learning-game
runs and the daily check-in. Everything here is stored as ActivityAttempt
rows that feed the engagement model and the teacher reports.
"""
import json
from datetime import datetime

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app import db
from app.models.activity import ActivityAttempt
from app.models.lesson import Lesson
from app.models.progress import Progress
from app.models.user import User
from app.services import practice_generator
from app.services.activity_service import (MOODS, activity_summary, check_in_dict, start_of_today,
                                           todays_check_in)

bp = Blueprint('activities', __name__)

# XP keeps practice rewarding without making it a way to farm points
PRACTICE_XP = 5            # per round
PRACTICE_PERFECT_BONUS = 5  # all right first time
PRACTICE_XP_ROUNDS_PER_DAY = 5
GAME_XP = 5
GAME_XP_RUNS_PER_DAY = 3

MOOD_MESSAGES = {
    'great': "Brilliant! Let's have a fun learning day! 🌟",
    'okay': "Nice! Let's learn something new today.",
    'unsure': "That's okay. Let's start with something easy.",
    'hard': "Thank you for telling us. We'll go slowly today, and your teacher is here to help. 💙",
}


def _int(value, low, high, default=0):
    try:
        number = int(value)
    except (TypeError, ValueError):
        return default
    return max(low, min(high, number))


def _current_user():
    return User.query.get(int(get_jwt_identity()))


def _today(user_id, activity_type):
    return ActivityAttempt.query.filter(
        ActivityAttempt.user_id == user_id,
        ActivityAttempt.activity_type == activity_type,
        ActivityAttempt.created_at >= start_of_today(),
    )


def _award(user, amount):
    if amount <= 0:
        return False
    return user.add_xp(amount)


# ------------------------------------------------------------------ practice
@bp.route('/practice/areas', methods=['GET'])
@jwt_required()
def practice_areas():
    """The practice areas with this student's recent accuracy in each."""
    summary = activity_summary(int(get_jwt_identity()))
    return jsonify({'areas': [
        {'id': key, **info, 'accuracy_week': summary['accuracy_by_area'].get(key)}
        for key, info in practice_generator.CATEGORIES.items()
    ]}), 200


@bp.route('/practice/<category>', methods=['GET'])
@jwt_required()
def get_practice_round(category):
    """
    A new 5-question practice round.

    The seed comes back with the answers so the server can check them.
    """
    if category not in practice_generator.CATEGORIES:
        return jsonify({'error': 'Unknown practice area'}), 404
    seed = practice_generator.new_seed()
    questions = practice_generator.build_round(category, seed)
    return jsonify({'category': category, **practice_generator.CATEGORIES[category],
                    'seed': seed, 'questions': questions}), 200


@bp.route('/practice', methods=['POST'])
@jwt_required()
def submit_practice_round():
    """
    Save a practice round.

    Body: {category, seed, answers: [{choice, tries, hint_used, seconds}, ...]}
    choice is the first option the student picked; tries counts every pick
    until they found the right one.
    """
    user = _current_user()
    data = request.get_json(silent=True) or {}
    category = data.get('category')
    if category not in practice_generator.CATEGORIES:
        return jsonify({'error': 'Unknown practice area'}), 400
    try:
        seed = int(data.get('seed'))
    except (TypeError, ValueError):
        return jsonify({'error': 'seed is required'}), 400
    answers = data.get('answers')
    questions = practice_generator.build_round(category, seed)
    if not isinstance(answers, list) or len(answers) != len(questions):
        return jsonify({'error': f'answers must be a list of {len(questions)} items'}), 400

    for previous in ActivityAttempt.query.filter_by(user_id=user.id, activity_type=ActivityAttempt.PRACTICE,
                                                    category=category).order_by(ActivityAttempt.id.desc()).limit(50):
        if (previous.details or {}).get('seed') == seed:
            return jsonify({'error': 'This practice round was already saved'}), 409

    correct = hints = retries = seconds_total = 0
    per_question, review = [], []
    for question, answer in zip(questions, answers):
        answer = answer if isinstance(answer, dict) else {}
        choice = _int(answer.get('choice'), -1, len(question['options']) - 1, default=-1)
        right = choice == question['answer']
        tries = 1 if right else _int(answer.get('tries'), 1, 10, default=1)
        hint_used = bool(answer.get('hint_used'))
        seconds = _int(answer.get('seconds'), 0, 600)
        correct += int(right)
        hints += int(hint_used)
        retries += tries - 1
        seconds_total += seconds
        per_question.append({'type': question['type'], 'correct': right, 'tries': tries,
                             'hint_used': hint_used, 'seconds': seconds})
        review.append({'prompt': question['prompt'], 'is_correct': right,
                       'your_answer': question['options'][choice] if choice >= 0 else None,
                       'correct_answer': question['options'][question['answer']]})

    total = len(questions)
    score = round(correct / total * 100, 1)
    xp_rounds_today = _today(user.id, ActivityAttempt.PRACTICE).filter(ActivityAttempt.xp_earned > 0).count()
    xp_earned = 0
    if xp_rounds_today < PRACTICE_XP_ROUNDS_PER_DAY:
        xp_earned = PRACTICE_XP + (PRACTICE_PERFECT_BONUS if correct == total else 0)
    leveled_up = _award(user, xp_earned)

    attempt = ActivityAttempt(user_id=user.id, activity_type=ActivityAttempt.PRACTICE, category=category,
                              correct=correct, total=total, score=score, hints_used=hints, retries=retries,
                              time_spent=min(seconds_total, 1800), xp_earned=xp_earned,
                              details={'seed': seed, 'questions': per_question})
    db.session.add(attempt)
    db.session.commit()

    return jsonify({
        'id': attempt.id,
        'score': score,
        'correct': correct,
        'total': total,
        'stars': 3 if score >= 80 else 2 if score >= 60 else 1,
        'hints_used': hints,
        'xp_earned': xp_earned,
        'xp_rounds_left_today': max(0, PRACTICE_XP_ROUNDS_PER_DAY - xp_rounds_today - (1 if xp_earned else 0)),
        'leveled_up': leveled_up,
        'level': user.level,
        'total_xp': user.total_xp,
        'review': review,
    }), 201


# --------------------------------------------------------- lesson activities
@bp.route('/lesson-steps', methods=['POST'])
@jwt_required()
def submit_lesson_steps():
    """
    Save the practice questions inside a lesson (the "activity" steps).

    Body: {lesson_id, answers: [first option picked for each activity step], time_spent}
    The lesson's own answer key is used to mark them.
    """
    user = _current_user()
    data = request.get_json(silent=True) or {}
    lesson = Lesson.query.get(_int(data.get('lesson_id'), 0, 10 ** 9))
    if not lesson:
        return jsonify({'error': 'Lesson not found'}), 404
    try:
        content = json.loads(lesson.content) if isinstance(lesson.content, str) else (lesson.content or {})
    except (TypeError, ValueError):
        content = {}
    steps = [s for s in (content.get('steps') or []) if s.get('type') == 'activity' and 'correct' in s]
    if not steps:
        return jsonify({'error': 'This lesson has no activities to save'}), 400
    answers = data.get('answers')
    if not isinstance(answers, list) or len(answers) != len(steps):
        return jsonify({'error': f'answers must be a list of {len(steps)} items'}), 400

    results = [_int(a, -1, 50, default=-1) == step['correct'] for a, step in zip(answers, steps)]
    correct = sum(results)
    attempt = ActivityAttempt(user_id=user.id, activity_type=ActivityAttempt.LESSON_STEPS,
                              category=lesson.category, lesson_id=lesson.id, correct=correct,
                              total=len(steps), score=round(correct / len(steps) * 100, 1),
                              time_spent=_int(data.get('time_spent'), 0, 3600),
                              details={'results': results})
    db.session.add(attempt)
    db.session.commit()
    return jsonify({'id': attempt.id, 'correct': correct, 'total': len(steps), 'score': attempt.score}), 201


# ------------------------------------------------------------ learning games
@bp.route('/game', methods=['POST'])
@jwt_required()
def submit_game_run():
    """
    Save one run of the learning games.

    Body: {games_completed, games_total, errors, time_spent, session_id}
    Score = finished games / (finished games + wrong tries).
    """
    user = _current_user()
    data = request.get_json(silent=True) or {}
    total = _int(data.get('games_total'), 1, 20, default=5)
    completed = _int(data.get('games_completed'), 0, total)
    errors = _int(data.get('errors'), 0, 500)
    score = round(completed / (completed + errors) * 100, 1) if completed + errors else None

    runs_with_xp = _today(user.id, ActivityAttempt.GAME).filter(ActivityAttempt.xp_earned > 0).count()
    xp_earned = GAME_XP if completed and runs_with_xp < GAME_XP_RUNS_PER_DAY else 0
    leveled_up = _award(user, xp_earned)

    attempt = ActivityAttempt(user_id=user.id, activity_type=ActivityAttempt.GAME, category='games',
                              correct=completed, total=total, score=score, retries=errors,
                              time_spent=_int(data.get('time_spent'), 0, 3600), xp_earned=xp_earned,
                              details={'session_id': str(data.get('session_id') or '')[:50] or None})
    db.session.add(attempt)
    db.session.commit()
    return jsonify({'id': attempt.id, 'score': score, 'xp_earned': xp_earned, 'leveled_up': leveled_up,
                    'level': user.level, 'total_xp': user.total_xp}), 201


# ---------------------------------------------------------- daily check-in
@bp.route('/check-in', methods=['POST'])
@jwt_required()
def check_in():
    """How do you feel about learning today? One answer per day (a new answer replaces it)."""
    user = _current_user()
    mood = (request.get_json(silent=True) or {}).get('mood')
    if mood not in MOODS:
        return jsonify({'error': f"mood must be one of: {', '.join(MOODS)}"}), 400

    attempt = todays_check_in(user.id)
    if attempt:
        attempt.mood = mood
        attempt.created_at = datetime.utcnow()
    else:
        attempt = ActivityAttempt(user_id=user.id, activity_type=ActivityAttempt.CHECK_IN, mood=mood)
        db.session.add(attempt)
    db.session.commit()
    return jsonify({'check_in': check_in_dict(attempt), 'message': MOOD_MESSAGES[mood]}), 200


# ------------------------------------------------------------------- today
@bp.route('/today', methods=['GET'])
@jwt_required()
def today():
    """Today's challenges for the student dashboard, worked out from what they really did."""
    user_id = int(get_jwt_identity())
    midnight = start_of_today()
    lessons_today = Progress.query.filter(Progress.user_id == user_id, Progress.status == 'completed',
                                          Progress.completed_at >= midnight).count()
    practice_today = _today(user_id, ActivityAttempt.PRACTICE).count()
    games_today = _today(user_id, ActivityAttempt.GAME).count()
    check = todays_check_in(user_id)

    challenges = [
        {'id': 'check_in', 'label': 'Tell us how you feel today', 'done': bool(check), 'link': '/app/practice'},
        {'id': 'lesson', 'label': 'Finish one lesson', 'done': lessons_today > 0, 'link': '/app/lessons'},
        {'id': 'practice', 'label': 'Do a practice round', 'done': practice_today > 0, 'link': '/app/practice'},
        {'id': 'game', 'label': 'Play the learning games', 'done': games_today > 0, 'link': '/student-dashboard'},
    ]
    return jsonify({
        'check_in': check_in_dict(check),
        'lessons_today': lessons_today,
        'practice_rounds_today': practice_today,
        'games_today': games_today,
        'challenges': challenges,
        'done': sum(c['done'] for c in challenges),
        'total': len(challenges),
    }), 200


# ------------------------------------------------------------ teacher view
@bp.route('/student/<int:student_id>', methods=['GET'])
@jwt_required()
def student_activities(student_id):
    """A student's activity summary and recent activities (teachers and admins)."""
    viewer = _current_user()
    if not viewer or viewer.role not in ('teacher', 'admin'):
        return jsonify({'error': 'Access denied. Teacher or admin role required'}), 403
    student = User.query.get(student_id)
    if not student or student.role != 'student':
        return jsonify({'error': 'Student not found'}), 404
    recent = ActivityAttempt.query.filter_by(user_id=student_id) \
        .order_by(ActivityAttempt.created_at.desc()).limit(20).all()
    return jsonify({'student_id': student_id, 'username': student.username,
                    'summary': activity_summary(student_id),
                    'recent': [a.to_dict() for a in recent]}), 200
