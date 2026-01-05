# 🎮 Quick Access Links

After starting both servers, use these links to access different features:

## 📱 Main Application

**Dashboard**: http://localhost:3000/dashboard
**Lessons**: http://localhost:3000/lessons
**Profile**: http://localhost:3000/profile
**Achievements**: http://localhost:3000/achievements
**Leaderboard**: http://localhost:3000/leaderboard
**ML Insights**: http://localhost:3000/ml-insights

## 🆕 New Features (Integrated from Children Category System)

**Learning Assessment Tool**: http://localhost:3000/learning-assessment
- For teachers to assess student learning styles
- 6 categories with comprehensive questions
- Get personalized activity recommendations

**Interactive Games**: http://localhost:3000/interactive-games
- Fun educational games for students
- Rhyming, sounds, math, and more
- Track scores and performance

## 🔧 Backend API Endpoints

**Assessment Categories**: http://localhost:5000/api/assessment/categories
**Rhyme Game Data**: http://localhost:5000/api/assessment/games/rhyme-word
**Sound Game Data**: http://localhost:5000/api/assessment/games/sound-categories
**Math Problems**: http://localhost:5000/api/assessment/games/math-problem

---

## 🎯 Testing Workflow

1. **Login/Register** at http://localhost:3000/login
2. **Try Assessment** at http://localhost:3000/learning-assessment
3. **Play Games** at http://localhost:3000/interactive-games
4. **View Dashboard** at http://localhost:3000/dashboard

---

## 🛠️ Start Both Servers

```powershell
.\start-both.ps1
```

Or manually:
```powershell
# Terminal 1 - Backend
cd backend
& .\venv\Scripts\python.exe run.py

# Terminal 2 - Frontend
cd frontend
npm start
```

---

Enjoy your integrated learning platform! 🚀
