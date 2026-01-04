# =====================================================
# Start Full Application (Frontend + Backend + ML)
# =====================================================
# This script starts both the React frontend and Flask backend
# Run this from the project root directory

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting Gamified Learning Platform  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$projectRoot = $PSScriptRoot
$backendPath = Join-Path $projectRoot "backend"
$frontendPath = Join-Path $projectRoot "frontend"

# Check if paths exist
if (-not (Test-Path $backendPath)) {
    Write-Host "Error: Backend directory not found!" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $frontendPath)) {
    Write-Host "Error: Frontend directory not found!" -ForegroundColor Red
    exit 1
}

# Function to check if port is in use
function Test-Port {
    param([int]$Port)
    $connection = Test-NetConnection -ComputerName localhost -Port $Port -InformationLevel Quiet -WarningAction SilentlyContinue
    return $connection
}

# Check if ports are available
Write-Host "Checking ports..." -ForegroundColor Yellow
if (Test-Port 5000) {
    Write-Host "Warning: Port 5000 (Backend) is already in use!" -ForegroundColor Yellow
    $continue = Read-Host "Continue anyway? (Y/N)"
    if ($continue -ne "Y" -and $continue -ne "y") {
        exit 0
    }
}

if (Test-Port 3000) {
    Write-Host "Warning: Port 3000 (Frontend) is already in use!" -ForegroundColor Yellow
    $continue = Read-Host "Continue anyway? (Y/N)"
    if ($continue -ne "Y" -and $continue -ne "y") {
        exit 0
    }
}

Write-Host ""
Write-Host "Step 1: Checking ML Model..." -ForegroundColor Green
$modelPath = Join-Path $backendPath "app\ml_models\saved_models\engagement_model.pkl"
if (Test-Path $modelPath) {
    Write-Host "  ✓ ML Model found and ready" -ForegroundColor Green
} else {
    Write-Host "  ⚠ ML Model not found. Training now..." -ForegroundColor Yellow
    Set-Location $backendPath
    python train_engagement_model.py --samples 1000
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ✗ Model training failed!" -ForegroundColor Red
        exit 1
    }
    Write-Host "  ✓ ML Model trained successfully" -ForegroundColor Green
}

Write-Host ""
Write-Host "Step 2: Starting Backend (Flask + ML)..." -ForegroundColor Green
Write-Host "  Backend will run on: http://localhost:5000" -ForegroundColor Cyan

$backendJob = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; Write-Host 'Starting Flask Backend...' -ForegroundColor Cyan; python run.py" -PassThru

Write-Host "  Waiting for backend to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Test backend health
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/ml/health" -UseBasicParsing -TimeoutSec 10 -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        Write-Host "  ✓ Backend is running" -ForegroundColor Green
        Write-Host "  ✓ ML Service is operational" -ForegroundColor Green
    }
} catch {
    Write-Host "  ⚠ Backend started but ML health check pending..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Step 3: Starting Frontend (React)..." -ForegroundColor Green
Write-Host "  Frontend will run on: http://localhost:3000" -ForegroundColor Cyan

$frontendJob = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; Write-Host 'Starting React Frontend...' -ForegroundColor Cyan; npm start" -PassThru

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  ✓ Application Started Successfully  " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Access Points:" -ForegroundColor Cyan
Write-Host "  • Frontend:  http://localhost:3000" -ForegroundColor White
Write-Host "  • Backend:   http://localhost:5000" -ForegroundColor White
Write-Host "  • ML Health: http://localhost:5000/api/ml/health" -ForegroundColor White
Write-Host ""
Write-Host "ML Endpoints:" -ForegroundColor Cyan
Write-Host "  • Test Model: http://localhost:5000/api/ml/model/info" -ForegroundColor White
Write-Host "  • Predict:    http://localhost:5000/api/ml/engagement/predict/<user_id>" -ForegroundColor White
Write-Host ""
Write-Host "To stop the application:" -ForegroundColor Yellow
Write-Host "  1. Close the backend and frontend terminal windows" -ForegroundColor White
Write-Host "  2. Or press Ctrl+C in each window" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to open the frontend in your browser..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Open browser
Start-Process "http://localhost:3000"

Write-Host ""
Write-Host "Application is running. Check the terminal windows for logs." -ForegroundColor Green
Write-Host "This window can be closed. The app will continue running." -ForegroundColor Gray
Write-Host ""
