# ML Model JSON Output Documentation

This document explains how to save outputs from the two ML models (Engagement Predictor and Learning Recommender) to JSON files.

## Overview

Both ML models now have methods to save their outputs to JSON format:
- **Engagement Predictor** - saves engagement predictions
- **Learning Recommender** - saves lesson recommendations

## 1. Engagement Predictor JSON Output

### Single Prediction

Save a single engagement prediction to JSON:

```python
from app.ml_models.engagement_predictor import EngagementPredictor

# Initialize predictor
predictor = EngagementPredictor()

# User data
user_data = {
    'time_spent_today': 35,
    'avg_quiz_score': 78,
    'login_streak': 5,
    'lessons_completed_week': 3,
    'days_inactive': 1
}

# Make prediction
prediction = predictor.predict_engagement(user_data)

# Save to JSON
output_path = predictor.save_prediction_to_json(
    user_data=user_data,
    prediction_result=prediction,
    output_path='app/ml_models/saved_models/engagement_predictions.json'
)
```

**Output JSON Structure:**
```json
{
  "timestamp": "2026-03-11T10:30:00.000000",
  "model_info": {
    "algorithm": "logistic",
    "metrics": {
      "accuracy": 0.85,
      "precision": 0.83,
      "recall": 0.87,
      "f1_score": 0.85
    }
  },
  "input_features": {
    "time_spent_today": 35,
    "avg_quiz_score": 78,
    "login_streak": 5,
    "lessons_completed_week": 3,
    "days_inactive": 1
  },
  "prediction": {
    "engaged": true,
    "confidence": 0.87,
    "engaged_probability": 0.87,
    "disengaged_probability": 0.13,
    "risk_level": "low",
    "recommendation": [
      "Continue normal learning path",
      "Maintain current engagement strategies"
    ],
    "algorithm_used": "logistic"
  }
}
```

### Batch Predictions

Save multiple engagement predictions to JSON:

```python
# Prepare batch predictions
batch_predictions = []

users = [
    {'time_spent_today': 50, 'avg_quiz_score': 85, 'login_streak': 10, ...},
    {'time_spent_today': 15, 'avg_quiz_score': 55, 'login_streak': 2, ...},
]

for user in users:
    pred = predictor.predict_engagement(user)
    batch_predictions.append({
        'user_id': user['id'],
        'user_data': user,
        'prediction': pred
    })

# Save batch to JSON
batch_path = predictor.save_batch_predictions_to_json(
    predictions_list=batch_predictions,
    output_path='app/ml_models/saved_models/engagement_predictions_batch.json'
)
```

**Output JSON Structure:**
```json
{
  "timestamp": "2026-03-11T10:30:00.000000",
  "model_info": {
    "algorithm": "logistic",
    "metrics": {...}
  },
  "predictions_count": 2,
  "predictions": [
    {
      "user_id": "user_1",
      "user_data": {...},
      "prediction": {...}
    },
    {
      "user_id": "user_2",
      "user_data": {...},
      "prediction": {...}
    }
  ]
}
```

## 2. Learning Recommender JSON Output

### Single User Recommendations

Save recommendations for a single user to JSON:

```python
from app.ml_models.learning_recommender import LearningRecommender

# Initialize recommender
recommender = LearningRecommender()

# User data
user_data = {
    'completed_lessons': [1, 3, 5],
    'avg_quiz_score': 75,
    'difficulty_preference': 'medium'
}

# Get recommendations
recommendations = recommender.get_adaptive_recommendations(
    user_data=user_data,
    all_lessons=lessons_df,
    n_recommendations=5
)

# Save to JSON
output_path = recommender.save_recommendations_to_json(
    user_data=user_data,
    recommendations=recommendations,
    output_path='app/ml_models/saved_models/learning_recommendations.json',
    recommendation_type='adaptive'
)
```

**Output JSON Structure:**
```json
{
  "timestamp": "2026-03-11T10:30:00.000000",
  "recommendation_type": "adaptive",
  "user_info": {
    "completed_lessons_count": 3,
    "avg_quiz_score": 75,
    "difficulty_preference": "medium"
  },
  "recommendations": [
    {
      "lesson_id": 7,
      "score": 0.89,
      "reason": "Matched to your performance level (medium)"
    },
    {
      "lesson_id": 12,
      "score": 0.85,
      "reason": "Based on your learning history"
    }
  ],
  "recommendations_count": 5
}
```

### Batch Recommendations

Save recommendations for multiple users to JSON:

```python
# Prepare batch recommendations
batch_recommendations = []

users = [
    {'user_id': 'student_1', 'completed_lessons': [1], 'avg_quiz_score': 85},
    {'user_id': 'student_2', 'completed_lessons': [1, 2, 3], 'avg_quiz_score': 70},
]

for user in users:
    recs = recommender.get_adaptive_recommendations(
        user_data=user,
        all_lessons=lessons_df,
        n_recommendations=5
    )
    batch_recommendations.append({
        'user_id': user['user_id'],
        'user_data': user,
        'recommendations': recs
    })

# Save batch to JSON
batch_path = recommender.save_batch_recommendations_to_json(
    recommendations_list=batch_recommendations,
    output_path='app/ml_models/saved_models/learning_recommendations_batch.json'
)
```

**Output JSON Structure:**
```json
{
  "timestamp": "2026-03-11T10:30:00.000000",
  "total_users": 2,
  "user_recommendations": [
    {
      "user_id": "student_1",
      "user_data": {...},
      "recommendations": [...]
    },
    {
      "user_id": "student_2",
      "user_data": {...},
      "recommendations": [...]
    }
  ]
}
```

## Method Reference

### EngagementPredictor Methods

#### `save_prediction_to_json(user_data, prediction_result, output_path=None)`
- **user_data**: dict with user activity metrics
- **prediction_result**: dict from `predict_engagement()`
- **output_path**: optional custom path (default: `app/ml_models/saved_models/engagement_predictions.json`)
- **Returns**: path where JSON was saved

#### `save_batch_predictions_to_json(predictions_list, output_path=None)`
- **predictions_list**: list of dicts with 'user_data' and 'prediction'
- **output_path**: optional custom path (default: `app/ml_models/saved_models/engagement_predictions_batch.json`)
- **Returns**: path where JSON was saved

### LearningRecommender Methods

#### `save_recommendations_to_json(user_data, recommendations, output_path=None, recommendation_type='content_based')`
- **user_data**: dict with user information
- **recommendations**: list from `get_content_based_recommendations()` or `get_adaptive_recommendations()`
- **output_path**: optional custom path (default: `app/ml_models/saved_models/learning_recommendations.json`)
- **recommendation_type**: 'content_based' or 'adaptive'
- **Returns**: path where JSON was saved

#### `save_batch_recommendations_to_json(recommendations_list, output_path=None)`
- **recommendations_list**: list of dicts with 'user_id', 'user_data', and 'recommendations'
- **output_path**: optional custom path (default: `app/ml_models/saved_models/learning_recommendations_batch.json`)
- **Returns**: path where JSON was saved

## Running the Example

To see the JSON saving functionality in action, run:

```bash
cd backend
python example_save_ml_outputs.py
```

This will create 4 JSON files:
1. `engagement_predictions.json` - Single engagement prediction
2. `engagement_predictions_batch.json` - Multiple engagement predictions
3. `learning_recommendations.json` - Single user recommendations
4. `learning_recommendations_batch.json` - Multiple user recommendations

All files are saved in `backend/app/ml_models/saved_models/` directory.

## Use Cases

1. **Export for Analysis** - Save predictions to analyze model performance
2. **Data Archiving** - Keep historical predictions for auditing
3. **API Integration** - Generate JSON for external systems
4. **Report Generation** - Create reports from saved predictions
5. **Debugging** - Inspect model outputs for debugging purposes
