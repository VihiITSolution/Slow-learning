"""
Tests for the AI assistant (Gemini) and its built-in fallbacks.

Google is never called: urlopen is replaced by a fake that records the
request, so these tests also check that no names or IDs are sent.
"""
import io
import json
import urllib.error
from datetime import datetime, timedelta

import pytest

from app import db
from app.models.ai import AISuggestion, TeacherMessage
from app.models.intervention_plan import InterventionPlan
from app.models.user import User
from app.services import ai_service
from conftest import get_auth_headers


class FakeGemini:
    """Stands in for Google's generateContent endpoint."""

    def __init__(self, replies):
        self.replies = list(replies)
        self.requests = []

    def __call__(self, request, timeout=None):
        body = json.loads(request.data.decode('utf-8'))
        self.requests.append({'url': request.full_url, 'headers': dict(request.header_items()), 'body': body})
        reply = self.replies.pop(0)
        if isinstance(reply, Exception):
            raise reply
        text = reply if isinstance(reply, str) else json.dumps(reply)
        payload = {'candidates': [{'content': {'parts': [{'text': text}]}}]}
        return io.BytesIO(json.dumps(payload).encode('utf-8'))

    @property
    def sent_text(self):
        return json.dumps([r['body'] for r in self.requests])


def http_error(code):
    return urllib.error.HTTPError('https://example', code, 'error', {}, io.BytesIO(b'{}'))


@pytest.fixture(autouse=True)
def clear_cache():
    ai_service._CACHE.clear()
    yield
    ai_service._CACHE.clear()


@pytest.fixture
def gemini(app, monkeypatch):
    """Switch AI on and return a function that installs fake replies."""
    app.config['GEMINI_API_KEY'] = 'test-key'
    app.config['GEMINI_MODEL'] = 'gemini-test-model'
    app.config['GEMINI_FALLBACK_MODEL'] = 'gemini-flash-latest'

    def install(*replies):
        fake = FakeGemini(replies)
        monkeypatch.setattr(ai_service.urllib.request, 'urlopen', fake)
        return fake
    return install


GOOD_PLAN = {'intervention_type': 'extra_practice', 'goal': 'Raise practice accuracy from 30% to 50%.',
             'strategies': ['Daily practice round with hints', 'Celebrate stars', 'Review mistakes together'],
             'review_in_days': 14, 'why': 'Practice accuracy is low.'}


def headers(token):
    return get_auth_headers(token)


# ------------------------------------------------------------------ status + access
class TestAccess:

    def test_status_off_without_key(self, client, teacher_token):
        data = client.get('/api/ai/status', headers=headers(teacher_token)).get_json()['data']
        assert data['enabled'] is False and data['model'] is None and 'anonymous' in data['privacy_note']

    def test_status_on_with_key(self, client, teacher_token, gemini):
        data = client.get('/api/ai/status', headers=headers(teacher_token)).get_json()['data']
        assert data['enabled'] is True and data['model'] == 'gemini-test-model'

    def test_students_cannot_use_teacher_ai(self, client, student_token, test_student):
        for url, body in (('/api/ai/support-plan/suggest', {'student_id': test_student['id']}),
                          ('/api/ai/class-summary', {}),
                          ('/api/ai/encouragement/draft', {'student_id': test_student['id']}),
                          ('/api/ai/messages', {'student_id': test_student['id'], 'body': 'hi'})):
            assert client.post(url, headers=headers(student_token), json=body).status_code == 403

    def test_needs_login(self, client):
        assert client.get('/api/ai/status').status_code == 401


# ------------------------------------------------------------------ plan suggestion
class TestPlanSuggestion:

    def test_rules_without_key(self, client, app, teacher_token, test_student):
        body = client.post('/api/ai/support-plan/suggest', headers=headers(teacher_token),
                           json={'student_id': test_student['id']}).get_json()['data']
        assert body['source'] == 'rules' and 'no Gemini API key' in body['note']
        suggestion = body['suggestion']
        assert suggestion['intervention_type'] in ai_service.INTERVENTION_TYPES
        assert suggestion['goal'] and len(suggestion['strategies']) >= 2 and suggestion['review_in_days'] == 14
        with app.app_context():
            logged = AISuggestion.query.one()
            assert logged.kind == 'plan_suggestion' and logged.source == 'rules' and logged.used is False

    def test_gemini_request_is_anonymous_and_well_formed(self, client, app, teacher_token, test_student, gemini):
        fake = gemini(GOOD_PLAN)
        body = client.post('/api/ai/support-plan/suggest', headers=headers(teacher_token),
                           json={'student_id': test_student['id']}).get_json()['data']
        assert body['source'] == 'gemini' and body['model'] == 'gemini-test-model' and body['note'] is None
        assert body['suggestion']['goal'].startswith('Raise practice accuracy')
        sent = fake.requests[0]
        assert sent['url'].endswith('/models/gemini-test-model:generateContent')
        assert sent['headers'].get('X-goog-api-key') == 'test-key'
        assert sent['body']['generationConfig']['responseMimeType'] == 'application/json'
        assert sent['body']['generationConfig']['responseJsonSchema']['required']
        # nothing that identifies the child leaves the app
        for private in (test_student['username'], test_student['email'], f'"user_id": {test_student["id"]}'):
            assert private not in fake.sent_text
        with app.app_context():
            logged = AISuggestion.query.one()
            assert test_student['username'] not in json.dumps(logged.input_data)

    def test_bad_ai_answer_falls_back(self, client, teacher_token, test_student, gemini):
        gemini({**GOOD_PLAN, 'intervention_type': 'medication'})
        body = client.post('/api/ai/support-plan/suggest', headers=headers(teacher_token),
                           json={'student_id': test_student['id']}).get_json()['data']
        assert body['source'] == 'rules' and 'did not pass our checks' in body['note']

    def test_not_json_falls_back(self, client, teacher_token, test_student, gemini):
        gemini('Sure! Here is a plan: do more practice.')
        body = client.post('/api/ai/support-plan/suggest', headers=headers(teacher_token),
                           json={'student_id': test_student['id']}).get_json()['data']
        assert body['source'] == 'rules' and 'valid JSON' in body['note']

    def test_retired_model_uses_fallback_model(self, client, teacher_token, test_student, gemini):
        fake = gemini(http_error(404), GOOD_PLAN)
        body = client.post('/api/ai/support-plan/suggest', headers=headers(teacher_token),
                           json={'student_id': test_student['id']}).get_json()['data']
        assert body['source'] == 'gemini' and body['model'] == 'gemini-flash-latest'
        assert fake.requests[1]['url'].endswith('/models/gemini-flash-latest:generateContent')

    @pytest.mark.parametrize('error, words', [(http_error(429), 'busy'), (http_error(403), 'not accepted'),
                                              (urllib.error.URLError('down'), 'Could not reach')])
    def test_gemini_problems_fall_back(self, client, teacher_token, test_student, gemini, error, words):
        gemini(error)
        body = client.post('/api/ai/support-plan/suggest', headers=headers(teacher_token),
                           json={'student_id': test_student['id']}).get_json()['data']
        assert body['source'] == 'rules' and words in body['note']

    def test_same_numbers_use_the_cache(self, client, teacher_token, test_student, gemini):
        fake = gemini(GOOD_PLAN)
        for _ in range(2):
            assert client.post('/api/ai/support-plan/suggest', headers=headers(teacher_token),
                               json={'student_id': test_student['id']}).get_json()['data']['source'] == 'gemini'
        assert len(fake.requests) == 1

    def test_review_days_are_kept_sensible(self):
        cleaned = ai_service.clean_plan({**GOOD_PLAN, 'review_in_days': 300}, {})
        assert cleaned['review_in_days'] == 28

    def test_unknown_student(self, client, teacher_token, test_teacher):
        assert client.post('/api/ai/support-plan/suggest', headers=headers(teacher_token),
                           json={'student_id': test_teacher['id']}).status_code == 404

    def test_plan_built_from_suggestion_is_marked(self, client, app, teacher_token, test_student):
        suggestion_id = client.post('/api/ai/support-plan/suggest', headers=headers(teacher_token),
                                    json={'student_id': test_student['id']}).get_json()['data']['suggestion_id']
        review = (datetime.utcnow() + timedelta(days=14)).date().isoformat()
        plan = client.post('/api/support-plans', headers=headers(teacher_token), json={
            'student_id': test_student['id'], 'intervention_type': 'extra_practice', 'goal': 'Edited goal',
            'review_date': review, 'ai_suggestion_id': suggestion_id}).get_json()['data']
        assert plan['ai_assisted'] is True
        with app.app_context():
            logged = AISuggestion.query.get(suggestion_id)
            assert logged.used is True and logged.plan_id == plan['id']
        plain = client.post('/api/support-plans', headers=headers(teacher_token), json={
            'student_id': test_student['id'], 'intervention_type': 'peer_support', 'goal': 'No AI',
            'review_date': review}).get_json()['data']
        assert plain['ai_assisted'] is False


# ------------------------------------------------------------------ review summary
class TestReviewSummary:

    @pytest.fixture
    def plan_id(self, app, test_student, test_teacher):
        with app.app_context():
            plan = InterventionPlan(student_id=test_student['id'], teacher_id=test_teacher['id'],
                                    intervention_type='extra_practice', goal='More practice',
                                    review_date=datetime.utcnow() + timedelta(days=7),
                                    created_at=datetime.utcnow() - timedelta(days=14),
                                    baseline_snapshot={'total_xp': 10, 'lessons_completed': 0, 'current_streak': 0,
                                                       'engaged': False, 'risk_level': 'critical',
                                                       'engagement_features': {'practice_accuracy': 30.0}})
            db.session.add(plan)
            db.session.commit()
            return plan.id

    def test_rules_summary(self, client, teacher_token, plan_id):
        body = client.post(f'/api/ai/support-plans/{plan_id}/review-summary', headers=headers(teacher_token)).get_json()['data']
        result = body['suggestion']
        assert body['source'] == 'rules' and result['suggested_outcome'] in ai_service.OUTCOMES
        assert result['summary'] and result['next_step']

    def test_gemini_summary_and_payload(self, client, teacher_token, plan_id, test_student, gemini):
        fake = gemini({'summary': 'Practice went up.', 'improved': ['Practice accuracy'], 'watch': [],
                       'suggested_outcome': 'improved', 'next_step': 'Set a harder goal.'})
        body = client.post(f'/api/ai/support-plans/{plan_id}/review-summary', headers=headers(teacher_token)).get_json()['data']
        assert body['source'] == 'gemini' and body['suggestion']['suggested_outcome'] == 'improved'
        sent = fake.requests[0]['body']['contents'][0]['parts'][0]['text']
        assert '"days_since_plan_started": 14' in sent and '"support_type": "Extra practice"' in sent
        assert test_student['username'] not in fake.sent_text and 'More practice' not in fake.sent_text

    def test_only_author_or_admin(self, client, app, plan_id):
        with app.app_context():
            other = User(username='other_teacher', email='other@test.com', role='teacher')
            other.set_password('teacher123')
            db.session.add(other)
            db.session.commit()
        token = client.post('/api/auth/login', json={'username': 'other_teacher', 'password': 'teacher123'}).get_json()['access_token']
        assert client.post(f'/api/ai/support-plans/{plan_id}/review-summary', headers=headers(token)).status_code == 403
        assert client.post('/api/ai/support-plans/9999/review-summary', headers=headers(token)).status_code == 404

    def test_rules_outcome_logic(self):
        payload = {'support_type': 'Extra practice', 'days_since_plan_started': 14,
                   'before': {'engagement': 'at risk', 'practice_right_first_time_percent': 30, 'lessons_completed': 1},
                   'now': {'engagement': 'engaged', 'practice_right_first_time_percent': 55, 'lessons_completed': 4}}
        assert ai_service.rules_review(payload)['suggested_outcome'] == 'improved'
        worse = {**payload, 'before': payload['now'], 'now': payload['before']}
        assert ai_service.rules_review(worse)['suggested_outcome'] == 'needs_support'


# ------------------------------------------------------------------ class summary
class TestClassSummary:

    @pytest.fixture
    def class_of_three(self, app, test_student):
        with app.app_context():
            for name in ('amaya', 'binu'):
                user = User(username=name, email=f'{name}@test.com', role='student', last_login=datetime.utcnow())
                user.set_password('password123')
                db.session.add(user)
            db.session.commit()

    def test_rules_summary_names_students(self, client, teacher_token, class_of_three):
        body = client.post('/api/ai/class-summary', headers=headers(teacher_token)).get_json()['data']
        assert body['source'] == 'rules' and body['suggestion']['students_included'] == 3
        assert 'students' in body['suggestion']['overview']

    def test_gemini_refs_are_mapped_back_and_names_never_sent(self, client, teacher_token, class_of_three, gemini):
        fake = gemini({'overview': 'Three new students.', 'patterns': ['All are new'],
                       'priorities': [{'ref': 'S2', 'reason': 'No practice yet', 'action': 'Start a round'},
                                      {'ref': 'S99', 'reason': 'made up', 'action': 'ignore'}],
                       'celebrate': [{'ref': 'S1', 'reason': 'Logged in today'}]})
        body = client.post('/api/ai/class-summary', headers=headers(teacher_token)).get_json()['data']
        result = body['suggestion']
        assert body['source'] == 'gemini'
        assert len(result['priorities']) == 1 and result['priorities'][0]['username'] in ('amaya', 'binu', 'test_student')
        assert result['celebrate'][0]['student_id'] is not None
        for name in ('amaya', 'binu', 'test_student'):
            assert name not in fake.sent_text

    def test_no_students(self, client, teacher_token):
        assert client.post('/api/ai/class-summary', headers=headers(teacher_token)).status_code == 400


# ------------------------------------------------------------------ encouragement + messages
class TestEncouragementAndMessages:

    def test_name_is_added_after_the_ai(self, client, teacher_token, test_student, gemini):
        fake = gemini({'message': '{name}, you are doing great with your practice! ⭐'})
        body = client.post('/api/ai/encouragement/draft', headers=headers(teacher_token),
                           json={'student_id': test_student['id']}).get_json()['data']
        assert body['suggestion']['message'].startswith('Test,')
        assert test_student['username'] not in fake.sent_text

    def test_links_are_refused(self, client, teacher_token, test_student, gemini):
        gemini({'message': '{name}, visit www.example.com for games!'})
        body = client.post('/api/ai/encouragement/draft', headers=headers(teacher_token),
                           json={'student_id': test_student['id']}).get_json()['data']
        assert body['source'] == 'rules' and 'www.' not in body['suggestion']['message']

    def test_send_and_read_a_message(self, client, app, teacher_token, student_token, test_student):
        draft = client.post('/api/ai/encouragement/draft', headers=headers(teacher_token),
                            json={'student_id': test_student['id']}).get_json()['data']
        sent = client.post('/api/ai/messages', headers=headers(teacher_token), json={
            'student_id': test_student['id'], 'body': draft['suggestion']['message'] + ' (edited)',
            'ai_suggestion_id': draft['suggestion_id']})
        assert sent.status_code == 201 and sent.get_json()['data']['ai_assisted'] is True
        mine = client.get('/api/ai/messages/mine', headers=headers(student_token)).get_json()['data']
        assert mine['unread'] == 1 and mine['messages'][0]['body'].endswith('(edited)')
        assert mine['messages'][0]['teacher_name'] == 'test_teacher'
        message_id = mine['messages'][0]['id']
        assert client.post(f'/api/ai/messages/{message_id}/read', headers=headers(student_token)).status_code == 200
        assert client.get('/api/ai/messages/mine', headers=headers(student_token)).get_json()['data']['unread'] == 0
        with app.app_context():
            assert AISuggestion.query.get(draft['suggestion_id']).used is True

    def test_message_rules(self, client, app, teacher_token, test_student, test_teacher):
        assert client.post('/api/ai/messages', headers=headers(teacher_token),
                           json={'student_id': test_student['id'], 'body': '  '}).status_code == 400
        assert client.post('/api/ai/messages', headers=headers(teacher_token),
                           json={'student_id': test_teacher['id'], 'body': 'hi'}).status_code == 404
        long = client.post('/api/ai/messages', headers=headers(teacher_token),
                           json={'student_id': test_student['id'], 'body': 'x' * 900}).get_json()['data']
        assert len(long['body']) == 500 and long['ai_assisted'] is False

    def test_students_only_read_their_own(self, client, app, teacher_token, test_student):
        with app.app_context():
            other = User(username='other_kid', email='kid@test.com', role='student')
            other.set_password('password123')
            db.session.add(other)
            db.session.commit()
        msg = client.post('/api/ai/messages', headers=headers(teacher_token),
                          json={'student_id': test_student['id'], 'body': 'Well done!'}).get_json()['data']
        token = client.post('/api/auth/login', json={'username': 'other_kid', 'password': 'password123'}).get_json()['access_token']
        assert client.post(f"/api/ai/messages/{msg['id']}/read", headers=headers(token)).status_code == 404
        assert client.get('/api/ai/messages/mine', headers=headers(token)).get_json()['data']['messages'] == []


def test_personalise_uses_a_friendly_first_name():
    assert ai_service.personalise('{name}, hi', User(username='sanu_k')) == 'Sanu, hi'
