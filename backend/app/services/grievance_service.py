import os
from typing import List, Optional, Tuple, Dict, Any
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc
from fastapi import HTTPException, status
from app.models.all_models import (
    Grievance, GrievanceAttachment, GrievanceStatusHistory, ResolutionEvidence,
    DuplicateLink, Feedback, Department, Officer, User
)
from app.schemas.all_schemas import (
    GrievanceCreate, GrievanceAssignRequest, GrievanceOverrideRequest,
    GrievanceStatusUpdateRequest, ResolutionEvidenceCreate, FeedbackCreate
)
from app.ai.pipeline import ai_pipeline, haversine_distance
from app.services.notification_service import create_notification
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


def check_potential_duplicates(
    db: Session,
    title: str,
    description: str,
    latitude: Optional[float],
    longitude: Optional[float],
    exclude_id: Optional[str] = None
) -> List[Dict[str, Any]]:
    """Checks for existing similar grievances using TF-IDF cosine similarity + Haversine distance."""
    query = db.query(Grievance).filter(Grievance.status != 'Rejected')
    if exclude_id:
        query = query.filter(Grievance.id != exclude_id)
    
    existing = query.order_by(desc(Grievance.created_at)).limit(100).all()
    if not existing:
        return []

    input_text = f"{title} {description}"
    corpus = [f"{g.title} {g.description}" for g in existing]

    try:
        vec = TfidfVectorizer(ngram_range=(1, 2), max_features=1500, sublinear_tf=True)
        tfidf_matrix = vec.fit_transform([input_text] + corpus)
        sim_scores = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:]).flatten()
    except Exception:
        return []

    duplicate_candidates = []
    for idx, g in enumerate(existing):
        text_sim = float(sim_scores[idx])
        dist_m = None

        if latitude is not None and longitude is not None and g.latitude is not None and g.longitude is not None:
            dist_m = haversine_distance(latitude, longitude, g.latitude, g.longitude)

        # Flag if high text similarity (>0.45) OR (moderate text similarity >0.20 and close geo-proximity <1000m)
        is_dup = False
        if text_sim >= 0.45:
            is_dup = True
        elif text_sim >= 0.18 and dist_m is not None and dist_m <= 1000.0:
            is_dup = True
        elif dist_m is not None and dist_m <= 150.0 and text_sim >= 0.15:
            is_dup = True

        if is_dup:
            duplicate_candidates.append({
                "grievance_id": g.id,
                "title": g.title,
                "category": g.category,
                "status": g.status,
                "similarity_score": round(text_sim * 100, 1),
                "distance_meters": round(dist_m, 1) if dist_m is not None else None,
                "created_at": g.created_at
            })

    # Sort duplicates by highest similarity
    duplicate_candidates.sort(key=lambda x: x["similarity_score"], reverse=True)
    return duplicate_candidates


def create_grievance(
    db: Session,
    citizen_id: str,
    data: GrievanceCreate,
    attachments_meta: Optional[List[Dict[str, Any]]] = None
) -> Grievance:
    """Creates a grievance with synchronous AI analysis, duplicate link checking, and status logging."""
    
    # 1. Run AI analysis
    ai_result = ai_pipeline.analyze(
        title=data.title,
        description=data.description,
        explicit_category=data.category
    )

    # 2. Match recommended department in database
    dept = None
    if ai_result["recommended_department_name"]:
        dept = db.query(Department).filter(
            Department.name.ilike(f"%{ai_result['recommended_department_name']}%")
        ).first()
    
    if not dept:
        dept = db.query(Department).first()

    # 3. Create Grievance Model
    grievance = Grievance(
        citizen_id=citizen_id,
        title=data.title,
        description=data.description,
        category=ai_result["category"],
        ai_category=ai_result["category"],
        priority=ai_result["priority"],
        ai_priority=ai_result["priority"],
        priority_reason=ai_result["priority_reason"],
        sentiment=ai_result["sentiment"],
        sentiment_score=ai_result["sentiment_score"],
        department_id=dept.id if dept else None,
        ai_department_id=dept.id if dept else None,
        ai_summary=ai_result["summary"],
        ai_recommendation=ai_result["recommended_action"],
        ai_confidence=ai_result["confidence"],
        ai_keywords=ai_result["keywords"],
        status="Submitted",
        latitude=data.latitude,
        longitude=data.longitude,
        address=data.address
    )
    db.add(grievance)
    db.commit()
    db.refresh(grievance)

    # 4. Save Attachments if any
    if attachments_meta:
        for att in attachments_meta:
            attachment_obj = GrievanceAttachment(
                grievance_id=grievance.id,
                file_url=att["file_url"],
                file_name=att["file_name"],
                file_type=att.get("file_type"),
                file_size=att.get("file_size"),
                uploaded_by=citizen_id
            )
            db.add(attachment_obj)
        db.commit()

    # 5. Record initial status history
    history = GrievanceStatusHistory(
        grievance_id=grievance.id,
        previous_status=None,
        new_status="Submitted",
        changed_by=citizen_id,
        remarks="Grievance submitted with automated AI triage."
    )
    db.add(history)
    db.commit()

    # 6. Check duplicates & create duplicate links
    potential_dups = check_potential_duplicates(
        db=db,
        title=data.title,
        description=data.description,
        latitude=data.latitude,
        longitude=data.longitude,
        exclude_id=grievance.id
    )
    if potential_dups:
        grievance.is_duplicate = True
        grievance.duplicate_of_id = potential_dups[0]["grievance_id"]
        for d in potential_dups:
            link = DuplicateLink(
                grievance_id=grievance.id,
                duplicate_of_grievance_id=d["grievance_id"],
                similarity_score=d["similarity_score"],
                distance_meters=d["distance_meters"],
                status="flagged"
            )
            db.add(link)
        db.commit()

    # 7. Notify Citizen and Admin
    create_notification(
        db=db,
        user_id=citizen_id,
        title="Grievance Submitted Successfully",
        message=f'Your grievance "{grievance.title[:40]}..." has been submitted (AI Priority: {grievance.priority}).',
        link=f"/citizen/grievances/{grievance.id}"
    )

    # Notify Admins
    admins = db.query(User).filter(User.role == "admin").all()
    for admin in admins:
        create_notification(
            db=db,
            user_id=admin.id,
            title="New Grievance Submitted",
            message=f'New {grievance.priority} priority grievance in {grievance.category}.',
            link=f"/admin/grievances/{grievance.id}"
        )

    db.refresh(grievance)
    return grievance


def get_grievance_by_id(db: Session, grievance_id: str) -> Grievance:
    """Fetches grievance by ID with full relationships or raises 404."""
    grievance = db.query(Grievance).filter(Grievance.id == grievance_id).first()
    if not grievance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Grievance not found."
        )
    return grievance


def list_grievances(
    db: Session,
    status_filter: Optional[str] = None,
    category_filter: Optional[str] = None,
    priority_filter: Optional[str] = None,
    department_id: Optional[str] = None,
    officer_id: Optional[str] = None,
    citizen_id: Optional[str] = None,
    search: Optional[str] = None,
    is_duplicate: Optional[bool] = None,
    skip: int = 0,
    limit: int = 50
) -> Tuple[List[Grievance], int]:
    """Filters and lists grievances with pagination."""
    query = db.query(Grievance)

    if citizen_id:
        query = query.filter(Grievance.citizen_id == citizen_id)
    if status_filter:
        query = query.filter(Grievance.status == status_filter)
    if category_filter:
        query = query.filter(Grievance.category == category_filter)
    if priority_filter:
        query = query.filter(Grievance.priority == priority_filter)
    if department_id:
        query = query.filter(Grievance.department_id == department_id)
    if officer_id:
        query = query.filter(Grievance.assigned_officer_id == officer_id)
    if is_duplicate is not None:
        query = query.filter(Grievance.is_duplicate == is_duplicate)

    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                Grievance.title.ilike(search_pattern),
                Grievance.description.ilike(search_pattern),
                Grievance.address.ilike(search_pattern)
            )
        )

    total = query.count()
    items = query.order_by(desc(Grievance.created_at)).offset(skip).limit(limit).all()
    return items, total


def assign_grievance(
    db: Session,
    grievance_id: str,
    assign_in: GrievanceAssignRequest,
    admin_id: str
) -> Grievance:
    """Admin assigns department and/or officer to grievance."""
    grievance = get_grievance_by_id(db, grievance_id)
    old_status = grievance.status

    grievance.department_id = assign_in.department_id
    if assign_in.officer_id:
        grievance.assigned_officer_id = assign_in.officer_id
    
    grievance.status = "Assigned"
    grievance.updated_at = datetime.now(timezone.utc)
    db.commit()

    # Log status history
    dept = db.query(Department).filter(Department.id == assign_in.department_id).first()
    dept_name = dept.name if dept else "assigned department"
    
    remarks = assign_in.remarks or f"Assigned to {dept_name}."
    history = GrievanceStatusHistory(
        grievance_id=grievance.id,
        previous_status=old_status,
        new_status="Assigned",
        changed_by=admin_id,
        remarks=remarks
    )
    db.add(history)
    db.commit()

    # Notify Citizen
    create_notification(
        db=db,
        user_id=grievance.citizen_id,
        title="Grievance Assigned",
        message=f'Your grievance "{grievance.title[:35]}..." has been assigned to {dept_name}.',
        link=f"/citizen/grievances/{grievance.id}"
    )

    # Notify Officer if assigned
    if assign_in.officer_id:
        officer = db.query(Officer).filter(Officer.id == assign_in.officer_id).first()
        if officer and officer.user_id:
            create_notification(
                db=db,
                user_id=officer.user_id,
                title="New Grievance Assigned to You",
                message=f'You have been assigned grievance: "{grievance.title[:40]}..." (Priority: {grievance.priority}).',
                link=f"/officer/dashboard"
            )

    db.refresh(grievance)
    return grievance


def override_grievance(
    db: Session,
    grievance_id: str,
    override_in: GrievanceOverrideRequest,
    admin_id: str
) -> Grievance:
    """Admin human-in-the-loop override of category, priority, or department."""
    grievance = get_grievance_by_id(db, grievance_id)
    changes = []

    if override_in.category and override_in.category != grievance.category:
        changes.append(f"Category changed from '{grievance.category}' to '{override_in.category}'")
        grievance.category = override_in.category

    if override_in.priority and override_in.priority != grievance.priority:
        changes.append(f"Priority changed from '{grievance.priority}' to '{override_in.priority}'")
        grievance.priority = override_in.priority

    if override_in.department_id and override_in.department_id != grievance.department_id:
        grievance.department_id = override_in.department_id
        changes.append("Department updated")

    grievance.updated_at = datetime.now(timezone.utc)
    db.commit()

    if changes:
        history = GrievanceStatusHistory(
            grievance_id=grievance.id,
            previous_status=grievance.status,
            new_status=grievance.status,
            changed_by=admin_id,
            remarks=override_in.remarks or f"Admin override: {'; '.join(changes)}."
        )
        db.add(history)
        db.commit()

    db.refresh(grievance)
    return grievance


def update_grievance_status(
    db: Session,
    grievance_id: str,
    status_in: GrievanceStatusUpdateRequest,
    user_id: str
) -> Grievance:
    """Updates grievance status (In Progress, Resolved, Rejected) and notifies citizen."""
    grievance = get_grievance_by_id(db, grievance_id)
    old_status = grievance.status

    grievance.status = status_in.status
    grievance.updated_at = datetime.now(timezone.utc)
    db.commit()

    # Log status history
    history = GrievanceStatusHistory(
        grievance_id=grievance.id,
        previous_status=old_status,
        new_status=status_in.status,
        changed_by=user_id,
        remarks=status_in.remarks or f"Status updated to {status_in.status}."
    )
    db.add(history)
    db.commit()

    # Notify Citizen
    create_notification(
        db=db,
        user_id=grievance.citizen_id,
        title=f"Grievance Status: {status_in.status}",
        message=f'Status of your grievance "{grievance.title[:35]}..." is now "{status_in.status}".',
        link=f"/citizen/grievances/{grievance.id}"
    )

    db.refresh(grievance)
    return grievance


def submit_resolution_evidence(
    db: Session,
    grievance_id: str,
    officer_user_id: str,
    evidence_in: ResolutionEvidenceCreate
) -> ResolutionEvidence:
    """Officer uploads resolution proof and remarks, transitioning grievance to Resolved."""
    grievance = get_grievance_by_id(db, grievance_id)

    # Create evidence record
    evidence = ResolutionEvidence(
        grievance_id=grievance.id,
        officer_id=officer_user_id,
        file_url=evidence_in.file_url or "/uploads/evidence/default_resolved.png",
        file_name=evidence_in.file_name or "resolution_proof.png",
        remarks=evidence_in.remarks
    )
    db.add(evidence)

    # Transition to Resolved
    old_status = grievance.status
    grievance.status = "Resolved"
    grievance.updated_at = datetime.now(timezone.utc)
    db.commit()

    # Log history
    history = GrievanceStatusHistory(
        grievance_id=grievance.id,
        previous_status=old_status,
        new_status="Resolved",
        changed_by=officer_user_id,
        remarks=f"Resolved with evidence: {evidence_in.remarks}"
    )
    db.add(history)
    db.commit()

    # Notify Citizen for feedback
    create_notification(
        db=db,
        user_id=grievance.citizen_id,
        title="Grievance Resolved - Feedback Requested",
        message=f'Your grievance "{grievance.title[:35]}..." has been marked Resolved with proof. Please rate the service!',
        link=f"/citizen/grievances/{grievance.id}"
    )

    db.refresh(evidence)
    return evidence


def submit_feedback(
    db: Session,
    grievance_id: str,
    citizen_id: str,
    feedback_in: FeedbackCreate
) -> Feedback:
    """Citizen submits 1-5 star rating and comment for resolved grievance."""
    grievance = get_grievance_by_id(db, grievance_id)
    if grievance.citizen_id != citizen_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only provide feedback for your own grievances."
        )

    if grievance.status != "Resolved":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Feedback can only be submitted once the grievance is Resolved."
        )

    existing = db.query(Feedback).filter(Feedback.grievance_id == grievance_id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Feedback has already been submitted for this grievance."
        )

    feedback = Feedback(
        grievance_id=grievance_id,
        citizen_id=citizen_id,
        rating=feedback_in.rating,
        comment=feedback_in.comment
    )
    db.add(feedback)
    db.commit()
    db.refresh(feedback)
    return feedback
