# Project Directory Structure

```
project/
│
├── README.md                          # Main project documentation
├── QUICKSTART.md                      # Quick setup guide
│
├── backend/                           # Flask API Backend
│   ├── app/
│   │   ├── __init__.py               # Flask app factory
│   │   │
│   │   ├── models/                   # Database Models
│   │   │   ├── __init__.py
│   │   │   ├── user.py              # User model (auth, gamification)
│   │   │   ├── lesson.py            # Lesson content model
│   │   │   ├── progress.py          # User progress tracking
│   │   │   ├── achievement.py       # Badges and achievements
│   │   │   ├── leaderboard.py       # Leaderboard rankings
│   │   │   └── quiz.py              # Quiz and attempts
│   │   │
│   │   ├── routes/                   # API Endpoints (Blueprints)
│   │   │   ├── __init__.py
│   │   │   ├── auth.py              # Authentication endpoints
│   │   │   ├── lessons.py           # Lesson CRUD operations
│   │   │   ├── gamification.py      # XP, badges, leaderboard
│   │   │   ├── analytics.py         # Dashboard & engagement
│   │   │   └── recommendations.py   # ML-powered recommendations
│   │   │
│   │   ├── ml_models/                # Machine Learning Models
│   │   │   ├── __init__.py
│   │   │   ├── engagement_predictor.py    # Engagement ML model
│   │   │   ├── learning_recommender.py    # Recommendation system
│   │   │   └── saved_models/              # Trained model files
│   │   │       └── (*.pkl files)
│   │   │
│   │   ├── services/                 # Business Logic Layer
│   │   │   └── (service files)
│   │   │
│   │   └── utils/                    # Helper Functions
│   │       └── (utility files)
│   │
│   ├── config/                       # Configuration
│   │   └── config.py                # App configuration classes
│   │
│   ├── migrations/                   # Database migrations
│   │   └── (migration files)
│   │
│   ├── tests/                        # Unit tests
│   │   └── (test files)
│   │
│   ├── run.py                        # Application entry point
│   ├── requirements.txt              # Python dependencies
│   ├── .env.example                  # Environment variables template
│   ├── .gitignore                    # Git ignore rules
│   └── README.md                     # Backend documentation
│
└── frontend/                         # React Frontend
    ├── public/
    │   └── index.html               # HTML template
    │
    ├── src/
    │   ├── components/               # React Components
    │   │   ├── common/              # Reusable components
    │   │   │   ├── Layout.js        # Main app layout
    │   │   │   └── PrivateRoute.js  # Auth route wrapper
    │   │   │
    │   │   ├── gamification/        # Gamification UI
    │   │   │   ├── XPProgressBar.js
    │   │   │   ├── StreakIndicator.js
    │   │   │   ├── AchievementBadge.js
    │   │   │   └── LeaderboardTable.js
    │   │   │
    │   │   ├── lessons/             # Lesson components
    │   │   │   └── (lesson components)
    │   │   │
    │   │   └── analytics/           # Analytics/Charts
    │   │       └── (chart components)
    │   │
    │   ├── pages/                   # Page Components
    │   │   ├── LoginPage.js
    │   │   ├── RegisterPage.js
    │   │   ├── DashboardPage.js
    │   │   ├── LessonsPage.js
    │   │   ├── LessonDetailPage.js
    │   │   ├── AchievementsPage.js
    │   │   ├── LeaderboardPage.js
    │   │   ├── ProfilePage.js
    │   │   └── index.js
    │   │
    │   ├── services/                # API Integration
    │   │   ├── api.js              # Axios instance
    │   │   └── index.js            # Service functions
    │   │
    │   ├── contexts/                # React Context
    │   │   └── AuthContext.js      # Authentication context
    │   │
    │   ├── utils/                   # Utility Functions
    │   │   └── (helper functions)
    │   │
    │   ├── styles/                  # CSS Styles
    │   │   ├── index.css           # Global styles
    │   │   └── App.css             # Component styles
    │   │
    │   ├── App.js                   # Main App component
    │   └── index.js                 # React entry point
    │
    ├── package.json                 # Node dependencies
    ├── .env.example                 # Environment template
    ├── .gitignore                   # Git ignore rules
    └── README.md                    # Frontend documentation
```

## File Count Summary

### Backend (Python/Flask)
- **Models**: 7 files (User, Lesson, Progress, Achievement, Leaderboard, Quiz)
- **Routes**: 6 files (Auth, Lessons, Gamification, Analytics, Recommendations)
- **ML Models**: 2 files (Engagement Predictor, Recommender System)
- **Config**: 1 file
- **Total Backend Files**: ~20 core files

### Frontend (React)
- **Components**: 12+ files
- **Pages**: 8 files
- **Services**: 2 files
- **Contexts**: 1 file
- **Styles**: 2 files
- **Total Frontend Files**: ~25 core files

## Key Directories Explained

### `/backend/app/models/`
Database schema definitions using SQLAlchemy ORM. Each model represents a table.

### `/backend/app/routes/`
RESTful API endpoints organized by feature. Each file is a Flask Blueprint.

### `/backend/app/ml_models/`
Machine learning implementations for engagement prediction and recommendations.

### `/frontend/src/components/`
Reusable React components organized by category (common, gamification, lessons, analytics).

### `/frontend/src/pages/`
Full-page React components that use the router.

### `/frontend/src/services/`
API integration layer using Axios for backend communication.

### `/frontend/src/contexts/`
React Context providers for global state management.

## Configuration Files

- **backend/.env** - Backend environment variables (SECRET_KEY, DATABASE_URL)
- **frontend/.env** - Frontend environment variables (REACT_APP_API_URL)
- **backend/requirements.txt** - Python package dependencies
- **frontend/package.json** - Node.js package dependencies

## Database Files (Generated at Runtime)

- **backend/dev_database.db** - SQLite development database
- **backend/app/ml_models/saved_models/*.pkl** - Trained ML models
