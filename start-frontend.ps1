# =====================================================
# Start Frontend Only (React)
# =====================================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "      Starting React Frontend         " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$frontendPath = Join-Path $PSScriptRoot "frontend"
Set-Location $frontendPath

Write-Host "Starting React Development Server on http://localhost:3000" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

npm start
