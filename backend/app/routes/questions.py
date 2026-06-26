# app/routes/questions.py
"""Question and trait endpoints."""

from fastapi import APIRouter, HTTPException
from ..models import QuestionResponse, LikertOption
from ..services import ontology_service

router = APIRouter(prefix="/api", tags=["Questions"])


@router.get("/questions")
async def get_questions(short: bool = False):
    """
    Get IPIP questions with Likert scale options.
    If short=True, returns a 20-item version instead of 50.
    
    Returns both questions and likertOptions in a single response
    to minimize API calls from the frontend.
    """
    if not ontology_service.is_loaded:
        raise HTTPException(status_code=500, detail="Ontology not loaded")
    
    questions_data, likert_data = ontology_service.get_questions(short=short)
    
    questions = [
        QuestionResponse(id=q['id'], text=q['text'], trait=q['trait'], reversed=q['reversed'])
        for q in questions_data
    ]
    likert_options = [
        LikertOption(value=opt['value'], label=opt['label'])
        for opt in likert_data
    ]
    
    return {"questions": questions, "likertOptions": likert_options}


@router.get("/traits")
async def get_traits():
    """Get Big Five trait information for display."""
    if not ontology_service.is_loaded:
        raise HTTPException(status_code=500, detail="Ontology not loaded")
    
    return {"traits": ontology_service.get_trait_info()}
