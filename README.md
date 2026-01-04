# Gamified Micro-Learning Platform for Slow Learners 🎓

A web-based learning platform that enhances the learning experience through gamification, personalized recommendations, and adaptive learning powered by machine learning.

## 🌟 Features

### Gamification Elements
- **Points & XP System** - Earn experience points for completing lessons and quizzes
- **Level Progression** - Level up as you gain XP with visual progress tracking
- **Badges & Achievements** - Unlock special badges for milestones like "5-Day Streak" or "Perfect Quiz"
- **Leaderboards** - Compete with other learners (Daily, Weekly, Monthly, All-Time)
- **Daily Streaks** - Get rewarded for consistent learning
- **Avatar Customization** - Personalize your profile with earned rewards

### Machine Learning Features
1. **Engagement Prediction Model**
   - Predicts learner engagement based on activity patterns
   - Triggers motivational notifications for disengaged users
   - Uses Logistic Regression/SVM for prediction

2. **Learning Recommendation System**
   - Recommends personalized lessons based on performance
   - Content-based filtering using TF-IDF
   - Adaptive difficulty matching

### Analytics Dashboard
- Real-time progress tracking
- Performance visualization
- Engagement metrics
- Learning trends over time

## 📁 Project Structure

```
project/
├── backend/                    # Flask API Backend
│   ├── app/
│   │   ├── models/            # Database models
│   │   │   ├── user.py
│   │   │   ├── lesson.py
│   │   │   ├── progress.py
│   │   │   ├── achievement.py
│   │   │   ├── leaderboard.py
│   │   │   └── quiz.py
│   │   ├── routes/            # API endpoints
│   │   │   ├── auth.py
│   │   │   ├── lessons.py
│   │   │   ├── gamification.py
│   │   │   ├── analytics.py
│   │   │   └── recommendations.py
│   │   ├── ml_models/         # Machine Learning models
│   │   │   ├── engagement_predictor.py
│   │   │   └── learning_recommender.py
│   │   ├── services/          # Business logic
│   │   └── utils/             # Helper functions
│   ├── config/                # Configuration files
│   ├── migrations/            # Database migrations
│   ├── tests/                 # Unit tests
│   ├── requirements.txt       # Python dependencies
│   └── run.py                 # Application entry point
│
├── frontend/                  # React Frontend
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/       # Reusable components
│   │   │   ├── gamification/ # Gamification components
│   │   │   ├── lessons/      # Lesson components
│   │   │   └── analytics/    # Analytics components
│   │   ├── pages/            # Page components
│   │   ├── services/         # API service layer
│   │   ├── contexts/         # React contexts
│   │   ├── utils/            # Utility functions
│   │   └── styles/           # CSS files
│   ├── package.json
│   └── .env.example
│
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   venv\Scripts\activate  # On Windows
   # source venv/bin/activate  # On Linux/Mac
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env file with your configuration
   ```

5. **Run the application**
   ```bash
   python run.py
   ```

   The backend will start at `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env file with your API URL
   ```

4. **Run the development server**
   ```bash
   npm start
   ```

   The frontend will start at `http://localhost:3000`

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Lessons
- `GET /api/lessons` - Get all lessons (with filters)
- `GET /api/lessons/:id` - Get lesson details
- `POST /api/lessons/:id/start` - Start a lesson
- `POST /api/lessons/:id/complete` - Complete a lesson
- `PUT /api/lessons/:id/progress` - Update progress

### Gamification
- `GET /api/gamification/achievements` - Get user achievements
- `POST /api/gamification/achievements/unlock` - Unlock achievement
- `GET /api/gamification/leaderboard` - Get leaderboard
- `GET /api/gamification/streak` - Get streak information
- `POST /api/gamification/xp/add` - Add XP to user

### Analytics
- `GET /api/analytics/dashboard` - Get dashboard data
- `GET /api/analytics/engagement` - Check engagement status
- `GET /api/analytics/progress-over-time` - Get progress timeline

### Recommendations
- `GET /api/recommendations` - Get personalized recommendations
- `GET /api/recommendations/next-lesson` - Get next suggested lesson

## 🧠 Machine Learning Models

### Engagement Prediction Model
- **Input Features:**
  - Time spent on lessons
  - Average quiz scores
  - Login streaks
  - Lessons completed per week
  - Days of inactivity

- **Output:** Engaged/Disengaged prediction with confidence score

- **Model:** Logistic Regression (can be upgraded to SVM or Neural Network)

### Learning Recommendation System
- **Approach:** Content-based filtering with TF-IDF vectorization
- **Features:** Lesson title, description, category, difficulty level
- **Adaptive:** Adjusts difficulty based on quiz performance

## 🎨 Frontend Components

### Key Components
- **Layout** - Main application layout with sidebar navigation
- **XPProgressBar** - Visual XP and level progress
- **StreakIndicator** - Daily streak display
- **AchievementBadge** - Badge display component
- **LeaderboardTable** - Competitive rankings

### Pages
- **Dashboard** - Overview with stats and recommendations
- **Lessons** - Browse and filter available lessons
- **Lesson Detail** - Individual lesson view
- **Achievements** - View earned badges
- **Leaderboard** - Competitive rankings
- **Profile** - User profile and settings

## 🔐 Authentication
- JWT-based authentication
- Token stored in localStorage
- Automatic token refresh
- Protected routes with PrivateRoute component

## 📊 Database Schema

### Users Table
- User credentials and profile
- XP, level, and streak tracking
- Avatar customization

### Lessons Table
- Lesson content and metadata
- Difficulty levels
- XP rewards

### Progress Table
- User-lesson relationship
- Completion tracking
- Time spent

### Achievements Table
- Badge definitions
- Unlock conditions
- XP bonuses

### Quiz Tables
- Quiz questions and answers
- Attempt tracking
- Score history

## 🛠️ Technologies Used

### Backend
- **Flask** - Web framework
- **SQLAlchemy** - ORM
- **Flask-JWT-Extended** - Authentication
- **Scikit-learn** - Machine learning
- **Pandas** - Data manipulation
- **NumPy** - Numerical computing

### Frontend
- **React** - UI framework
- **React Router** - Navigation
- **React Query** - Data fetching
- **Axios** - HTTP client
- **React Icons** - Icon library
- **Recharts** - Data visualization
- **Framer Motion** - Animations

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 🚢 Deployment

### Backend Deployment
- Use **Gunicorn** as production server
- Deploy to **Heroku**, **AWS**, or **DigitalOcean**
- Set environment variables for production
- Use PostgreSQL for production database

### Frontend Deployment
- Build production bundle: `npm run build`
- Deploy to **Netlify**, **Vercel**, or **GitHub Pages**
- Configure API URL for production

## 📈 Future Enhancements

- [ ] Real-time notifications using WebSockets
- [ ] Social features (friend system, group challenges)
- [ ] Mobile app (React Native)
- [ ] Advanced analytics with data export
- [ ] Multi-language support
- [ ] Voice-based lessons
- [ ] Offline mode support
- [ ] Integration with external learning platforms

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 👥 Authors

Vihi IT - Slow Learning Web Application Project

## 🙏 Acknowledgments

- Thanks to all educators and learners who inspired this project
- Built with modern web technologies and best practices
- Designed to make learning accessible and enjoyable for everyone
