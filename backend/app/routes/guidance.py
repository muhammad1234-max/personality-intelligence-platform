"""
Guidance Routes - API endpoints for personalized guidance generation
"""
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Dict, Any
import json
from bson import ObjectId
from datetime import datetime
from scipy import stats

from ..services.llm_service import get_llm_service
from ..services.rag_service import get_rag_service
from ..services.ontology_service import ontology_service
from ..db.mongodb import assessments_collection

router = APIRouter(prefix="/api/guidance", tags=["Guidance"])

# Trait display names mapping
TRAIT_MAPPING = {
    "extraversion": "Extraversion",
    "agreeableness": "Agreeableness",
    "conscientiousness": "Conscientiousness",
    "neuroticism": "Neuroticism",
    "openness": "Openness"
}


class LifestyleAnswers(BaseModel):
    """Model for lifestyle question answers"""
    current_situation: str
    career_goal: str
    work_environment: str
    main_challenge: str
    life_priority: str


class GuidanceRequest(BaseModel):
    """Model for guidance generation request"""
    assessment_id: str
    lifestyle_answers: LifestyleAnswers


class GuidanceResponse(BaseModel):
    """Model for guidance response"""
    guidance: str
    assessment_id: str
    user_name: str


# Helper functions
def _get_population_norms() -> Dict[str, Dict[str, float]]:
    """Get population norms from ontology service or use defaults."""
    if ontology_service.is_loaded:
        return ontology_service.get_norms()
    # Fallback defaults if ontology not loaded
    return {
        "extraversion": {"mean": 29.27, "std": 7.40},
        "agreeableness": {"mean": 36.82, "std": 6.32},
        "conscientiousness": {"mean": 34.04, "std": 6.72},
        "neuroticism": {"mean": 22.37, "std": 7.91},
        "openness": {"mean": 37.23, "std": 6.24}
    }


def _calculate_traits_from_scores(scores: Dict[str, Any]) -> Dict[str, Dict[str, Any]]:
    """Calculate full trait data from stored scores."""
    traits = {}
    norms = _get_population_norms()
    
    for trait_key, trait_name in TRAIT_MAPPING.items():
        raw_score = scores.get(trait_key, {}).get("rawScore", 30)
        norm = norms.get(trait_key, {"mean": 30, "std": 7})
        
        z_score = (raw_score - norm["mean"]) / norm["std"]
        percentile = stats.norm.cdf(z_score) * 100
        
        if percentile >= 80:
            interpretation = "Very High"
        elif percentile >= 60:
            interpretation = "High"
        elif percentile >= 40:
            interpretation = "Average"
        elif percentile >= 20:
            interpretation = "Low"
        else:
            interpretation = "Very Low"
        
        traits[trait_name] = {
            "rawScore": raw_score,
            "percentile": percentile,
            "interpretation": interpretation,
            "zScore": z_score
        }
    return traits


def _build_predictions(predictions_data: Dict[str, Any]) -> Dict[str, Dict[str, Any]]:
    """Build predictions dictionary from stored data."""
    return {
        "Job Performance": {
            "score": predictions_data.get("jobPerformanceScore", 50),
            "interpretation": _get_prediction_interpretation(predictions_data.get("jobPerformanceScore", 50))
        },
        "Academic Performance": {
            "score": predictions_data.get("academicPerformanceScore", 50),
            "interpretation": _get_prediction_interpretation(predictions_data.get("academicPerformanceScore", 50))
        },
        "Leadership Effectiveness": {
            "score": predictions_data.get("leadershipScore", 50),
            "interpretation": _get_prediction_interpretation(predictions_data.get("leadershipScore", 50))
        }
    }

def _build_lifestyle_dict(lifestyle_answers: "LifestyleAnswers") -> Dict[str, str]:
    """Convert lifestyle answers model to dictionary."""
    return {
        "Current Situation": lifestyle_answers.current_situation,
        "Career Goal (3-5 years)": lifestyle_answers.career_goal,
        "Preferred Work Environment": lifestyle_answers.work_environment,
        "Main Challenge": lifestyle_answers.main_challenge,
        "Top Life Priority": lifestyle_answers.life_priority
    }


def _get_prediction_interpretation(score: float) -> str:
    """Get interpretation text for prediction score."""
    if score >= 80:
        return "Well Above Average"
    elif score >= 60:
        return "Above Average"
    elif score >= 40:
        return "Average"
    elif score >= 20:
        return "Below Average"
    return "Well Below Average"


async def _get_assessment_or_raise(assessment_id: str) -> Dict[str, Any]:
    """Fetch assessment from database or raise appropriate HTTPException."""
    try:
        assessment = await assessments_collection.find_one({"_id": ObjectId(assessment_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid assessment ID format")
    
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    return assessment


@router.get("/questions")
async def get_lifestyle_questions():
    """Get the lifestyle questions for personalization."""
    print("[Backend] Guidance lifestyle questions endpoint invoked")
    try:
        llm_service = get_llm_service()
        return {"questions": llm_service.get_lifestyle_questions()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate")
async def generate_guidance(request: GuidanceRequest):
    """Generate personalized guidance based on assessment results and lifestyle answers."""
    try:
        assessment = await _get_assessment_or_raise(request.assessment_id)
        
        user_data = assessment.get("user", {})
        user_name = user_data.get("name", "User")
        user_age = user_data.get("age")
        user_country = user_data.get("country")
        
        traits = _calculate_traits_from_scores(assessment.get("scores", {}))
        predictions = _build_predictions(assessment.get("predictions", {}))
        lifestyle_dict = _build_lifestyle_dict(request.lifestyle_answers)
        
        # Generate guidance
        llm_service = get_llm_service()
        guidance = await llm_service.generate_guidance(
            user_name=user_name,
            traits=traits,
            predictions=predictions,
            lifestyle_answers=lifestyle_dict,
            age=user_age,
            country=user_country
        )
        
        # Optionally save guidance to database
        await assessments_collection.update_one(
            {"_id": ObjectId(request.assessment_id)},
            {
                "$set": {
                    "guidance": {
                        "content": guidance,
                        "lifestyle_answers": lifestyle_dict,
                        "generated_at": datetime.utcnow()
                    }
                }
            }
        )
        
        return GuidanceResponse(
            guidance=guidance,
            assessment_id=request.assessment_id,
            user_name=user_name
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Guidance generation error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate guidance: {str(e)}")


@router.post("/generate/stream")
async def generate_guidance_stream(request: GuidanceRequest):
    """Generate personalized guidance with streaming response."""
    print(f"[Backend] Guidance generation stream invoked for assessment: {request.assessment_id}")
    try:
        assessment = await _get_assessment_or_raise(request.assessment_id)
        
        user_data = assessment.get("user", {})
        user_name = user_data.get("name", "User")
        user_age = user_data.get("age")
        user_country = user_data.get("country")
        
        traits = _calculate_traits_from_scores(assessment.get("scores", {}))
        predictions = _build_predictions(assessment.get("predictions", {}))
        lifestyle_dict = _build_lifestyle_dict(request.lifestyle_answers)
        
        llm_service = get_llm_service()
        
        async def generate_stream():
            full_response = ""
            async for chunk in llm_service.generate_guidance_stream(
                user_name=user_name,
                traits=traits,
                predictions=predictions,
                lifestyle_answers=lifestyle_dict,
                age=user_age,
                country=user_country
            ):
                full_response += chunk
                yield f"data: {json.dumps({'chunk': chunk})}\n\n"
            
            # Save to database after completion
            try:
                await assessments_collection.update_one(
                    {"_id": ObjectId(request.assessment_id)},
                    {
                        "$set": {
                            "guidance": {
                                "content": full_response,
                                "lifestyle_answers": lifestyle_dict,
                                "generated_at": datetime.utcnow()
                            }
                        }
                    }
                )
            except Exception as e:
                print(f"Failed to save guidance: {e}")
            
            yield f"data: {json.dumps({'done': True})}\n\n"
        
        return StreamingResponse(
            generate_stream(),
            media_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "Connection": "keep-alive"}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Guidance stream error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate guidance: {str(e)}")


@router.get("/saved/{assessment_id}")
async def get_saved_guidance(assessment_id: str):
    """Get previously generated guidance for an assessment."""
    try:
        assessment = await _get_assessment_or_raise(assessment_id)
        
        guidance_data = assessment.get("guidance")
        if not guidance_data:
            raise HTTPException(status_code=404, detail="No guidance found for this assessment")
        
        return {
            "guidance": guidance_data.get("content", ""),
            "lifestyle_answers": guidance_data.get("lifestyle_answers", {}),
            "generated_at": guidance_data.get("generated_at"),
            "user_name": assessment.get("user", {}).get("name", "User")
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/initialize-rag")
async def initialize_rag(force_rebuild: bool = False):
    """Initialize or rebuild the RAG vector store."""
    try:
        rag_service = get_rag_service()
        rag_service.initialize_vector_store(force_rebuild=force_rebuild)
        return {"status": "success", "message": "RAG vector store initialized"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
