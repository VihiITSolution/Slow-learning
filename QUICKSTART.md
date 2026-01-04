# Quick Start Guide

## Prerequisites Check

Before starting, ensure you have:
- ✅ Python 3.8 or higher
- ✅ Node.js 16 or higher
- ✅ npm or yarn package manager
- ✅ Git (optional, for version control)

## Step-by-Step Setup

### Part 1: Backend Setup (5 minutes)

1. **Open PowerShell and navigate to backend directory**
   ```powershell
   cd "c:\D folder\Vihi_IT\Slow learning web application\project\backend"
   ```

2. **Create and activate virtual environment**
   ```powershell
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   ```

3. **Install Python dependencies**
   ```powershell
   pip install -r requirements.txt
   ```

4. **Create environment file**
   ```powershell
   Copy-Item .env.example .env
   ```

5. **Initialize the database**
   ```powershell
   python -c "from app import create_app, db; app = create_app(); app.app_context().push(); db.create_all(); print('Database created successfully!')"
   ```

6. **Start the backend server**
   ```powershell
   python run.py
   ```
   
   ✅ Backend should now be running at `http://localhost:5000`

### Part 2: Frontend Setup (5 minutes)

1. **Open a NEW PowerShell window and navigate to frontend directory**
   ```powershell
   cd "c:\D folder\Vihi_IT\Slow learning web application\project\frontend"
   ```

2. **Install Node.js dependencies**
   ```powershell
   npm install
   ```

3. **Create environment file**
   ```powershell
   Copy-Item .env.example .env
   ```

4. **Start the development server**
   ```powershell
   npm start
   ```
   
   ✅ Frontend should automatically open at `http://localhost:3000`

## Verify Installation

### Test Backend
Open your browser and visit: `http://localhost:5000/api/auth/login`

You should see a response (even if it's an error, it means the server is running)

### Test Frontend
Open your browser to: `http://localhost:3000`

You should see the login page for LearnQuest

## First Time Usage

### Create Your First User

1. Click "Sign up" on the login page
2. Fill in:
   - Username: `testuser`
   - Email: `test@example.com`
   - Password: `password123`
3. Click "Register"
4. You'll be automatically logged in and redirected to the dashboard

### Add Sample Lessons (Optional)

To populate the database with sample lessons, run this Python script:

```powershell
# In backend directory with virtual environment activated
python -c "
from app import create_app, db
from app.models import Lesson

app = create_app()
with app.app_context():
    # Create sample lessons
    lessons = [
        Lesson(
            title='Introduction to Python',
            description='Learn the basics of Python programming',
            content='Python is a versatile programming language...',
            category='programming',
            difficulty_level='easy',
            estimated_time=15,
            xp_reward=10,
            order_index=1
        ),
        Lesson(
            title='Basic Math Skills',
            description='Master fundamental mathematics',
            content='Learn addition, subtraction, multiplication...',
            category='math',
            difficulty_level='easy',
            estimated_time=20,
            xp_reward=15,
            order_index=2
        ),
        Lesson(
            title='Introduction to Science',
            description='Explore the world of science',
            content='Science helps us understand the world...',
            category='science',
            difficulty_level='easy',
            estimated_time=25,
            xp_reward=20,
            order_index=3
        )
    ]
    
    for lesson in lessons:
        db.session.add(lesson)
    
    db.session.commit()
    print('✅ Sample lessons added successfully!')
"
```

## Common Issues & Solutions

### Issue: "Python not found"
**Solution:** Install Python from python.org or Microsoft Store

### Issue: "npm not found"
**Solution:** Install Node.js from nodejs.org

### Issue: "Port 5000 already in use"
**Solution:** 
```powershell
# Find and stop the process using port 5000
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process
```

### Issue: "Module not found" errors in backend
**Solution:**
```powershell
# Ensure virtual environment is activated
.\venv\Scripts\Activate.ps1
# Reinstall dependencies
pip install -r requirements.txt
```

### Issue: Frontend won't start
**Solution:**
```powershell
# Clear npm cache and reinstall
Remove-Item -Recurse -Force node_modules
npm cache clean --force
npm install
```

## Next Steps

1. **Explore the Dashboard** - View your XP, level, and stats
2. **Browse Lessons** - Navigate to the Lessons page
3. **Complete a Lesson** - Start and complete your first lesson
4. **Check Achievements** - See what badges you can unlock
5. **View Leaderboard** - Compete with other learners

## Development Workflow

### Backend Development
- Code is in `backend/app/`
- Server auto-reloads on changes
- Check logs in PowerShell window

### Frontend Development
- Code is in `frontend/src/`
- Browser auto-refreshes on changes
- React DevTools helpful for debugging

## Stopping the Servers

### Stop Backend
Press `Ctrl+C` in the backend PowerShell window

### Stop Frontend
Press `Ctrl+C` in the frontend PowerShell window

## Additional Resources

- **Main README**: `../README.md` - Complete documentation
- **Backend README**: `backend/README.md` - API details
- **Frontend README**: `frontend/README.md` - Component guide
- **API Endpoints**: See main README for full list

## Getting Help

If you encounter issues:
1. Check the error message carefully
2. Review the Common Issues section above
3. Check that both servers are running
4. Verify environment files are set up correctly
5. Ensure all dependencies are installed

---

**Happy Learning! 🎓**
