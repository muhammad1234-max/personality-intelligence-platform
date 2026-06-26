# app/routes/health.py
"""Health check endpoints."""

from fastapi import APIRouter
from ..services import ontology_service
from ..db.mongodb import test_connection

router = APIRouter(prefix="/api", tags=["Health"])


@router.get("/health")
async def health_check():
    """Check API health."""
    db_connected = await test_connection()
    return {
        "api": "healthy",
        "database": "connected" if db_connected else "disconnected",
        "ontology": "loaded" if ontology_service.is_loaded else "not loaded"
    }
