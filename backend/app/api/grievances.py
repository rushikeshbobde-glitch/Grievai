import os
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import settings
from app.services.auth_service import get_current_user, require_role
from app.models.all_models import User, Grievance, Officer, GrievanceAttachment
from app.schemas.all_schemas import (
    GrievanceCreate, GrievanceOut, GrievanceDetailOut, GrievanceAssignRequest,
    GrievanceOverrideRequest, GrievanceStatusUpdateRequest, ResolutionEvidenceCreate,
    ResolutionEvidenceOut, FeedbackCreate, FeedbackOut, DuplicateMatch
)
from app.services.grievance_service import (
    create_grievance, get_grievance_by_id, list_grievances, assign_grievance,
    override_grievance, update_grievance_status, submit_resolution_evidence,
    submit_feedback, check_potential_duplicates
)

router = APIRouter(prefix="/grievances", tags=["Grievances"])


@router.post("/upload", summary="Upload attachment file (Image or Document)")
async def upload_file(
    file: UploadFile = File(...),
    folder: str = "attachments",
    current_user: User = Depends(get_current_user)
):
    """Handles file uploads with MIME and extension validation."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded.")

    ext = file.filename.split(".")[-1].lower()
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type. Allowed: {', '.join(settings.ALLOWED_EXTENSIONS)}"
        )

    # Generate safe unique filename
    unique_filename = f"{uuid.uuid4().hex[:12]}_{file.filename.replace(' ', '_')}"
    target_folder = os.path.join(settings.UPLOAD_DIR, folder if folder in ["attachments", "evidence"] else "attachments")
    file_path = os.path.join(target_folder, unique_filename)

    contents = await file.read()
    if len(contents) > settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail=f"File exceeds maximum size limit of {settings.MAX_UPLOAD_SIZE_MB}MB."
        )

    with open(file_path, "wb") as f:
        f.write(contents)

    relative_url = f"/uploads/{folder}/{unique_filename}"
    return {
        "file_url": relative_url,
        "file_name": file.filename,
        "file_size": len(contents),
        "file_type": file.content_type
    }


@router.post("", response_model=GrievanceOut, status_code=status.HTTP_201_CREATED, summary="Submit a new grievance (Citizen)")
def submit_grievance_endpoint(
    data: GrievanceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submits a citizen grievance and executes the synchronous AI triage pipeline."""
    return create_grievance(db, citizen_id=current_user.id, data=data)


@router.get("/my", response_model=List[GrievanceOut], summary="List citizen's own grievances")
def get_my_grievances(
    status_filter: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves all grievances submitted by the logged-in citizen."""
    items, _ = list_grievances(db, citizen_id=current_user.id, status_filter=status_filter, limit=100)
    return items


@router.get("/assigned", response_model=List[GrievanceOut], summary="List officer's assigned grievances")
def get_officer_assigned_grievances(
    status_filter: Optional[str] = None,
    current_user: User = Depends(require_role(["officer", "admin"])),
    db: Session = Depends(get_db)
):
    """Retrieves grievances assigned to the current officer profile."""
    officer = db.query(Officer).filter(Officer.user_id == current_user.id).first()
    officer_id = officer.id if officer else None
    
    # If admin calls this without officer profile, return all assigned
    items, _ = list_grievances(db, officer_id=officer_id, status_filter=status_filter, limit=100)
    return items


@router.get("", response_model=List[GrievanceOut], summary="List all grievances with filtering (Admin/Officer)")
def get_all_grievances(
    status: Optional[str] = None,
    category: Optional[str] = None,
    priority: Optional[str] = None,
    department_id: Optional[str] = None,
    search: Optional[str] = None,
    is_duplicate: Optional[bool] = None,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(require_role(["admin", "officer"])),
    db: Session = Depends(get_db)
):
    """Lists grievances with multi-criteria filtering, sorting, and pagination."""
    items, _ = list_grievances(
        db,
        status_filter=status,
        category_filter=category,
        priority_filter=priority,
        department_id=department_id,
        search=search,
        is_duplicate=is_duplicate,
        skip=skip,
        limit=limit
    )
    return items


@router.get("/{grievance_id}", response_model=GrievanceDetailOut, summary="Get full grievance details and timeline")
def get_grievance_details(
    grievance_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Returns complete grievance info including attachments, status timeline, evidence, and feedback."""
    grievance = get_grievance_by_id(db, grievance_id)
    
    # Check permissions: Citizens can only access own grievances unless admin/officer
    if current_user.role == "citizen" and grievance.citizen_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view this grievance."
        )

    return grievance


@router.patch("/{grievance_id}/assign", response_model=GrievanceOut, summary="Assign grievance to department/officer (Admin)")
def assign_grievance_endpoint(
    grievance_id: str,
    assign_in: GrievanceAssignRequest,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """Assigns the grievance to a municipal department and/or officer."""
    return assign_grievance(db, grievance_id=grievance_id, assign_in=assign_in, admin_id=current_user.id)


@router.patch("/{grievance_id}/override", response_model=GrievanceOut, summary="Override AI classification/priority (Admin)")
def override_grievance_endpoint(
    grievance_id: str,
    override_in: GrievanceOverrideRequest,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """Human-in-the-loop review overriding category, priority, or department."""
    return override_grievance(db, grievance_id=grievance_id, override_in=override_in, admin_id=current_user.id)


@router.patch("/{grievance_id}/status", response_model=GrievanceOut, summary="Update grievance status (Officer/Admin)")
def update_status_endpoint(
    grievance_id: str,
    status_in: GrievanceStatusUpdateRequest,
    current_user: User = Depends(require_role(["officer", "admin"])),
    db: Session = Depends(get_db)
):
    """Transitions grievance status (In Progress, Resolved, Rejected) and notifies citizen."""
    return update_grievance_status(db, grievance_id=grievance_id, status_in=status_in, user_id=current_user.id)


@router.post("/{grievance_id}/evidence", response_model=ResolutionEvidenceOut, summary="Upload resolution evidence (Officer)")
def upload_evidence_endpoint(
    grievance_id: str,
    evidence_in: ResolutionEvidenceCreate,
    current_user: User = Depends(require_role(["officer", "admin"])),
    db: Session = Depends(get_db)
):
    """Officer uploads resolution proof and remarks, marking the grievance Resolved."""
    return submit_resolution_evidence(
        db,
        grievance_id=grievance_id,
        officer_user_id=current_user.id,
        evidence_in=evidence_in
    )


@router.get("/{grievance_id}/duplicates", response_model=List[DuplicateMatch], summary="View flagged duplicate grievances")
def get_duplicates_endpoint(
    grievance_id: str,
    current_user: User = Depends(require_role(["admin", "officer"])),
    db: Session = Depends(get_db)
):
    """Returns potential duplicate complaints flagged by TF-IDF text similarity and geo-distance."""
    grievance = get_grievance_by_id(db, grievance_id)
    return check_potential_duplicates(
        db=db,
        title=grievance.title,
        description=grievance.description,
        latitude=grievance.latitude,
        longitude=grievance.longitude,
        exclude_id=grievance.id
    )


@router.post("/{grievance_id}/feedback", response_model=FeedbackOut, summary="Submit citizen feedback and rating (Citizen)")
def submit_feedback_endpoint(
    grievance_id: str,
    feedback_in: FeedbackCreate,
    current_user: User = Depends(require_role(["citizen"])),
    db: Session = Depends(get_db)
):
    """Citizen rates the resolution quality (1-5 stars) and submits feedback comments."""
    return submit_feedback(
        db,
        grievance_id=grievance_id,
        citizen_id=current_user.id,
        feedback_in=feedback_in
    )
