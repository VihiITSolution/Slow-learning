# Engagement Prediction ML Model - Documentation

## Overview

The Engagement Prediction Model is a machine learning system that predicts whether learners are engaged or disengaged based on their recent activity patterns. When disengagement is detected, the system automatically triggers interventions such as motivational notifications, bonus XP offers, and encouragement messages.

## Features

### Core Capabilities
- **Multiple ML Algorithms**: Supports Logistic Regression, SVM, and Neural Networks
- **Automatic Model Selection**: Compares algorithms and selects the best performer
- **Real-time Predictions**: Analyzes user behavior and predicts engagement levels
- **Risk Assessment**: Categorizes users by engagement risk level
- **Automated Interventions**: Triggers appropriate actions for disengaged users
- **Performance Metrics**: Tracks model accuracy, precision, recall, and F1 scores

### Input Features

The model analyzes seven metrics:

1. **Time Spent Today** (minutes): time today in lessons, practice rounds and the learning games
2. **Average Quiz Score** (0-100): lesson-quiz results
3. **Login Streak** (days): consecutive days of platform access
4. **Lessons Completed This Week** (count): lessons finished in the last 7 days
5. **Days Inactive** (days): time since the last login
6. **Practice Accuracy** (0-100): % answered right first time in practice rounds,
   the activities inside lessons and the learning games (last 14 days)
7. **Activities This Week** (count): practice rounds + learning-game runs in the last 7 days

### Where the activity data comes from

Every short activity a student does is saved as an `ActivityAttempt`
(`backend/app/models/activity.py`, table `activity_attempts`) through
`/api/activities`:

| Activity | Student sees | Saved |
|---|---|---|
| Practice round | **Practice** page - 5 questions in Number Fun, Word Play or My World, with a hint button and "try again" | right first time, tries, hints, seconds per question |
| Lesson activities | the practice questions inside a lesson | first answer to each activity step |
| Learning games | Learning Games (logged-in students) | games finished, wrong tries, time |
| Daily check-in | "How do you feel about learning today?" | the answer (shown to teachers; **not** a model input) |

Practice questions are generated from a seed that comes back with the
answers, so the server re-builds the round and marks it itself instead of
trusting a score sent by the browser. XP for practice and games is capped
per day so it cannot be farmed. Teachers see a per-student summary
(accuracy by area, hints and retries per question, latest check-in) on the
ML Class Report and at `GET /api/activities/student/<id>`.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Engagement Prediction System              │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐     ┌──────────────────┐             │
│  │  User Activity   │────▶│ Feature          │             │
│  │  Data            │     │ Extraction       │             │
│  └──────────────────┘     └────────┬─────────┘             │
│                                     │                        │
│                                     ▼                        │
│                          ┌──────────────────┐               │
│                          │  ML Predictor    │               │
│                          │  - Logistic Reg  │               │
│                          │  - SVM           │               │
│                          │  - Neural Net    │               │
│                          └────────┬─────────┘               │
│                                   │                          │
│                                   ▼                          │
│                          ┌──────────────────┐               │
│                          │  Engagement      │               │
│                          │  Prediction      │               │
│                          └────────┬─────────┘               │
│                                   │                          │
│                    ┌──────────────┴──────────────┐         │
│                    ▼                              ▼         │
│          ┌─────────────────┐          ┌─────────────────┐  │
│          │  Risk Assessment│          │  Recommendations│  │
│          └────────┬─────────┘          └────────┬────────┘  │
│                   │                              │           │
│                   └──────────────┬───────────────┘           │
│                                  ▼                            │
│                       ┌──────────────────┐                   │
│                       │  Action Triggers │                   │
│                       │  - Notifications │                   │
│                       │  - Bonus XP      │                   │
│                       │  - Emails        │                   │
│                       └──────────────────┘                   │
└─────────────────────────────────────────────────────────────┘
```

## Installation & Setup

### 1. Dependencies

All required packages are already in `requirements.txt`:
```
scikit-learn==1.3.0
numpy==1.24.3
pandas==2.0.3
joblib==1.3.2
```

### 2. Train the Model

Run the training script to create the initial model:

```bash
# Navigate to backend directory
cd backend

# Train with synthetic data (recommended for initial setup)
python train_engagement_model.py

# Train with custom parameters
python train_engagement_model.py --samples 2000 --algorithm auto

# Options:
#   --samples N        Number of synthetic samples (default: 3000)
#   --algorithm TYPE   Algorithm: auto, logistic, svm, neural (default: auto)
#   --real-data        Use database data (requires populated DB)
```

### 3. Verify Installation

Test the model:
```bash
python -c "from app.ml_models.engagement_predictor import EngagementPredictor; p = EngagementPredictor(); print(p.get_model_info())"
```

## API Endpoints

### Health Check

**GET** `/api/ml/health`

Check if ML service is running and model is loaded.

```json
Response:
{
  "success": true,
  "status": "healthy",
  "model_loaded": true
}
```

### Predict User Engagement

**GET** `/api/ml/engagement/predict/<user_id>`

Predict engagement for a specific user.

```json
Response:
{
  "success": true,
  "data": {
    "engaged": false,
    "confidence": 0.87,
    "engaged_probability": 0.13,
    "disengaged_probability": 0.87,
    "risk_level": "critical",
    "recommendation": [
      "Send urgent motivational notification",
      "Offer bonus XP (50 XP) for next lesson completion",
      "Provide personalized encouragement message"
    ],
    "algorithm_used": "neural",
    "user_info": {
      "user_id": 123,
      "username": "john_doe",
      "level": 5,
      "total_xp": 450
    },
    "features": {
      "time_spent_today": 5,
      "avg_quiz_score": 45,
      "login_streak": 0,
      "lessons_completed_week": 1,
      "days_inactive": 5
    }
  }
}
```

### Predict All Users

**GET** `/api/ml/engagement/predict-all`

Predict engagement for all users (Admin only).

```json
Response:
{
  "success": true,
  "data": [...],  // Array of predictions
  "total_users": 150
}
```

### Get Disengaged Users

**GET** `/api/ml/engagement/disengaged?threshold=0.6`

Get list of disengaged users (Admin only).

Query Parameters:
- `threshold` (optional): Minimum confidence threshold (default: 0.6)

```json
Response:
{
  "success": true,
  "data": [...],  // Array of disengaged user predictions
  "count": 23,
  "threshold": 0.6
}
```

### Engagement Statistics

**GET** `/api/ml/engagement/statistics`

Get overall engagement statistics (Admin only).

```json
Response:
{
  "success": true,
  "data": {
    "total_users": 150,
    "engaged_users": 127,
    "disengaged_users": 23,
    "engagement_rate": 84.67,
    "risk_breakdown": {
      "low": 90,
      "moderate-low": 37,
      "moderate": 10,
      "high": 8,
      "critical": 5
    },
    "average_confidence": 0.78
  }
}
```

### Trigger Engagement Actions

**POST** `/api/ml/engagement/trigger-actions/<user_id>`

Manually trigger engagement actions for a user (Admin only).

```json
Response:
{
  "success": true,
  "data": {
    "user_id": 123,
    "actions_taken": [
      {
        "action": "notification_sent",
        "type": "urgent_motivation",
        "message": "🌟 We miss you! Come back and earn 50 bonus XP!",
        "status": "queued"
      },
      {
        "action": "bonus_xp_awarded",
        "amount": 50,
        "new_total": 500,
        "status": "success"
      }
    ]
  },
  "prediction": {...}
}
```

### Auto-Intervention

**POST** `/api/ml/engagement/auto-intervention`

Automatically intervene with all disengaged users (Admin only).

Request Body:
```json
{
  "confidence_threshold": 0.6,
  "dry_run": false
}
```

Response:
```json
{
  "success": true,
  "data": [...],  // Array of intervention results
  "total_interventions": 23,
  "dry_run": false
}
```

### Model Management

#### Get Model Info

**GET** `/api/ml/model/info`

Get information about the current model.

```json
Response:
{
  "success": true,
  "data": {
    "trained": true,
    "algorithm": "logistic",
    "metrics": {
      "algorithm": "logistic",
      "accuracy": 0.792,
      "precision": 0.792,
      "recall": 0.792,
      "f1_score": 0.792,
      "roc_auc": 0.826,
      "test_samples": 600,
      "evaluation": "held-out test split, not used for training or model selection"
    },
    "feature_names": [
      "time_spent_today",
      "avg_quiz_score",
      "login_streak",
      "lessons_completed_week",
      "days_inactive",
      "practice_accuracy",
      "activities_week"
    ]
  }
}
```

#### Train Model

**POST** `/api/ml/model/train`

Train the engagement model (Admin only).

Request Body:
```json
{
  "algorithm": "auto",
  "use_synthetic_data": true,
  "n_samples": 1000
}
```

Response:
```json
{
  "success": true,
  "data": {
    "success": true,
    "metrics": {
      "best_algorithm": "neural",
      "logistic": {...},
      "svm": {...},
      "neural": {...}
    },
    "training_samples": 800,
    "test_samples": 200
  }
}
```

#### Test Model

**POST** `/api/ml/model/test`

Test the model with custom input.

Request Body:
```json
{
  "time_spent_today": 30,
  "avg_quiz_score": 75,
  "login_streak": 5,
  "lessons_completed_week": 3,
  "days_inactive": 0
}
```

## Usage Examples

### Python Client

```python
import requests

# Predict user engagement
response = requests.get(
    'http://localhost:5000/api/ml/engagement/predict/123',
    headers={'Authorization': 'Bearer YOUR_JWT_TOKEN'}
)
prediction = response.json()

if not prediction['data']['engaged']:
    print(f"User at risk! Risk level: {prediction['data']['risk_level']}")
    print("Recommendations:")
    for rec in prediction['data']['recommendation']:
        print(f"  - {rec}")
```

### JavaScript/React

```javascript
// Predict user engagement
const predictEngagement = async (userId) => {
  const response = await fetch(`/api/ml/engagement/predict/${userId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const result = await response.json();
  
  if (!result.data.engaged) {
    // Show intervention UI
    showEngagementAlert(result.data);
  }
};
```

### Scheduled Task (Cron Job)

```python
# scheduled_engagement_check.py
from app.services.engagement_service import EngagementService

service = EngagementService()

# Get all disengaged users
disengaged = service.get_disengaged_users(confidence_threshold=0.7)

print(f"Found {len(disengaged)} disengaged users")

# Trigger interventions
for user_pred in disengaged:
    user_id = user_pred['user_info']['user_id']
    actions = service.trigger_engagement_actions(user_id, user_pred)
    print(f"Intervened for user {user_id}: {len(actions['actions_taken'])} actions")
```

## Risk Levels & Interventions

| Risk Level | Condition | Actions Triggered |
|-----------|-----------|-------------------|
| **Critical** | Disengaged + 80%+ confidence | • Urgent notification<br>• 50 XP bonus<br>• Email campaign<br>• Personalized message |
| **High** | Disengaged + 60-80% confidence | • Motivational notification<br>• 25 XP bonus<br>• Achievement highlights |
| **Moderate** | Disengaged + 50-60% confidence | • Gentle reminder<br>• Learning goal notification |
| **Moderate-Low** | Engaged + 60-80% confidence | • Monitor closely<br>• Positive reinforcement |
| **Low** | Engaged + 80%+ confidence | • Continue normal path<br>• Maintain engagement |

## Model Performance

### Evaluation & limitations

The shipped model (`backend/app/ml_models/saved_models/engagement_model.pkl`)
was produced with `python train_engagement_model.py --evaluate` using the
versions in `requirements.txt` (scikit-learn 1.3.0).

```
Data: 3,000 synthetic students (seed 42), 80/20 stratified split, 7 inputs

Model selection - 5-fold cross-validation on the training split only:
  Logistic Regression   0.795 ± 0.019   <- shipped
  SVM (RBF)             0.794 ± 0.016
  Neural Network (MLP)  0.795 ± 0.017
  (a tie; logistic regression is shipped because its coefficients show
   which inputs matter - `python train_engagement_model.py --algorithm logistic --evaluate`)

Held-out test split (600 rows, never used for training or selection):
  Accuracy 0.792 · Precision 0.792 · Recall 0.792 · F1 0.792 · ROC-AUC 0.826
  Confusion matrix [[TN 247, FP 56], [FN 69, TP 228]]

Fresh synthetic students (3 x 10,000, unseen seeds):
  Accuracy 0.798 (0.797-0.799) · ROC-AUC 0.853
```

Effect of the two activity inputs (same synthetic students, logistic
regression, fresh-data evaluation):

```
5 inputs (before activities)   accuracy 0.786 · ROC-AUC 0.844
7 inputs (with activities)     accuracy 0.799 · ROC-AUC 0.853
```

The synthetic time-per-day was also rescaled to this platform's activities
(an engaged student spends about 30 minutes, not an hour), so a student who
does one lesson plus a couple of practice rounds and the games is no longer
rated "at risk" just for not spending an hour.

What these numbers do and do not show:

- **Synthetic labels.** The training data and its labels come from
  `generate_synthetic_training_data`, which derives every feature and the
  label from one hidden "engagement" score and flips ~12% of labels. Accuracy
  therefore measures how well the model recovers that generator; **~88% is the
  maximum any model can reach on it**. It is not real-world accuracy.
- **No real-student validation yet.** To report real accuracy, compare
  predictions with teacher judgements - for example the outcomes recorded in
  Support Plans (improved / unchanged / needs more support).
- **"Retrain with real data"** labels database students with
  `rule_based_engagement_label` (4 of 7 activity criteria). A model trained on
  those labels learns the rule, so its accuracy is also not real-world accuracy.
- **New students.** A student who joined in the last 7 days and has no
  completed lessons, quiz attempts or practice activities is reported as `engaged: null`,
  `risk_level: "new"` and receives no automatic interventions.
- **Missing quiz scores and practice accuracy** are replaced with the training
  average (neutral), not treated as 0%. A login streak only counts if the student logged in today
  or yesterday.
- **Time of day.** `time_spent_today` resets at midnight (UTC), so the same
  student scores lower early in the day than in the evening.
- **Confidence / risk levels.** On fresh synthetic data, predictions with
  confidence above 0.8 are right 88% of the time, 0.6-0.8 about 78%, and
  0.5-0.6 about 57%.
- **Old model files.** A model trained before the activity inputs (5 inputs)
  still loads and predicts with its own 5 inputs; retraining always uses all 7.

### Feature Importance

Share of the absolute standardised logistic-regression coefficient:

1. **Time Spent Today** (26.9%, +)
2. **Practice Accuracy** (13.7%, +)
3. **Days Inactive** (13.3%, -)
4. **Lessons Completed This Week** (12.9%, +)
5. **Activities This Week** (12.7%, +)
6. **Login Streak** (11.1%, +)
7. **Average Quiz Score** (9.5%, +)

## Customization

### Adjust Intervention Thresholds

Edit `engagement_service.py`:

```python
def trigger_engagement_actions(self, user_id, prediction_result):
    if not prediction_result.get('engaged'):
        risk_level = prediction_result.get('risk_level')
        confidence = prediction_result.get('confidence', 0)
        
        # Customize thresholds here
        if risk_level == 'critical' and confidence > 0.85:  # Changed from 0.8
            # Your custom actions
            pass
```

### Add Custom Features

Modify `engagement_predictor.py`:

```python
def prepare_features(self, user_data):
    self.feature_names = [
        'time_spent_today',
        'avg_quiz_score',
        'login_streak',
        'lessons_completed_week',
        'days_inactive',
        'practice_accuracy',
        'activities_week',
        'your_custom_feature'  # Add here
    ]
```

### Change Notification Messages

Edit `notification_service.py`:

```python
notifications = {
    'urgent_motivation': {
        'title': 'Your Custom Title',
        'message': 'Your custom message here',
        # ...
    }
}
```

## Monitoring & Maintenance

### Check Model Performance

```bash
# View model metrics
curl -H "Authorization: Bearer TOKEN" http://localhost:5000/api/ml/model/info
```

### Retrain Model

```bash
# Retrain with new data
python train_engagement_model.py --samples 2000 --algorithm auto
```

### Monitor Predictions

```bash
# Get engagement statistics
curl -H "Authorization: Bearer TOKEN" http://localhost:5000/api/ml/engagement/statistics
```

## Troubleshooting

### Model Not Loading

```python
# Check if model file exists
import os
model_path = 'app/ml_models/saved_models/engagement_model.pkl'
print(f"Model exists: {os.path.exists(model_path)}")

# Retrain if needed
python train_engagement_model.py
```

### Low Accuracy

- Increase training samples: `--samples 5000`
- Try different algorithm: `--algorithm neural`
- Collect real user data for training

### Missing Dependencies

```bash
pip install -r requirements.txt
```

## Best Practices

1. **Retrain Regularly**: Retrain model monthly with real user data
2. **Monitor Metrics**: Track engagement rate and intervention success
3. **A/B Testing**: Test different intervention strategies
4. **User Privacy**: Ensure compliance with data protection regulations
5. **False Positives**: Review and adjust confidence thresholds
6. **Feedback Loop**: Collect user feedback on interventions

## Future Enhancements

- [ ] Add time-series analysis for trend detection
- [ ] Implement reinforcement learning for intervention optimization
- [ ] Add explainability features (SHAP values)
- [ ] Support for personalized intervention strategies
- [ ] Integration with A/B testing framework
- [ ] Real-time streaming predictions
- [ ] Multi-language notification support
- [ ] Advanced analytics dashboard

## Support

For issues or questions:
1. Check logs: `backend/logs/`
2. Review model metrics: `/api/ml/model/info`
3. Test with sample data: `/api/ml/model/test`

---

**Created**: January 2026
**Version**: 1.0.0
**Last Updated**: January 3, 2026
