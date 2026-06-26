@echo off
echo Starting Personality Traits Ontology App...

:: Start Backend
cd backend
start cmd /k "if not exist venv (python -m venv venv) && call venv\Scripts\activate && pip install -r requirements.txt && uvicorn api:app --reload"

:: Start Frontend
cd ../frontend
start cmd /k "npm install && npm run dev"

cd ..
echo Both servers are starting in new command windows.
