"""
AI assistant API for teachers (Google Gemini, with built-in fallbacks).

  GET  /api/ai/status                              is AI switched on?
  POST /api/ai/support-plan/suggest                draft a support plan for a student
  POST /api/ai/support-plans/<id>/review-summary   explain a plan's before/after numbers
  POST /api/ai/class-summary                       who to help first, patterns, who to celebrate
  POST /api/ai/encouragement/draft                 draft a short message to a student
  POST /api/ai/suggestions/<id>/used               the teacher used a suggestion
  POST /api/ai/messages                            send a (checked) message to a student

  GET  /api/ai/messages/mine                       a student's messages from teachers
  POST /api/ai/messages/<id>/read                  the student has seen it

Only anonymous numbers are sent to Gemini (see app/services/ai_service.py).
"""
from datetime import datetime

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app import db
from app.models.ai import AISuggestion, TeacherMessage
from app.models.intervention_plan import InterventionPlan
from app.models.user import User
from app.services import ai_service
from app.services.engagement_service import EngagementService

bp = Blueprint('ai_assistant', __name__)
engagement_service = EngagementService()
MAX_CLASS_STUDENTS = 30


def _me():
    return User.query.get(int(get_jwt_identity()))


def _staff():
    user = _me()
    if not user or user.role not in ('teacher', 'admin'):
        return None, (jsonify({'success': False, 'error': 'Teacher or admin role required'}), 403)
    return user, None


def _student(value):
    try:
        student = User.query.get(int(value))
    except (TypeError, ValueError):
        return None
    return student if student and student.role == 'student' else None


def _log(kind, teacher, answer, payload, student=None, plan=None):
    suggestion = AISuggestion(kind=kind, teacher_id=teacher.id, student_id=student.id if student else None,
                              plan_id=plan.id if plan else None, source=answer['source'], model=answer['model'],
                              input_data=payload, output=answer['result'], latency_ms=answer.get('latency_ms'))
    db.session.add(suggestion)
    db.session.commit()
    return suggestion


def _reply(suggestion, answer, result=None):
    return jsonify({'success': True, 'data': {
        'suggestion_id': suggestion.id,
        'source': answer['source'],
        'model': answer['model'],
        'note': answer['note'],
        'privacy_note': ai_service.PRIVACY_NOTE,
        'suggestion': result if result is not None else answer['result'],
    }}), 200


@bp.route('/status', methods=['GET'])
@jwt_required()
def status():
    client = ai_service.GeminiClient.from_app()
    return jsonify({'success': True, 'data': {
        'enabled': client.enabled,
        'provider': 'Google Gemini',
        'model': client.model if client.enabled else None,
        'privacy_note': ai_service.PRIVACY_NOTE,
    }}), 200


# ---------------------------------------------------------------- plan suggestion
@bp.route('/support-plan/suggest', methods=['POST'])
@jwt_required()
def suggest_plan():
    teacher, error = _staff()
    if error:
        return error
    student = _student((request.get_json(silent=True) or {}).get('student_id'))
    if not student:
        return jsonify({'success': False, 'error': 'Student not found'}), 404
    profile = ai_service.anonymous_profile(engagement_service.predict_user_engagement(student.id) or {})
    answer = ai_service.run(AISuggestion.PLAN, profile, ai_service.plan_prompt(profile), ai_service.PLAN_SCHEMA,
                            ai_service.clean_plan, ai_service.rules_plan, cache_key=profile)
    suggestion = _log(AISuggestion.PLAN, teacher, answer, profile, student=student)
    return _reply(suggestion, answer)


# ---------------------------------------------------------------- review summary
@bp.route('/support-plans/<int:plan_id>/review-summary', methods=['POST'])
@jwt_required()
def review_summary(plan_id):
    teacher, error = _staff()
    if error:
        return error
    plan = InterventionPlan.query.get(plan_id)
    if not plan:
        return jsonify({'success': False, 'error': 'Plan not found'}), 404
    if teacher.role != 'admin' and plan.teacher_id != teacher.id:
        return jsonify({'success': False, 'error': 'Only the plan author or an admin can review this plan'}), 403
    from app.routes.support_plans import capture_snapshot  # same snapshot the review will save
    now = plan.review_snapshot if plan.status == 'reviewed' and plan.review_snapshot else capture_snapshot(plan.student)
    days = (datetime.utcnow() - plan.created_at).days if plan.created_at else 0
    payload = ai_service.review_payload(plan, plan.baseline_snapshot or {}, now, days)
    answer = ai_service.run(AISuggestion.REVIEW, payload, ai_service.review_prompt(payload), ai_service.REVIEW_SCHEMA,
                            ai_service.clean_review, ai_service.rules_review, cache_key=payload)
    suggestion = _log(AISuggestion.REVIEW, teacher, answer, payload, student=plan.student, plan=plan)
    return _reply(suggestion, answer)


# ---------------------------------------------------------------- class summary
@bp.route('/class-summary', methods=['POST'])
@jwt_required()
def class_summary():
    teacher, error = _staff()
    if error:
        return error
    predictions = engagement_service.predict_all_users_engagement()
    rows = []
    for prediction in predictions:
        uid = prediction.get('user_id') or (prediction.get('user_info') or {}).get('user_id')
        if uid and 'error' not in prediction:
            rows.append((uid, prediction))
    order = ai_service.RISK_ORDER
    rows.sort(key=lambda r: (0 if r[1].get('engaged') is False else 1, order.get(r[1].get('risk_level'), 6)))
    rows = rows[:MAX_CLASS_STUDENTS]
    if not rows:
        return jsonify({'success': False, 'error': 'There are no students to summarise yet'}), 400

    # Students are sent as S1, S2, ... and matched back to names only here
    refs, students = {}, []
    for i, (uid, prediction) in enumerate(rows, 1):
        ref = f'S{i}'
        refs[ref] = uid
        students.append({'ref': ref, **ai_service.anonymous_profile(prediction)})
    answer = ai_service.run(AISuggestion.CLASS, students, ai_service.class_prompt(students), ai_service.CLASS_SCHEMA,
                            ai_service.clean_class, ai_service.rules_class, cache_key=students)
    suggestion = _log(AISuggestion.CLASS, teacher, answer, students)

    users = {u.id: u for u in User.query.filter(User.id.in_(refs.values())).all()}

    def named(item):
        user = users.get(refs.get(item['ref']))
        return {**item, 'student_id': user.id if user else None, 'username': user.username if user else item['ref']}

    result = dict(answer['result'])
    result['priorities'] = [named(p) for p in result.get('priorities', [])]
    result['celebrate'] = [named(c) for c in result.get('celebrate', [])]
    result['students_included'] = len(students)
    return _reply(suggestion, answer, result)


# ---------------------------------------------------------------- encouragement
@bp.route('/encouragement/draft', methods=['POST'])
@jwt_required()
def draft_encouragement():
    teacher, error = _staff()
    if error:
        return error
    student = _student((request.get_json(silent=True) or {}).get('student_id'))
    if not student:
        return jsonify({'success': False, 'error': 'Student not found'}), 404
    profile = ai_service.anonymous_profile(engagement_service.predict_user_engagement(student.id) or {})
    answer = ai_service.run(AISuggestion.ENCOURAGEMENT, profile, ai_service.encouragement_prompt(profile),
                            ai_service.ENCOURAGEMENT_SCHEMA, ai_service.clean_encouragement,
                            ai_service.rules_encouragement, cache_key=None)
    suggestion = _log(AISuggestion.ENCOURAGEMENT, teacher, answer, profile, student=student)
    # The child's name goes in here, after the AI has written the message
    return _reply(suggestion, answer, {'message': ai_service.personalise(answer['result']['message'], student)})


@bp.route('/suggestions/<int:suggestion_id>/used', methods=['POST'])
@jwt_required()
def mark_used(suggestion_id):
    teacher, error = _staff()
    if error:
        return error
    suggestion = AISuggestion.query.get(suggestion_id)
    if not suggestion or (suggestion.teacher_id != teacher.id and teacher.role != 'admin'):
        return jsonify({'success': False, 'error': 'Suggestion not found'}), 404
    suggestion.used, suggestion.used_at = True, datetime.utcnow()
    db.session.commit()
    return jsonify({'success': True, 'data': suggestion.to_dict()}), 200


# ---------------------------------------------------------------- messages
@bp.route('/messages', methods=['POST'])
@jwt_required()
def send_message():
    teacher, error = _staff()
    if error:
        return error
    data = request.get_json(silent=True) or {}
    student = _student(data.get('student_id'))
    if not student:
        return jsonify({'success': False, 'error': 'Student not found'}), 404
    body = data.get('body')
    if not isinstance(body, str) or not body.strip():
        return jsonify({'success': False, 'error': 'Message text is required'}), 400
    body = body.strip()[:500]
    suggestion = None
    if data.get('ai_suggestion_id') is not None:
        suggestion = AISuggestion.query.get(data.get('ai_suggestion_id'))
        if not suggestion or suggestion.teacher_id != teacher.id or suggestion.kind != AISuggestion.ENCOURAGEMENT:
            suggestion = None
        else:
            suggestion.used, suggestion.used_at = True, datetime.utcnow()
    message = TeacherMessage(student_id=student.id, teacher_id=teacher.id, body=body,
                             ai_suggestion_id=suggestion.id if suggestion else None)
    db.session.add(message)
    db.session.commit()
    return jsonify({'success': True, 'data': message.to_dict()}), 201


@bp.route('/messages/mine', methods=['GET'])
@jwt_required()
def my_messages():
    me = _me()
    messages = TeacherMessage.query.filter_by(student_id=me.id).order_by(TeacherMessage.created_at.desc()).limit(5).all()
    return jsonify({'success': True, 'data': {
        'messages': [m.to_dict() for m in messages],
        'unread': TeacherMessage.query.filter_by(student_id=me.id, read_at=None).count(),
    }}), 200


@bp.route('/messages/<int:message_id>/read', methods=['POST'])
@jwt_required()
def read_message(message_id):
    me = _me()
    message = TeacherMessage.query.get(message_id)
    if not message or message.student_id != me.id:
        return jsonify({'success': False, 'error': 'Message not found'}), 404
    if not message.read_at:
        message.read_at = datetime.utcnow()
        db.session.commit()
    return jsonify({'success': True, 'data': message.to_dict()}), 200
