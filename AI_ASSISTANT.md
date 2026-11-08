# AI Assistant for Teachers (Google Gemini)

LearnQuest can use Google's Gemini model to help teachers. The AI only
**suggests**. The teacher reads, edits and decides, and nothing the AI
writes is saved or shown to a child until a teacher chooses to use it.

## What it does

| Where | Button | What the AI writes | What the teacher decides |
|---|---|---|---|
| Support Plans → new plan | ✨ Suggest a plan with AI | Support type, a measurable goal, 3-4 strategies, review date, and why | Uses, edits or dismisses it, then saves the plan |
| Support Plans → review | ✨ Summarise progress with AI | Plain-English summary of before vs after, what went up, what to watch, a suggested outcome and a next step | Chooses the outcome; can add the summary to the review notes |
| ML Class Report | ✨ Summarise my class | Who to help first (and how), patterns across the class, who to celebrate | Which children to act on |
| ML Class Report → a student | ✨ Write encouragement | A short, child-friendly message | Edits it and presses **Send**; the child sees it on their dashboard as "💌 Message from your teacher" |

Plans built from an AI suggestion show a **✨ AI-assisted** badge.

## Setup (2 minutes)

1. Go to <https://aistudio.google.com/apikey>, sign in with a Google account and press **Create API key**.
2. In `backend/.env` add:
   ```
   GEMINI_API_KEY=paste-your-key-here
   GEMINI_MODEL=gemini-3.5-flash-lite
   ```
3. Restart the backend. The AI buttons now say "Written by Google Gemini".

Without a key, every button still works. It gives a **basic built-in
suggestion** (simple rules) and says so on screen. The same happens if
Gemini is busy or the free daily limit is reached, so a demo never breaks.

`GEMINI_MODEL` can be any Gemini text model. If Google retires the chosen
name, the app automatically tries `gemini-flash-latest`
(`GEMINI_FALLBACK_MODEL`).

## Privacy - what is sent to Google

On the **free tier**, Google may use what is sent to improve its products,
and people may read it. Google's terms also say not to send personal
information. So LearnQuest sends **only anonymous numbers**:

- Sent: minutes today, quiz average, login streak, lessons this week, days
  inactive, practice accuracy (overall and per area), practice rounds and
  games this week, hints and wrong tries per question, the check-in mood
  word (e.g. "Not sure"), risk level, and for reviews the before/after numbers.
- Never sent: names, usernames, emails, IDs, teacher notes or goals.
  In the class summary, students are sent as S1, S2, ...
  and matched back to names only inside LearnQuest. The child's name is
  added to an encouragement message after the AI has written it.

Children never talk to the AI directly: only teachers use these buttons.
This is checked by automated tests (`backend/tests/test_ai_assistant.py`),
which fail if a name, email or ID appears in a request.

## Research log

Every suggestion is saved in the `ai_suggestions` table: the kind, whether
it came from Gemini or the built-in rules, the model, exactly what was sent,
what came back, how long it took, and whether the teacher **used** it (and
for plans, which plan). This lets the research report, for example:

```sql
-- How often did teachers use the AI's plan suggestions?
SELECT source, COUNT(*) AS shown, SUM(used) AS used
FROM ai_suggestions WHERE kind = 'plan_suggestion' GROUP BY source;

-- Did AI-assisted plans have better outcomes than plans written alone?
SELECT (s.id IS NOT NULL) AS ai_assisted, p.outcome, COUNT(*)
FROM intervention_plans p
LEFT JOIN ai_suggestions s ON s.plan_id = p.id AND s.kind = 'plan_suggestion' AND s.used = 1
WHERE p.status = 'reviewed' GROUP BY 1, 2;
```

## Safety checks on the AI's answers

- Gemini must answer in a fixed JSON format (`responseJsonSchema`).
- The app checks every answer before showing it: the support type must be one
  of the app's types, the outcome one of improved / unchanged / needs support,
  texts are shortened, unknown student references are dropped, and messages
  with links or email addresses are refused. Anything that fails a check is
  replaced by the built-in suggestion.
- The prompt tells the AI to use only the numbers given, never to invent data,
  and never to use medical or psychological labels.
- Identical requests are cached for 10 minutes to stay inside the free limits.

## Files

- `backend/app/services/ai_service.py` - Gemini client, prompts, checks, built-in rules
- `backend/app/routes/ai_assistant.py` - API (`/api/ai/...`)
- `backend/app/models/ai.py` - `ai_suggestions` and `teacher_messages` tables (created automatically)
- `frontend/src/components/ai/AIAssist.js` - the AI panels and the student message card
