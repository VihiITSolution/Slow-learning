"""
Activity Service - turns a student's practice rounds, lesson activities,
learning-game runs and check-ins into numbers for the engagement model and
summaries for teachers.
"""
from datetime import datetime, timedelta

from sqlalchemy import func

from app import db
from app.models.activity import ActivityAttempt

# How far back practice accuracy looks. Two weeks gives enough rounds to be
# stable without hiding recent improvement.
ACCURACY_WINDOW_DAYS = 14

MOODS = {
    'great': {'emoji': '😄', 'label': 'Great'},
    'okay': {'emoji': '🙂', 'label': 'Okay'},
    'unsure': {'emoji': '😕', 'label': 'Not sure'},
    'hard': {'emoji': '😢', 'label': 'Hard day'},
}


def start_of_today():
    """UTC midnight - the same "today" the lesson time already uses."""
    now = datetime.utcnow()
    return datetime(now.year, now.month, now.day)


def activity_features(user_id):
    """
    The activity inputs of the engagement model.

    practice_accuracy   average % right first time over practice rounds,
                        lesson activities and learning games (last 14 days);
                        None when the student has not done any yet
    activities_week     practice rounds + learning-game runs in the last 7 days
    seconds_today       time spent today in practice and games (lesson time
                        is already counted from lesson progress)
    scored_total        how many scored activities the student has ever done
    """
    now = datetime.utcnow()
    base = ActivityAttempt.query.filter(ActivityAttempt.user_id == user_id)

    accuracy = db.session.query(func.avg(ActivityAttempt.score)).filter(
        ActivityAttempt.user_id == user_id,
        ActivityAttempt.activity_type.in_(ActivityAttempt.SCORED_TYPES),
        ActivityAttempt.score.isnot(None),
        ActivityAttempt.created_at >= now - timedelta(days=ACCURACY_WINDOW_DAYS),
    ).scalar()

    activities_week = base.filter(
        ActivityAttempt.activity_type.in_(ActivityAttempt.COUNTED_TYPES),
        ActivityAttempt.created_at >= now - timedelta(days=7),
    ).count()

    seconds_today = db.session.query(func.sum(ActivityAttempt.time_spent)).filter(
        ActivityAttempt.user_id == user_id,
        ActivityAttempt.activity_type.in_(ActivityAttempt.COUNTED_TYPES),
        ActivityAttempt.created_at >= start_of_today(),
    ).scalar() or 0

    scored_total = base.filter(ActivityAttempt.activity_type.in_(ActivityAttempt.SCORED_TYPES)).count()

    return {
        'practice_accuracy': round(float(accuracy), 1) if accuracy is not None else None,
        'activities_week': int(activities_week),
        'seconds_today': int(seconds_today),
        'scored_total': int(scored_total),
    }


def todays_check_in(user_id):
    return ActivityAttempt.query.filter(
        ActivityAttempt.user_id == user_id,
        ActivityAttempt.activity_type == ActivityAttempt.CHECK_IN,
        ActivityAttempt.created_at >= start_of_today(),
    ).order_by(ActivityAttempt.created_at.desc()).first()


def check_in_dict(attempt):
    if not attempt:
        return None
    mood = MOODS.get(attempt.mood, {'emoji': '❔', 'label': attempt.mood})
    return {'mood': attempt.mood, 'emoji': mood['emoji'], 'label': mood['label'],
            'at': attempt.created_at.isoformat() if attempt.created_at else None}


def activity_summary(user_id):
    """What a teacher sees about a student's activities this week."""
    week_ago = datetime.utcnow() - timedelta(days=7)
    week = ActivityAttempt.query.filter(
        ActivityAttempt.user_id == user_id,
        ActivityAttempt.created_at >= week_ago,
    ).all()

    def scored(kind=None, category=None):
        rows = [a for a in week if a.activity_type in ActivityAttempt.SCORED_TYPES and a.score is not None
                and (kind is None or a.activity_type == kind) and (category is None or a.category == category)]
        return round(sum(a.score for a in rows) / len(rows), 1) if rows else None

    questions = [a for a in week if a.activity_type in (ActivityAttempt.PRACTICE, ActivityAttempt.LESSON_STEPS)]
    total_questions = sum(a.total or 0 for a in questions)

    latest = ActivityAttempt.query.filter_by(user_id=user_id, activity_type=ActivityAttempt.CHECK_IN) \
        .order_by(ActivityAttempt.created_at.desc()).first()

    return {
        'practice_rounds_week': sum(1 for a in week if a.activity_type == ActivityAttempt.PRACTICE),
        'games_week': sum(1 for a in week if a.activity_type == ActivityAttempt.GAME),
        'lesson_activities_week': sum(1 for a in week if a.activity_type == ActivityAttempt.LESSON_STEPS),
        'accuracy_by_area': {area: scored(ActivityAttempt.PRACTICE, area) for area in ('math', 'words', 'world')},
        'lesson_activity_accuracy': scored(ActivityAttempt.LESSON_STEPS),
        'hints_per_question': round(sum(a.hints_used or 0 for a in questions) / total_questions, 2) if total_questions else None,
        'retries_per_question': round(sum(a.retries or 0 for a in questions) / total_questions, 2) if total_questions else None,
        'latest_check_in': check_in_dict(latest),
        'checked_in_today': bool(latest and latest.created_at >= start_of_today()),
    }
