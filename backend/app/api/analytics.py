from typing import List, Optional
from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.auth_service import require_role
from app.models.all_models import User
from app.schemas.all_schemas import AnalyticsSummaryOut, AnalyticsTrendPoint, HeatmapPoint
from app.services.analytics_service import (
    get_analytics_summary, get_analytics_trends, get_heatmap_points, export_grievances_csv
)

router = APIRouter(prefix="/analytics", tags=["Analytics & Reports"])


@router.get("/summary", response_model=AnalyticsSummaryOut, summary="Get high-level KPI and chart metrics")
def get_summary(
    current_user: User = Depends(require_role(["admin", "officer"])),
    db: Session = Depends(get_db)
):
    """Aggregates real database records for KPI summary cards and distribution charts."""
    return get_analytics_summary(db)


@router.get("/trends", response_model=List[AnalyticsTrendPoint], summary="Get time-series grievance trends")
def get_trends(
    days: int = 14,
    current_user: User = Depends(require_role(["admin", "officer"])),
    db: Session = Depends(get_db)
):
    """Retrieves 14-day daily breakdown of incoming vs resolved complaints."""
    return get_analytics_trends(db, days=days)


@router.get("/heatmap", response_model=List[HeatmapPoint], summary="Get grievance GPS coordinates for map view")
def get_heatmap(
    current_user: User = Depends(require_role(["admin", "officer"])),
    db: Session = Depends(get_db)
):
    """Retrieves geospatial coordinates and metadata of grievances."""
    return get_heatmap_points(db)


@router.get("/export-csv", summary="Export grievances data to CSV")
def export_csv(
    status: Optional[str] = None,
    category: Optional[str] = None,
    priority: Optional[str] = None,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """Exports filtered real database grievance records as a downloadable CSV file."""
    csv_content = export_grievances_csv(
        db, status_filter=status, category_filter=category, priority_filter=priority
    )
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=grievances_export.csv"}
    )
