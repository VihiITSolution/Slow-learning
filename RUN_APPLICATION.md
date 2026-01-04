# Quick Start Guide - Run the Application

## 🚀 Quick Start (Easiest Method)

### Option 1: Run Everything Together (Recommended)

**Windows (Double-click or run from PowerShell):**

```powershell
# Right-click on start-app.ps1 → Run with PowerShell
# OR from terminal:
.\start-app.ps1
```

**Or use the batch file:**
```cmd
start-app.bat
```

This will:
1. ✅ Check if ML model is trained (trains if needed)
2. ✅ Start Flask backend on port 5000
3. ✅ Start React frontend on port 3000
4. ✅ Open browser automatically

---

## 📋 Manual Start (Step by Step)

### Step 1: Start Backend (Flask + ML)

**Terminal 1:**
```powershell
# Navigate to backend
cd backend

# Install dependencies (first time only)
pip install -r requirements.txt

# Train ML model (first time only)
python train_engagement_model.py

# Start backend
python run.py
```

✅ Backend runs on: http://localhost:5000  
✅ ML Health Check: http://localhost:5000/api/ml/health

---

### Step 2: Start Frontend (React)

**Terminal 2:**
```powershell
# Navigate to frontend
cd frontend

# Install dependencies (first time only)
npm install

# Start frontend
npm start
```

✅ Frontend runs on: http://localhost:3000  
✅ Browser opens automatically

---

## 🔧 Individual Component Startup

### Backend Only
```powershell
.\start-backend.ps1
# OR
cd backend && python run.py
```

### Frontend Only
```powershell
.\start-frontend.ps1
# OR
cd frontend && npm start
```

### Train ML Model Only
```powershell
cd backend
python train_engagement_model.py
```

---

## 🌐 Access Points After Starting

| Component | URL | Description |
|-----------|-----|-------------|
| **Frontend** | http://localhost:3000 | React web application |
| **Backend API** | http://localhost:5000 | Flask REST API |
| **ML Health** | http://localhost:5000/api/ml/health | Check ML service status |
| **Model Info** | http://localhost:5000/api/ml/model/info | View model details |

---

## ✅ Verification Checklist

After starting, verify everything works:

### 1. Backend Check
```powershell
# In a new terminal
curl http://localhost:5000/api/ml/health
```

Expected response:
```json
{
  "success": true,
  "status": "healthy",
  "model_loaded": true
}
```

### 2. ML Model Check
```powershell
curl http://localhost:5000/api/ml/model/info
```

### 3. Frontend Check
- Open http://localhost:3000 in browser
- Should see the login/home page

---

## 🛑 Stopping the Application

### If using start-app.ps1 or start-app.bat:
1. Close both terminal windows (Flask Backend and React Frontend)
2. Or press `Ctrl+C` in each window

### If running manually:
1. Press `Ctrl+C` in the backend terminal
2. Press `Ctrl+C` in the frontend terminal

---

## 🐛 Troubleshooting

### Port Already in Use

**Backend (Port 5000):**
```powershell
# Find process using port 5000
netstat -ano | findstr :5000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

**Frontend (Port 3000):**
```powershell
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process
taskkill /PID <PID> /F
```

### ML Model Not Found
```powershell
cd backend
python train_engagement_model.py --samples 1000
```

### Dependencies Missing

**Backend:**
```powershell
cd backend
pip install -r requirements.txt
```

**Frontend:**
```powershell
cd frontend
npm install
```

### Import Errors
```powershell
# Make sure you're in the backend directory
cd backend
python -c "from app import create_app; print('OK')"
```

---

## 📦 First-Time Setup Checklist

Run these commands the first time:

```powershell
# 1. Backend setup
cd backend
pip install -r requirements.txt
python train_engagement_model.py --samples 1000

# 2. Frontend setup
cd ../frontend
npm install

# 3. Start everything
cd ..
.\start-app.ps1
```

---

## 🔄 Development Workflow

### Daily Development:
1. Run `start-app.ps1` or `start-app.bat`
2. Make your code changes
3. Backend auto-reloads on save (Flask debug mode)
4. Frontend auto-reloads on save (React hot reload)

### Testing ML Model:
1. Make changes to ML code
2. Stop backend (`Ctrl+C`)
3. Retrain model: `python train_engagement_model.py`
4. Restart backend: `python run.py`

---

## 🎯 Quick Commands Reference

```powershell
# Start everything
.\start-app.ps1

# Backend only
.\start-backend.ps1

# Frontend only  
.\start-frontend.ps1

# Train ML model
cd backend && python train_engagement_model.py

# Check backend health
curl http://localhost:5000/api/ml/health

# Check model info
curl http://localhost:5000/api/ml/model/info

# Test prediction
curl -X POST http://localhost:5000/api/ml/model/test -H "Content-Type: application/json" -d "{\"time_spent_today\":30,\"avg_quiz_score\":75,\"login_streak\":5,\"lessons_completed_week\":3,\"days_inactive\":0}"
```

---

## 📊 Expected Terminal Output

### Backend Terminal:
```
 * Serving Flask app 'app'
 * Debug mode: on
WARNING: This is a development server.
 * Running on http://0.0.0.0:5000
 * Running on http://127.0.0.1:5000
Model loaded from app/ml_models/saved_models/engagement_model.pkl (algorithm: neural)
```

### Frontend Terminal:
```
Compiled successfully!

You can now view gamified-learning-frontend in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.x.x:3000
```

---

## 🎉 Success Indicators

You know everything is working when:
- ✅ Two terminal windows are open and running
- ✅ Browser opens to http://localhost:3000
- ✅ No error messages in terminals
- ✅ ML health check returns "healthy"
- ✅ Frontend loads without errors

---

**Need help?** Check the logs in the terminal windows for error messages.
