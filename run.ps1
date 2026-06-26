Write-Host "Starting Personality Traits Ontology App..." -ForegroundColor Green

# Start Backend
Start-Process powershell -ArgumentList "-NoExit -Command `"cd backend; if (!(Test-Path venv)) { python -m venv venv }; .\venv\Scripts\Activate.ps1; pip install -r requirements.txt; uvicorn api:app --reload`""

# Start Frontend
Start-Process powershell -ArgumentList "-NoExit -Command `"cd frontend; npm install; npm run dev`""

Write-Host "Both servers are starting in new windows." -ForegroundColor Cyan
