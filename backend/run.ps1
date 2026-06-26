# PowerShell script to run the backend server
# Usage: .\run.ps1

Write-Host "Starting FastAPI backend server..." -ForegroundColor Green
Write-Host "Server will be accessible at: http://0.0.0.0:8000" -ForegroundColor Cyan
Write-Host "API Documentation: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host ""

uvicorn api:app --host 0.0.0.0 --port 8000 --reload
