import io
import csv
from typing import Dict, Any, List
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from app.models.all_models import Grievance, Department, Feedback, GrievanceStatusHistory


def get_analytics_summary(db: Session) -> Dict[str, Any]:
    """Calculates live KPI metrics and distribution charts from actual database records."""
    total = db.query(Grievance).count()
    pending = db.query(Grievance).filter(Grievance.status == 'Submitted').count()
    assigned = db.query(Grievance).filter(Grievance.status == 'Assigned').count()
    in_progress = db.query(Grievance).filter(Grievance.status == 'In Progress').count()
    resolved = db.query(Grievance).filter(Grievance.status == 'Resolved').count()
    high_priority = db.query(Grievance).filter(Grievance.priority == 'High').count()
    duplicate_count = db.query(Grievance).filter(Grievance.is_duplicate == True).count()

    # Calculate average resolution time (hours)
    resolved_grievances = db.query(Grievance).filter(Grievance.status == 'Resolved').all()
    avg_hours = 0.0
    if resolved_grievances:
        durations = []
        for g in resolved_grievances:
            if g.created_at and g.updated_at:
                diff = (g.updated_at - g.created_at).total_seconds() / 3600.0
                durations.append(max(0.5, diff))
        if durations:
            avg_hours = round(sum(durations) / len(durations), 1)

    # Categories Breakdown
    cat_query = db.query(Grievance.category, func.count(Grievance.id)).group_by(Grievance.category).all()
    categories_breakdown = [{"name": c[0], "value": c[1]} for c in cat_query]

    # Priority Breakdown
    prio_query = db.query(Grievance.priority, func.count(Grievance.id)).group_by(Grievance.priority).all()
    priorities_breakdown = [{"name": p[0], "value": p[1]} for p in prio_query]

    # Status Breakdown
    status_query = db.query(Grievance.status, func.count(Grievance.id)).group_by(Grievance.status).all()
    status_breakdown = [{"name": s[0], "value": s[1]} for s in status_query]

    # Sentiment Breakdown
    sent_query = db.query(Grievance.sentiment, func.count(Grievance.id)).group_by(Grievance.sentiment).all()
    sentiment_breakdown = [{"name": s[0] or "Neutral", "value": s[1]} for s in sent_query]

    # Department Breakdown
    dept_query = db.query(
        Department.name, func.count(Grievance.id)
    ).outerjoin(Grievance, Department.id == Grievance.department_id).group_by(Department.name).all()
    department_breakdown = [{"name": d[0], "value": d[1]} for d in dept_query]

    return {
        "total_grievances": total,
        "pending_grievances": pending,
        "assigned_grievances": assigned,
        "in_progress_grievances": in_progress,
        "resolved_grievances": resolved,
        "high_priority_count": high_priority,
        "avg_resolution_hours": avg_hours,
        "duplicate_count": duplicate_count,
        "categories_breakdown": categories_breakdown,
        "priorities_breakdown": priorities_breakdown,
        "status_breakdown": status_breakdown,
        "department_breakdown": department_breakdown,
        "sentiment_breakdown": sentiment_breakdown
    }


def get_analytics_trends(db: Session, days: int = 14) -> List[Dict[str, Any]]:
    """Generates daily time-series trend of submitted vs resolved grievances."""
    now = datetime.now(timezone.utc)
    trend_data = []

    for i in range(days - 1, -1, -1):
        day_date = (now - timedelta(days=i)).date()
        day_start = datetime.combine(day_date, datetime.min.time())
        day_end = datetime.combine(day_date, datetime.max.time())

        submitted_count = db.query(Grievance).filter(
            Grievance.created_at >= day_start,
            Grievance.created_at <= day_end
        ).count()

        resolved_count = db.query(GrievanceStatusHistory).filter(
            GrievanceStatusHistory.new_status == "Resolved",
            GrievanceStatusHistory.created_at >= day_start,
            GrievanceStatusHistory.created_at <= day_end
        ).count()

        trend_data.append({
            "date": day_date.strftime("%b %d"),
            "submitted": submitted_count,
            "resolved": resolved_count
        })

    return trend_data


def get_heatmap_points(db: Session) -> List[Dict[str, Any]]:
    """Returns geo-coordinates of grievances with category, status, and priority for map rendering."""
    grievances = db.query(Grievance).filter(
        Grievance.latitude.isnot(None),
        Grievance.longitude.isnot(None)
    ).all()

    points = []
    for g in grievances:
        points.append({
            "id": g.id,
            "title": g.title,
            "category": g.category,
            "priority": g.priority,
            "status": g.status,
            "address": g.address or "",
            "latitude": g.latitude,
            "longitude": g.longitude
        })
    return points


def export_grievances_csv(
    db: Session,
    status_filter: str = None,
    category_filter: str = None,
    priority_filter: str = None
) -> str:
    """Exports real database grievance records as a formatted CSV string."""
    query = db.query(Grievance)
    if status_filter:
        query = query.filter(Grievance.status == status_filter)
    if category_filter:
        query = query.filter(Grievance.category == category_filter)
    if priority_filter:
        query = query.filter(Grievance.priority == priority_filter)

    records = query.order_by(desc(Grievance.created_at)).all()

    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow([
        "Grievance ID", "Title", "Category", "AI Category", "Priority", "AI Priority",
        "Sentiment", "Sentiment Score", "Status", "Address", "Latitude", "Longitude",
        "Is Duplicate", "Created At", "Updated At"
    ])

    for g in records:
        writer.writerow([
            g.id,
            g.title,
            g.category,
            g.ai_category or "",
            g.priority,
            g.ai_priority or "",
            g.sentiment or "",
            g.sentiment_score or 0.0,
            g.status,
            g.address or "",
            g.latitude or "",
            g.longitude or "",
            "Yes" if g.is_duplicate else "No",
            g.created_at.strftime("%Y-%m-%d %H:%M:%S") if g.created_at else "",
            g.updated_at.strftime("%Y-%m-%d %H:%M:%S") if g.updated_at else ""
        ])

    return output.getvalue()
