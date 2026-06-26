# app/routes/results.py
"""Results retrieval and PDF export."""

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from io import BytesIO
from ..services.pdf_service_v2 import generate_pdf
from ..db.mongodb import (
    get_assessment_by_id,
    get_all_assessments,
    get_assessment_count,
    delete_assessment
)

router = APIRouter(prefix="/api", tags=["Results"])


@router.get("/results/{assessment_id}")
async def get_results(assessment_id: str):
    """Get assessment by ID."""
    result = await get_assessment_by_id(assessment_id)
    if not result:
        raise HTTPException(status_code=404, detail="Assessment not found")
    return result


@router.get("/results")
async def list_results(limit: int = 50, skip: int = 0):
    """List all assessments with pagination."""
    results = await get_all_assessments(limit=limit, skip=skip)
    total = await get_assessment_count()
    return {"results": results, "total": total}


@router.delete("/results/{assessment_id}")
async def delete_result(assessment_id: str):
    """Delete assessment by ID."""
    if not await delete_assessment(assessment_id):
        raise HTTPException(status_code=404, detail="Assessment not found")
    return {"message": "Deleted", "id": assessment_id}


@router.get("/export/pdf/{assessment_id}")
async def export_pdf(assessment_id: str):
    """Export assessment as PDF report."""
    print(f"[Backend] PDF generation endpoint invoked for assessment: {assessment_id}")
    assessment = await get_assessment_by_id(assessment_id)
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    
    try:
        pdf_bytes = generate_pdf(assessment)
        user_name = assessment.get('user', {}).get('name', 'Report').replace(' ', '_')
        
        return StreamingResponse(
            BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{user_name}_personality_profile.pdf"'}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {e}")
