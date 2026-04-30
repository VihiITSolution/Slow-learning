# Start Both Backend and Frontend Servers
# Run this script from the project root directory

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Gamified Learning Platform Startup  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

 # Start Backend
Write-Host "🚀 Starting Backend Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\saduni\Documents\GitHub\Slow-learning\backend'; & 'C:\Users\saduni\Documents\GitHub\Slow-learning\.venv\Scripts\python.exe' run.py"

# Wait a moment for backend to initialize
Start-Sleep -Seconds 3

# Start Frontend
Write-Host "🚀 Starting Frontend Server..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\saduni\Documents\GitHub\Slow-learning\frontend'; npm start"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Both servers are starting!" -ForegroundColor Green
Write-Host ""
Write-Host "Backend:  http://localhost:5000" -ForegroundColor Yellow
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C in each window to stop the servers" -ForegroundColor Gray
Write-Host "========================================" -ForegroundColor Cyan
