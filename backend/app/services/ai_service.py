"""
AI assistant for teachers (Google Gemini), with built-in fallbacks.

Every feature works in two ways:
  - with GEMINI_API_KEY set, Gemini writes the suggestion (JSON output that
    is checked before anyone sees it);
  - without a key, or when Gemini is busy or unreachable, simple built-in
    rules give a basic suggestion, clearly labelled as such.

Privacy: Gemini's free tier may use what is sent to improve Google's
products, and people may read it. So only anonymous numbers are ever sent:
no names, usernames, emails, IDs or teacher notes. A child's name is put
into a message here, after the AI has written it.

The teacher always decides. Nothing the AI writes is saved to a plan,
an outcome or a child's screen until a teacher chooses to use it.
"""
import hashlib
import json
import re
import socket
import time
import urllib.error
import urllib.request

from flask import current_app

PRIVACY_NOTE = ('Only anonymous numbers are sent to Google Gemini - no names, IDs or notes. '
                'The teacher always checks and edits the suggestion.')

SYSTEM_PROMPT = (
    'You help primary-school teachers support slow learners who use LearnQuest, a learning app with short '
    'lessons, quizzes, 5-question practice rounds, learning games and a daily mood check-in. '
    'Write in simple, warm, practical English for a busy teacher. Base every statement only on the numbers '
    'given and never invent data. Do not diagnose or use medical or psychological labels. Suggest small, '
    'concrete classroom actions. Reply only with JSON that matches the schema.'
)

INTERVENTION_TYPES = ('visual_support', 'shorter_sessions', 'interactive_game', 'one_to_one_support',
                      'peer_support', 'extra_practice', 'other')
OUTCOMES = ('improved', 'unchanged', 'needs_support')
AREA_NAMES = {'math': 'Number Fun (maths)', 'words': 'Word Play (letters and words)', 'world': 'My World (science)'}

_CACHE = {}
CACHE_SECONDS = 600


class AIUnavailable(Exception):
    """Gemini could not give an answer; the caller falls back to the rules."""


# --------------------------------------------------------------------------- client
class GeminiClient:
    def __init__(self, api_key, model, fallback_model, base_url, timeout=20):
        self.api_key = api_key
        self.model = model
        self.fallback_model = fallback_model
        self.base_url = base_url.rstrip('/')
        self.timeout = timeout

    @classmethod
    def from_app(cls):
        cfg = current_app.config
        return cls(cfg.get('GEMINI_API_KEY'), cfg.get('GEMINI_MODEL', 'gemini-3.5-flash-lite'),
                   cfg.get('GEMINI_FALLBACK_MODEL', 'gemini-flash-latest'),
                   cfg.get('GEMINI_API_BASE', 'https://generativelanguage.googleapis.com/v1beta'),
                   cfg.get('GEMINI_TIMEOUT', 20))

    @property
    def enabled(self):
        return bool(self.api_key)

    def _post(self, model, body):
        request = urllib.request.Request(
            f'{self.base_url}/models/{model}:generateContent',
            data=json.dumps(body).encode('utf-8'),
            headers={'Content-Type': 'application/json', 'x-goog-api-key': self.api_key},
            method='POST')
        with urllib.request.urlopen(request, timeout=self.timeout) as response:
            return json.loads(response.read().decode('utf-8'))

    def generate_json(self, prompt, schema, temperature=0.4):
        """Ask Gemini for JSON matching `schema`. Returns (data, model_name)."""
        if not self.enabled:
            raise AIUnavailable('No Gemini API key is set')
        body = {
            'systemInstruction': {'parts': [{'text': SYSTEM_PROMPT}]},
            'contents': [{'role': 'user', 'parts': [{'text': prompt}]}],
            'generationConfig': {'responseMimeType': 'application/json', 'responseJsonSchema': schema,
                                 'temperature': temperature, 'maxOutputTokens': 1200},
        }
        models = [self.model] + ([self.fallback_model] if self.fallback_model and self.fallback_model != self.model else [])
        for model in models:
            try:
                data = self._post(model, body)
            except urllib.error.HTTPError as exc:
                if exc.code == 404 and model != models[-1]:
                    continue  # this model name was retired - try the fallback
                if exc.code == 429:
                    raise AIUnavailable('Gemini is busy (free limit reached) - try again in a minute') from exc
                if exc.code in (401, 403):
                    raise AIUnavailable('The Gemini API key was not accepted') from exc
                raise AIUnavailable(f'Gemini returned an error ({exc.code})') from exc
            except (urllib.error.URLError, socket.timeout, TimeoutError, ConnectionError) as exc:
                raise AIUnavailable('Could not reach Gemini') from exc
            except ValueError as exc:
                raise AIUnavailable('Gemini sent an unreadable reply') from exc
            return parse_reply(data), model
        raise AIUnavailable('No Gemini model was available')


def parse_reply(data):
    candidates = (data or {}).get('candidates') or []
    if not candidates:
        raise AIUnavailable('Gemini did not answer (the request may have been blocked)')
    parts = ((candidates[0].get('content') or {}).get('parts')) or []
    text = ''.join(p.get('text', '') for p in parts if isinstance(p, dict)).strip()
    text = re.sub(r'^```(?:json)?\s*|\s*```$', '', text)
    try:
        return json.loads(text)
    except ValueError as exc:
        raise AIUnavailable('Gemini did not return valid JSON') from exc


def run(kind, payload, prompt, schema, clean, fallback, cache_key=None):
    """
    Try Gemini, check its answer with `clean`, else use `fallback`.

    Returns a dict: {source, model, result, note}.
    """
    client = GeminiClient.from_app()
    key = None
    if client.enabled and cache_key is not None:
        key = hashlib.sha256(json.dumps([kind, client.model, cache_key], sort_keys=True, default=str).encode()).hexdigest()
        hit = _CACHE.get(key)
        if hit and hit[0] > time.time():
            return dict(hit[1])
    note = None
    if client.enabled:
        started = time.time()
        try:
            data, model = client.generate_json(prompt, schema)
            result = clean(data, payload)
            answer = {'source': 'gemini', 'model': model, 'result': result, 'note': None,
                      'latency_ms': int((time.time() - started) * 1000)}
            if key:
                _CACHE[key] = (time.time() + CACHE_SECONDS, answer)
            return answer
        except AIUnavailable as exc:
            note = f'{exc}. Showing a basic suggestion instead.'
        except (ValueError, KeyError, TypeError, AttributeError):
            note = 'Gemini gave an answer that did not pass our checks. Showing a basic suggestion instead.'
    else:
        note = 'AI is not switched on (no Gemini API key), so this is a basic built-in suggestion.'
    return {'source': 'rules', 'model': None, 'result': fallback(payload), 'note': note, 'latency_ms': 0}


# --------------------------------------------------------------- shared helpers
def _text(value, limit):
    if not isinstance(value, str):
        raise ValueError('expected text')
    value = re.sub(r'\s+', ' ', value).strip()
    if not value:
        raise ValueError('empty text')
    return value[:limit]


def _texts(values, limit, most):
    if not isinstance(values, list):
        raise ValueError('expected a list')
    out = [_text(v, limit) for v in values if isinstance(v, str) and v.strip()]
    return out[:most]


def anonymous_profile(prediction):
    """The numbers about one child that may be sent to the AI. No names, no IDs."""
    features = dict(prediction.get('features') or {})
    activity = prediction.get('activity') or {}
    check_in = activity.get('latest_check_in') or {}
    return {
        'engagement': ('new student - not enough data' if prediction.get('insufficient_data')
                       else 'engaged' if prediction.get('engaged') else 'at risk'),
        'chance_engaged_percent': round((prediction.get('engaged_probability') or 0) * 100),
        'risk_level': prediction.get('risk_level'),
        'minutes_today': round(features.get('time_spent_today') or 0, 1),
        'quiz_average_percent': features.get('avg_quiz_score'),
        'login_streak_days': features.get('login_streak'),
        'lessons_this_week': features.get('lessons_completed_week'),
        'days_since_last_login': features.get('days_inactive'),
        'practice_right_first_time_percent': features.get('practice_accuracy'),
        'practice_rounds_and_games_this_week': features.get('activities_week'),
        'practice_accuracy_by_area_percent': {AREA_NAMES[k]: v for k, v in (activity.get('accuracy_by_area') or {}).items()
                                              if v is not None and k in AREA_NAMES},
        'lesson_activity_accuracy_percent': activity.get('lesson_activity_accuracy'),
        'hints_per_question': activity.get('hints_per_question'),
        'wrong_tries_per_question': activity.get('retries_per_question'),
        'latest_check_in_mood': check_in.get('label'),
    }


def _weakest_area(profile):
    areas = profile.get('practice_accuracy_by_area_percent') or {}
    if not areas:
        return None
    name, value = min(areas.items(), key=lambda kv: kv[1])
    return name if value < 60 else None


# =================================================================== 1. plan suggestion
PLAN_SCHEMA = {
    'type': 'object',
    'properties': {
        'intervention_type': {'type': 'string', 'enum': list(INTERVENTION_TYPES)},
        'custom_intervention': {'type': 'string', 'description': 'Short name, only when intervention_type is other'},
        'goal': {'type': 'string', 'description': 'One measurable goal using the app numbers, max 2 sentences'},
        'strategies': {'type': 'array', 'items': {'type': 'string'}, 'description': '3 or 4 concrete classroom actions'},
        'review_in_days': {'type': 'integer', 'description': 'Days until the review, 7 to 28'},
        'why': {'type': 'string', 'description': 'One or two sentences linking the plan to the numbers'},
    },
    'required': ['intervention_type', 'goal', 'strategies', 'review_in_days', 'why'],
}

STRATEGY_LABELS = {
    'visual_support': 'Visual support', 'shorter_sessions': 'Shorter sessions', 'interactive_game': 'Interactive games',
    'one_to_one_support': 'One-to-one support', 'peer_support': 'Peer support', 'extra_practice': 'Extra practice',
    'other': 'Other',
}


def plan_prompt(profile):
    return ('Suggest one support plan for this student. Choose intervention_type from: '
            + ', '.join(INTERVENTION_TYPES) + '. Make the goal measurable with the numbers the app already tracks '
            '(practice accuracy, practice rounds per week, lessons per week, login streak, minutes per day), '
            'and realistic for a slow learner over 2-4 weeks.\n\nStudent numbers (anonymous):\n'
            + json.dumps(profile, indent=1))


def clean_plan(data, profile):
    kind = data.get('intervention_type')
    if kind not in INTERVENTION_TYPES:
        raise ValueError('unknown intervention type')
    custom = data.get('custom_intervention')
    custom = _text(custom, 120) if kind == 'other' else None
    days = int(data.get('review_in_days') or 14)
    return {
        'intervention_type': kind,
        'custom_intervention': custom,
        'goal': _text(data.get('goal'), 500),
        'strategies': _texts(data.get('strategies'), 220, 5) or ['Check in with the student each day'],
        'review_in_days': max(7, min(28, days)),
        'why': _text(data.get('why'), 400),
    }


def rules_plan(profile):
    accuracy = profile.get('practice_right_first_time_percent')
    activities = profile.get('practice_rounds_and_games_this_week') or 0
    inactive = profile.get('days_since_last_login') or 0
    minutes = profile.get('minutes_today') or 0
    mood = profile.get('latest_check_in_mood')
    weak = _weakest_area(profile)
    if inactive >= 3:
        kind = 'interactive_game'
        goal = 'Log in on at least 4 days a week and play the learning games or a practice round each time.'
        why = f'The student has not logged in for {inactive} days, so the first step is to make coming back fun.'
        strategies = ['Start each session with a favourite learning game', 'Set a small daily challenge together',
                      'Praise every day the student logs in', 'Send a short encouragement message']
    elif accuracy is not None and accuracy < 50:
        kind = 'extra_practice'
        target = min(80, int(accuracy) + 20)
        goal = (f'Raise practice accuracy from {round(accuracy)}% to {target}% right first time, '
                'with at least 3 practice rounds a week.')
        why = f'Practice answers are often wrong first time ({round(accuracy)}%)' + (f', mostly in {weak}.' if weak else '.')
        strategies = [f'Do one short {weak or "practice"} round together each day',
                      'Use the hint and "Read to me" buttons before answering',
                      'Talk through each wrong answer on the results screen', 'Celebrate every star earned']
    elif mood in ('Hard day', 'Not sure'):
        kind = 'one_to_one_support'
        goal = 'Check in one-to-one twice a week and complete one lesson or practice round each school day.'
        why = f'The latest check-in was "{mood}", so a calm one-to-one start may help.'
        strategies = ['Ask how the student feels before starting', 'Begin with an easy practice round',
                      'Keep sessions short and positive', 'Note what helped in the plan notes']
    elif minutes < 10:
        kind = 'shorter_sessions'
        goal = 'Do two short 5-minute sessions a day (a lesson or a practice round) on at least 4 days a week.'
        why = f'The student spent only {minutes} minutes today; shorter, more frequent sessions are easier to keep up.'
        strategies = ['Split learning into two 5-minute blocks', 'Use a visual timer', 'Finish each block with a game',
                      'Tick off Today\'s Challenges together']
    else:
        kind = 'extra_practice'
        goal = f'Keep up at least {max(3, activities)} practice rounds a week and finish 2 lessons a week.'
        why = 'The numbers are steady, so the plan keeps a regular practice habit going.'
        strategies = ['Agree a daily practice time', 'Try a new practice area each week', 'Review stars weekly together']
    return {'intervention_type': kind, 'custom_intervention': None, 'goal': goal, 'strategies': strategies,
            'review_in_days': 14, 'why': why}


# =================================================================== 2. review summary
REVIEW_SCHEMA = {
    'type': 'object',
    'properties': {
        'summary': {'type': 'string', 'description': '2-3 plain sentences on what changed'},
        'improved': {'type': 'array', 'items': {'type': 'string'}},
        'watch': {'type': 'array', 'items': {'type': 'string'}},
        'suggested_outcome': {'type': 'string', 'enum': list(OUTCOMES)},
        'next_step': {'type': 'string', 'description': 'One concrete next step'},
    },
    'required': ['summary', 'improved', 'watch', 'suggested_outcome', 'next_step'],
}


def review_payload(plan, before, now, days_since_start):
    def numbers(snapshot):
        features = snapshot.get('engagement_features') or {}
        return {
            'engagement': 'engaged' if snapshot.get('engaged') else 'at risk' if snapshot.get('engaged') is False else 'unknown',
            'risk_level': snapshot.get('risk_level'),
            'total_xp': snapshot.get('total_xp'),
            'lessons_completed': snapshot.get('lessons_completed'),
            'quizzes_taken': snapshot.get('quizzes_taken'),
            'total_minutes_learning': snapshot.get('total_time_spent'),
            'login_streak_days': snapshot.get('current_streak'),
            'practice_right_first_time_percent': features.get('practice_accuracy'),
            'practice_rounds_and_games_this_week': features.get('activities_week'),
            'quiz_average_percent': features.get('avg_quiz_score'),
        }
    return {
        'support_type': STRATEGY_LABELS.get(plan.intervention_type, plan.intervention_type),
        'days_since_plan_started': max(0, int(days_since_start)),
        'before': numbers(before or {}),
        'now': numbers(now or {}),
    }


def review_prompt(payload):
    return ('A teacher is reviewing a support plan. Compare the numbers before the plan and now. Say what improved, '
            'what to keep watching, suggest an outcome (improved, unchanged or needs_support) and one next step. '
            'The teacher makes the final decision.\n\n' + json.dumps(payload, indent=1))


def clean_review(data, payload):
    outcome = data.get('suggested_outcome')
    if outcome not in OUTCOMES:
        raise ValueError('unknown outcome')
    return {'summary': _text(data.get('summary'), 700), 'improved': _texts(data.get('improved'), 200, 4),
            'watch': _texts(data.get('watch'), 200, 4), 'suggested_outcome': outcome,
            'next_step': _text(data.get('next_step'), 300)}


def rules_review(payload):
    before, now = payload['before'], payload['now']
    improved, watch, score = [], [], 0

    def change(key, label, unit='', better_if_up=True, threshold=1):
        nonlocal score
        a, b = before.get(key), now.get(key)
        if a is None or b is None:
            return
        diff = round(b - a, 1)
        if abs(diff) < threshold:
            return
        text = f'{label}: {a}{unit} -> {b}{unit}'
        if (diff > 0) == better_if_up:
            improved.append(text)
            score += 1
        else:
            watch.append(text)
            score -= 1

    change('practice_right_first_time_percent', 'Practice accuracy', '%', threshold=5)
    change('lessons_completed', 'Lessons completed')
    change('quiz_average_percent', 'Quiz average', '%', threshold=5)
    change('login_streak_days', 'Login streak', ' days')
    change('total_minutes_learning', 'Total minutes learning', threshold=5)
    if before.get('engagement') == 'at risk' and now.get('engagement') == 'engaged':
        improved.insert(0, 'The model now rates the student as engaged')
        score += 2
    elif before.get('engagement') == 'engaged' and now.get('engagement') == 'at risk':
        watch.insert(0, 'The model now rates the student as at risk')
        score -= 2
    outcome = 'improved' if score >= 2 else 'needs_support' if score <= -1 else 'unchanged'
    summary = (f'Since the {payload["support_type"].lower()} plan started, {len(improved)} measure(s) went up '
               f'and {len(watch)} went down.')
    next_step = {'improved': 'Keep the same routine and set a slightly harder goal.',
                 'unchanged': 'Keep the plan for two more weeks and try a different practice area.',
                 'needs_support': 'Try a different support type and add a short one-to-one check-in.'}[outcome]
    return {'summary': summary, 'improved': improved[:4], 'watch': watch[:4], 'suggested_outcome': outcome,
            'next_step': next_step}


# =================================================================== 3. class summary
CLASS_SCHEMA = {
    'type': 'object',
    'properties': {
        'overview': {'type': 'string', 'description': '2-3 sentences about the class as a whole'},
        'priorities': {'type': 'array', 'items': {
            'type': 'object',
            'properties': {'ref': {'type': 'string'}, 'reason': {'type': 'string'}, 'action': {'type': 'string'}},
            'required': ['ref', 'reason', 'action']}, 'description': 'Up to 3 students to help first'},
        'patterns': {'type': 'array', 'items': {'type': 'string'}, 'description': 'Up to 3 patterns across the class'},
        'celebrate': {'type': 'array', 'items': {
            'type': 'object', 'properties': {'ref': {'type': 'string'}, 'reason': {'type': 'string'}},
            'required': ['ref', 'reason']}, 'description': 'Up to 3 students doing well'},
    },
    'required': ['overview', 'priorities', 'patterns', 'celebrate'],
}


def class_prompt(students):
    return ('Here are the anonymous numbers for a class of slow learners. Each student has a reference like S1. '
            'Write a short overview, pick up to 3 students to help first (with the reason and one action), '
            'up to 3 patterns across the class, and up to 3 students to celebrate. Use only the references given.\n\n'
            + json.dumps(students, indent=1))


def clean_class(data, students):
    refs = {s['ref'] for s in students}
    priorities = [{'ref': p['ref'], 'reason': _text(p.get('reason'), 250), 'action': _text(p.get('action'), 250)}
                  for p in (data.get('priorities') or []) if isinstance(p, dict) and p.get('ref') in refs][:3]
    celebrate = [{'ref': c['ref'], 'reason': _text(c.get('reason'), 200)}
                 for c in (data.get('celebrate') or []) if isinstance(c, dict) and c.get('ref') in refs][:3]
    return {'overview': _text(data.get('overview'), 700), 'priorities': priorities,
            'patterns': _texts(data.get('patterns'), 250, 3), 'celebrate': celebrate}


RISK_ORDER = {'critical': 0, 'high': 1, 'moderate': 2, 'moderate-low': 3, 'low': 4, 'new': 5, None: 6}


def rules_class(students):
    known = [s for s in students if s['engagement'] != 'new student - not enough data']
    at_risk = sorted([s for s in known if s['engagement'] == 'at risk'],
                     key=lambda s: (RISK_ORDER.get(s.get('risk_level'), 5), s.get('chance_engaged_percent') or 0))
    priorities = []
    for s in at_risk[:3]:
        if (s.get('days_since_last_login') or 0) >= 3:
            reason, action = f"Not logged in for {s['days_since_last_login']} days", 'Invite them back with a learning game'
        elif s.get('practice_right_first_time_percent') is not None and s['practice_right_first_time_percent'] < 50:
            reason = f"Practice accuracy is {round(s['practice_right_first_time_percent'])}%"
            action = 'Do an easier practice round together using hints'
        else:
            reason, action = f"Only {s.get('minutes_today') or 0} minutes today", 'Agree a short daily session'
        priorities.append({'ref': s['ref'], 'reason': reason, 'action': action})
    accuracies = [s['practice_right_first_time_percent'] for s in known if s.get('practice_right_first_time_percent') is not None]
    patterns = []
    if accuracies:
        patterns.append(f'Average practice accuracy is {round(sum(accuracies) / len(accuracies))}% '
                        f'across {len(accuracies)} students who practised.')
    away = sum(1 for s in known if (s.get('days_since_last_login') or 0) >= 3)
    if away:
        patterns.append(f'{away} student(s) have not logged in for 3 or more days.')
    new = len(students) - len(known)
    if new:
        patterns.append(f'{new} new student(s) do not have enough data yet.')
    celebrate = [{'ref': s['ref'], 'reason': f"Engaged, with practice accuracy {round(s['practice_right_first_time_percent'])}%"}
                 for s in known if s['engagement'] == 'engaged' and (s.get('practice_right_first_time_percent') or 0) >= 70][:3]
    overview = (f'{len(at_risk)} of {len(students)} students are at risk, '
                f'{sum(1 for s in known if s["engagement"] == "engaged")} are engaged and {new} are new.')
    return {'overview': overview, 'priorities': priorities, 'patterns': patterns, 'celebrate': celebrate}


# =================================================================== 4. encouragement
ENCOURAGEMENT_SCHEMA = {
    'type': 'object',
    'properties': {
        'message': {'type': 'string', 'description': 'Under 50 words, for a young child, starting with {name}'},
    },
    'required': ['message'],
}


def encouragement_prompt(profile):
    return ('Write a short, warm encouragement message from a teacher to a young slow learner (age 6-10) who uses '
            'LearnQuest. Use very simple words, under 50 words, one or two emojis at most. Start with the placeholder '
            '{name}. Mention one real thing they did well or can try next, using the numbers below. No pressure, no '
            'comparison with other children, no links.\n\n' + json.dumps(profile, indent=1))


URL_OR_EMAIL = re.compile(r'(https?://|www\.|\S+@\S+\.\w+)', re.I)


def clean_encouragement(data, profile):
    message = _text(data.get('message'), 320)
    if URL_OR_EMAIL.search(message):
        raise ValueError('links or emails are not allowed')
    if '{name}' not in message:
        message = '{name}, ' + message[0].lower() + message[1:]
    return {'message': message}


def rules_encouragement(profile):
    accuracy = profile.get('practice_right_first_time_percent')
    streak = profile.get('login_streak_days') or 0
    if (profile.get('days_since_last_login') or 0) >= 3:
        text = '{name}, we miss you! 🌟 Come back and play a learning game with me today.'
    elif accuracy is not None and accuracy >= 70:
        text = f'{{name}}, you got {round(accuracy)}% right first time in practice. Amazing work! ⭐ Keep going!'
    elif streak >= 2:
        text = f'{{name}}, you have learned {streak} days in a row. I am so proud of you! 🌟'
    else:
        text = '{name}, every little step counts. Try one practice round today - you can use a hint! 💪'
    return {'message': text}


def personalise(message, student):
    first = (student.username or 'friend').split('_')[0].split('.')[0].strip().capitalize() or 'Friend'
    return message.replace('{name}', first)
