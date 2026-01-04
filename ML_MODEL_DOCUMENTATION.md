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

The model analyzes five key metrics:

1. **Time Spent Today** (minutes): Learning time in the current session
2. **Average Quiz Score** (0-100): Performance on assessments
3. **Login Streak** (days): Consecutive days of platform access
4. **Lessons Completed This Week** (count): Weekly learning activity
5. **Days Inactive** (days): Time since last platform interaction

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
#   --samples N        Number of synthetic samples (default: 1000)
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
    "algorithm": "neural",
    "metrics": {
      "accuracy": 0.8750,
      "precision": 0.8654,
      "recall": 0.8823,
      "f1_score": 0.8738
    },
    "feature_names": [
      "time_spent_today",
      "avg_quiz_score",
      "login_streak",
      "lessons_completed_week",
      "days_inactive"
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

### Typical Metrics (After Training)

```
Algorithm Comparison:
├── Logistic Regression
│   ├── Accuracy:  0.8450
│   ├── Precision: 0.8321
│   ├── Recall:    0.8567
│   └── F1 Score:  0.8442
├── SVM
│   ├── Accuracy:  0.8623
│   ├── Precision: 0.8512
│   ├── Recall:    0.8734
│   └── F1 Score:  0.8621
└── Neural Network
    ├── Accuracy:  0.8750
    ├── Precision: 0.8654
    ├── Recall:    0.8823
    └── F1 Score:  0.8738
```

### Feature Importance

1. **Days Inactive** (35%): Strongest predictor
2. **Login Streak** (25%): Strong engagement indicator
3. **Average Quiz Score** (20%): Performance matters
4. **Time Spent Today** (15%): Current activity level
5. **Lessons Completed** (5%): Weekly productivity

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
