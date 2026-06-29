# app/routes/assessment.py
"""Assessment submission endpoint."""

from fastapi import APIRouter, HTTPException
from ..models import AssessmentRequest, AssessmentResult, TraitResult, PredictionResult
from ..services import ontology_service, assessment_service
from ..db.mongodb import save_assessment

router = APIRouter(prefix="/api", tags=["Assessment"])

# Required number of questions for complete assessment
REQUIRED_QUESTIONS = 50


@router.post("/submit", response_model=AssessmentResult)
async def submit_assessment(request: AssessmentRequest):
    """Process assessment and return scored results."""
    # Validate that at least the short form (20 questions) is answered
    if len(request.responses) < 20:
        raise HTTPException(
            status_code=400, 
            detail=f"Incomplete assessment. Expected at least 20 responses, got {len(request.responses)}. Please answer all questions."
        )
    
    # Validate response values are in valid range (1-5)
    for q_id, value in request.responses.items():
        if not isinstance(value, int) or value < 1 or value > 5:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid response value for question {q_id}. Expected 1-5, got {value}."
            )
    
    result = assessment_service.process_assessment(
        responses=request.responses,
        user_data=request.userData,
        timestamps=request.timestamps.model_dump() if request.timestamps else None
    )
    
    trait_results = {k: TraitResult(**v) for k, v in result['traits'].items()}
    prediction_results = {k: PredictionResult(**v) for k, v in result['predictions'].items()}
    
    # Save to MongoDB
    assessment_id = None
    saved_to_db = False
    try:
        # Convert keys to strings for MongoDB compatibility
        responses_str = {str(k): v for k, v in request.responses.items()}

        timestamps_data = None
        if request.timestamps:
            ts = request.timestamps.model_dump()

            start_ms = ts.get('surveyStartTime')
            end_ms = ts.get('surveyEndTime')
            total_ms = ts.get('totalDuration')

            session_data = {
                "startTimeMs": start_ms,
                "endTimeMs": end_ms,
                "totalDurationMs": total_ms,
                "startTimeSec": round(start_ms / 1000, 3) if start_ms is not None else None,
                "endTimeSec": round(end_ms / 1000, 3) if end_ms is not None else None,
                "totalDurationSec": round(total_ms / 1000, 3) if total_ms is not None else None,
                "totalDurationMin": round(total_ms / 60000, 2) if total_ms is not None else None,
                "totalDurationHour": round(total_ms / 3600000, 3) if total_ms is not None else None,
            }

            question_ts = {}
            for k, v in (ts.get('questionTimestamps') or {}).items():
                duration_ms = v.get('duration')
                question_ts[str(k)] = {
                    "startMs": v.get('startTime'),
                    "endMs": v.get('endTime'),
                    "durationMs": duration_ms,
                    "durationSec": round(duration_ms / 1000, 3) if duration_ms is not None else None,
                }

            timestamps_data = {
                "session": session_data,
                "questionTimestamps": question_ts
            }

        compact_scores = {k: {"rawScore": v.get("rawScore", 0)} for k, v in result['traits'].items()}
        compact_predictions = {
            "jobPerformanceScore": result['predictions'].get('job_performance', {}).get('score'),
            "academicPerformanceScore": result['predictions'].get('academic_performance', {}).get('score'),
            "leadershipScore": result['predictions'].get('leadership_effectiveness', {}).get('score'),
        }

        assessment_id = await save_assessment(
            user={
                "userId": request.userData.get("userId"),
                "name": request.userData.get("name"),
                "country": request.userData.get("country"),
                "university": request.userData.get("university"),
            },
            responses=responses_str,
            scores=compact_scores,
            predictions=compact_predictions,
            timestamps=timestamps_data
        )
        saved_to_db = True
    except Exception as e:
        print(f"MongoDB save error: {e}")
    
    return AssessmentResult(
        assessmentId=assessment_id,
        traits=trait_results,
        predictions=prediction_results,
        savedToDatabase=saved_to_db
    )
