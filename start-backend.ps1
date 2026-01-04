# =====================================================
# Start Backend Only (Flask + ML)
# =====================================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "     Starting Backend Server + ML      " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$backendPath = Join-Path $PSScriptRoot "backend"
Set-Location $backendPath

# Check ML Model
Write-Host "Checking ML Model..." -ForegroundColor Yellow
$modelPath = Join-Path $backendPath "app\ml_models\saved_models\engagement_model.pkl"
if (Test-Path $modelPath) {
    Write-Host "  ✓ ML Model found" -ForegroundColor Green
} else {
    Write-Host "  Training ML Model..." -ForegroundColor Yellow
    python train_engagement_model.py --samples 1000
    Write-Host "  ✓ Model trained" -ForegroundColor Green
}

Write-Host ""
Write-Host "Starting Flask Backend on http://localhost:5000" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

python run.py
