@echo off
REM =====================================================
REM Start Full Application (Frontend + Backend + ML)
REM =====================================================
REM Windows Batch Script - Run from project root

echo ========================================
echo   Starting Gamified Learning Platform
echo ========================================
echo.

cd /d "%~dp0"

REM Check if backend exists
if not exist "backend\" (
    echo Error: Backend directory not found!
    pause
    exit /b 1
)

REM Check if frontend exists
if not exist "frontend\" (
    echo Error: Frontend directory not found!
    pause
    exit /b 1
)

echo Step 1: Checking ML Model...
if exist "backend\app\ml_models\saved_models\engagement_model.pkl" (
    echo   [OK] ML Model found and ready
) else (
    echo   [WARNING] ML Model not found. Training now...
    cd backend
    python train_engagement_model.py --samples 1000
    if errorlevel 1 (
        echo   [ERROR] Model training failed!
        pause
        exit /b 1
    )
    echo   [OK] ML Model trained successfully
    cd ..
)

echo.
echo Step 2: Starting Backend (Flask + ML)...
echo   Backend will run on: http://localhost:5000
start "Flask Backend" cmd /k "cd /d "%~dp0backend" && python run.py"

echo   Waiting for backend to start...
timeout /t 5 /nobreak >nul

echo.
echo Step 3: Starting Frontend (React)...
echo   Frontend will run on: http://localhost:3000
start "React Frontend" cmd /k "cd /d "%~dp0frontend" && npm start"

echo.
echo ========================================
echo   Application Started Successfully
echo ========================================
echo.
echo Access Points:
echo   * Frontend:  http://localhost:3000
echo   * Backend:   http://localhost:5000
echo   * ML Health: http://localhost:5000/api/ml/health
echo.
echo ML Endpoints:
echo   * Test Model: http://localhost:5000/api/ml/model/info
echo   * Predict:    http://localhost:5000/api/ml/engagement/predict/^<user_id^>
echo.
echo Two terminal windows have been opened:
echo   1. Flask Backend (port 5000)
echo   2. React Frontend (port 3000)
echo.
echo To stop the application, close both terminal windows
echo or press Ctrl+C in each window.
echo.
echo Opening browser in 3 seconds...
timeout /t 3 /nobreak >nul
start http://localhost:3000

echo.
echo Application is running. Check the terminal windows for logs.
echo You can close this window - the app will continue running.
echo.
pause
