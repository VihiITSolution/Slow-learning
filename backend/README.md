# Backend - Flask API

## Overview
Flask-based REST API with SQLAlchemy ORM, JWT authentication, and ML model integration.

## Setup Instructions

### 1. Create Virtual Environment
```bash
python -m venv venv
venv\Scripts\activate  # Windows
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Configure Environment
Create a `.env` file in the backend directory:
```
FLASK_ENV=development
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-key-here
DATABASE_URL=sqlite:///database.db
```

### 4. Initialize Database
```bash
python
>>> from app import create_app, db
>>> app = create_app()
>>> with app.app_context():
...     db.create_all()
>>> exit()
```

### 5. Run Development Server
```bash
python run.py
```

Server will start at `http://localhost:5000`

## API Documentation

See main README.md for complete API endpoint documentation.

## ML Models

### Training the Engagement Predictor
```python
from app.ml_models import EngagementPredictor
import pandas as pd

# Prepare training data
data = pd.DataFrame({
    'time_spent_today': [...],
    'avg_quiz_score': [...],
    'login_streak': [...],
    'lessons_completed_week': [...],
    'days_inactive': [...],
    'engaged': [...]  # Labels
})

# Train model
predictor = EngagementPredictor()
accuracy = predictor.train_model(data)
print(f"Model accuracy: {accuracy}")
```

### Training the Recommender
```python
from app.ml_models import LearningRecommender
import pandas as pd

# Prepare lesson data
lessons_df = pd.DataFrame({
    'id': [...],
    'title': [...],
    'description': [...],
    'category': [...],
    'difficulty_level': [...]
})

# Build features
recommender = LearningRecommender()
recommender.build_lesson_features(lessons_df)
```

## Database Models

- **User**: User accounts and gamification data
- **Lesson**: Learning content
- **Progress**: User-lesson progress tracking
- **Achievement**: Badges and rewards
- **Leaderboard**: Rankings by period
- **Quiz**: Quiz definitions
- **QuizAttempt**: Quiz attempt records

## Testing
```bash
pytest
```

## Production Deployment

### Using Gunicorn
```bash
gunicorn -w 4 -b 0.0.0.0:5000 run:app
```

### Environment Variables
Set these in production:
- `FLASK_ENV=production`
- `DATABASE_URL` - PostgreSQL connection string
- `SECRET_KEY` - Strong random key
- `JWT_SECRET_KEY` - Strong random key
