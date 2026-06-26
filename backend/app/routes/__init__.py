# app/routes/__init__.py
"""Routes package - exports all API routers."""

from .questions import router as questions_router
from .assessment import router as assessment_router
from .results import router as results_router
from .health import router as health_router
from .admin import router as admin_router

__all__ = [
    "questions_router",
    "assessment_router", 
    "results_router",
    "health_router",
    "admin_router",
]
