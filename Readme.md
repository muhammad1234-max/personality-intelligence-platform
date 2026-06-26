# Personality Traits Ontology Assessment

## Overview
Personality Traits Ontology Assessment is an intelligent, ontology-driven psychological assessment platform. It uses the Big Five personality traits combined with semantic web technologies (OWL/RDF) and Large Language Models (LLMs) to provide deep, contextualized insights into a user's personality.

## Features
- **Dynamic Assessment**: Adaptive, short (20 questions) and deep (50 questions) personality tests.
- **Ontology Mapping**: Semantic understanding of traits using an integrated OWL ontology.
- **AI-Driven Guidance**: Personalized, conversational AI coaching based on the user's specific trait constellation.
- **PDF Export**: Generate detailed, downloadable reports of your psychological profile.
- **Responsive Design**: Fluid, mobile-first interface built for phones, tablets, and desktop displays.

## Screenshots
![Landing Page](assets/screenshots/landing-page.png)
![Participant Details](assets/screenshots/participant-details.png)
![Assessment Question](assets/screenshots/assessment-question.png)
![Profile Results](assets/screenshots/profile-results.png)
![Predicted Outcomes](assets/screenshots/predicted-outcomes.png)

## Technology Stack
- **Frontend**: React (Vite), Tailwind CSS, Framer Motion, Recharts
- **Backend**: FastAPI, Python 3.10+
- **Database**: MongoDB (User Data), ChromaDB (Vector Store for RAG)
- **Ontology/Semantic**: Owlready2 (OWL/RDF)
- **AI/LLM**: Groq (Llama 3) via LangChain

## Project Architecture
The system is divided into two primary services:
1. **Frontend Client**: A React application providing the user interface, routing, and assessment interactions.
2. **FastAPI Backend**: Handles incoming assessment data, queries the semantic ontology for structural trait relationships, utilizes ChromaDB for context-aware RAG, and leverages Groq LLMs to generate personalized guidance.

## Repository Structure
```
d:\personality-traits-ontology-main
├── backend/            # FastAPI server, AI services, and Ontology
├── frontend/           # React/Vite client application
├── archive/            # Obsolete files, reference PDFs, and notebooks
├── run.bat             # Windows startup script
├── run.ps1             # PowerShell startup script
├── .gitignore          # Root Git ignores
└── README.md           # Project documentation
```

## Prerequisites

### Software Requirements
- **Node.js**: v18.0.0 or higher
- **Python**: v3.10.0 or higher
- **MongoDB**: A free MongoDB Atlas cluster or local MongoDB instance

### Supported Operating Systems
- Windows 10 / 11
- macOS (Monterey or later)
- Linux (Ubuntu 20.04+)

## Installation Guide

### 1. Environment Configuration
Create a `.env` file in the `backend/` directory by copying the provided example:
```bash
cd backend
cp .env.example .env
```
Fill in the following variables in `backend/.env`:
- `MONGODB_URI`: Your MongoDB connection string.
- `GROQ_API_KEY`: Your Groq API key (get one at console.groq.com).

*(Note: Never commit secrets. Ensure `.env` is listed in your `.gitignore`)*

### 2. Python Setup & Backend Dependencies
We recommend using a virtual environment:
```bash
cd backend
python -m venv venv

# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
```

### 3. Node Setup & Frontend Dependencies
```bash
cd frontend
npm install
```

### 4. MongoDB & ChromaDB Setup
- **MongoDB**: The application will automatically create the `personality_db` database and necessary collections upon the first assessment submission.
- **ChromaDB**: ChromaDB is used locally as an embedded vector database for RAG. It will automatically initialize its storage at `backend/app/chroma_db/chroma.sqlite3` during the first AI query.

### 5. Ontology File Placement
Ensure the semantic files `ontology.owl` and `bigfive.rdf` are present in the `backend/app/` directory. These are used by Owlready2 for semantic reasoning.

## Running the Application

### Running Both Together (Easiest)
On Windows, you can simply run the provided startup scripts from the root directory:
```powershell
.\run.ps1
# OR
.\run.bat
```
This will open two terminal windows, start the backend on port 8000, and start the frontend on port 5173.

### Running the Backend (Standalone)
```bash
cd backend
# Activate virtual environment
uvicorn api:app --reload
```
The API will be available at `http://localhost:8000/api`.

### Running the Frontend (Standalone)
```bash
cd frontend
npm run dev
```
The UI will be available at `http://localhost:5173`.

## Development Workflow
- **Frontend Changes**: Vite provides hot-module replacement (HMR). Any changes in `frontend/src` will reflect instantly.
- **Backend Changes**: Uvicorn's `--reload` flag will automatically restart the server when Python files are modified.

### Production Build
To create a production-ready bundle of the frontend:
```bash
cd frontend
npm run build
```
The output will be placed in the `frontend/dist` directory, which can be served by Nginx, Vercel, or integrated into FastAPI's static file serving.

## Troubleshooting

### Common Errors
- **`ModuleNotFoundError: No module named 'fastapi'`**: Ensure you have activated your virtual environment before running the backend.
- **`MongoTimeoutError`**: Verify that your IP address is whitelisted in MongoDB Atlas Network Access settings.
- **`ValidationError: 1 validation error for ChatGroq`**: Your `GROQ_API_KEY` is missing or invalid in `backend/.env`.

## API Documentation Overview
Once the backend is running, FastAPI automatically generates interactive documentation:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

Core endpoints:
- `GET /api/questions/list` - Fetch the questionnaire.
- `POST /api/assessment/submit` - Submit answers and generate trait scores.
- `GET /api/guidance/{assessment_id}` - Chat with the AI coach.

## Folder Descriptions
- `backend/app/models/` - Pydantic schemas for data validation.
- `backend/app/routes/` - FastAPI endpoint definitions.
- `backend/app/services/` - Core business logic, LLM integration, and Ontology queries.
- `frontend/src/components/` - Reusable React components (UI, Forms, Assessment).
- `archive/` - Contains obsolete, research, or development-only files.

## Future Improvements
- Integrate robust user authentication (OAuth2).
- Add support for localization (i18n).
- Expand the ontology with more niche psychological constructs.
- Deploy the application via Docker Compose.

## Contribution Guidelines
1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

## License
This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements
- Big Five personality model and IPIP (International Personality Item Pool).
- Built with [React](https://reactjs.org/), [FastAPI](https://fastapi.tiangolo.com/), and [Groq](https://groq.com/).
