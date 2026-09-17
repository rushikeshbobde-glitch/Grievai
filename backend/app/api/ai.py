from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.all_schemas import AIAnalysisRequest, AIAnalysisResult, DuplicateCheckRequest, DuplicateMatch
from app.ai.pipeline import ai_pipeline
from app.services.grievance_service import check_potential_duplicates
from app.models.all_models import Department

router = APIRouter(prefix="/ai", tags=["AI / NLP Services"])


@router.post("/analyze", response_model=AIAnalysisResult, summary="Live AI analysis preview for grievance text")
def analyze_grievance_text(req: AIAnalysisRequest, db: Session = Depends(get_db)):
    """
    Executes real-time inference across:
    - Category classification
    - Urgency & priority prediction with explainability reasons
    - Sentiment analysis (VADER)
    - Department recommendation
    - 1-line summary generation
    - Resolution action suggestion
    """
    result = ai_pipeline.analyze(
        title=req.title,
        description=req.description,
        explicit_category=req.category
    )

    # Match department ID from name
    dept_id = None
    if result["recommended_department_name"]:
        dept = db.query(Department).filter(
            Department.name.ilike(f"%{result['recommended_department_name']}%")
        ).first()
        if dept:
            dept_id = dept.id

    return AIAnalysisResult(
        category=result["category"],
        confidence=result["confidence"],
        priority=result["priority"],
        priority_score=result["priority_score"],
        priority_reason=result["priority_reason"],
        sentiment=result["sentiment"],
        sentiment_score=result["sentiment_score"],
        recommended_department_id=dept_id,
        recommended_department_name=result["recommended_department_name"],
        summary=result["summary"],
        recommended_action=result["recommended_action"],
        keywords=result["keywords"]
    )


@router.post("/check-duplicates", response_model=List[DuplicateMatch], summary="Check for similar duplicate grievances in real time")
def check_duplicates_endpoint(req: DuplicateCheckRequest, db: Session = Depends(get_db)):
    """Runs TF-IDF cosine similarity + Haversine distance against recent database records."""
    return check_potential_duplicates(
        db=db,
        title=req.title,
        description=req.description,
        latitude=req.latitude,
        longitude=req.longitude,
        exclude_id=req.exclude_id
    )
