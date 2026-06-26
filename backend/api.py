# api.py
"""
Big Five Personality Assessment API
Main application entry point with FastAPI.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
import os
import sys

# Add app directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'app'))

# Import routers
from app.routes import (
    questions_router,
    assessment_router,
    results_router,
    health_router,
    admin_router
)
from app.routes.guidance import router as guidance_router

# Import services for initialization
from app.services import ontology_service
from app.db.mongodb import test_connection


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events."""
    # Startup
    script_dir = os.path.dirname(os.path.abspath(__file__))
    try:
        ontology_service.load_ontology(script_dir)
        print("✓ Ontology loaded successfully")
    except Exception as e:
        print(f"✗ Failed to load ontology: {e}")
    
    if await test_connection():
        print("✓ MongoDB connected successfully")
    else:
        print("⚠ MongoDB connection failed - data persistence disabled")
    
    yield
    
    # Shutdown
    print("Shutting down API...")


# Create FastAPI app
app = FastAPI(
    title="Big Five Personality Assessment API",
    description="""
    API for IPIP-50 personality assessment using OWL ontology.
    
    ## Features
    - 50-item IPIP personality questionnaire
    - Big Five trait scoring with percentiles
    - Outcome predictions (job, academic, leadership)
    - PDF report generation
    - MongoDB persistence
    
    ## Endpoints
    - **/api/questions** - Get assessment questions
    - **/api/submit** - Submit and score assessment
    - **/api/results** - Retrieve stored results
    - **/api/export/pdf/{id}** - Export results as PDF
    - **/api/guidance/questions** - Get lifestyle questions
    - **/api/guidance/generate** - Generate personalized guidance (RAG + Groq LLM)
    """,
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)


# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Include routers
app.include_router(health_router)
app.include_router(questions_router)
app.include_router(assessment_router)
app.include_router(results_router)
app.include_router(guidance_router)
app.include_router(admin_router)


# Root redirect to docs
@app.get("/", include_in_schema=False)
async def root():
    """Redirect root to API documentation."""
    return RedirectResponse(url="/docs")


# Run with uvicorn
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "api:app",
        host="0.0.0.0",
        port=8000,
        reload=False
    )
