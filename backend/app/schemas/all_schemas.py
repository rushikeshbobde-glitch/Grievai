from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, EmailStr, Field


# ==========================================
# AUTH & USER SCHEMAS
# ==========================================
class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: str = "citizen"
    phone: Optional[str] = None
    avatar_url: Optional[str] = None


class UserCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=100)
    role: str = Field(default="citizen", pattern="^(citizen|admin|officer)$")
    phone: Optional[str] = None
    department_id: Optional[str] = None  # If registering an officer
    designation: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    name: str
    email: str
    role: str
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ==========================================
# DEPARTMENT & OFFICER SCHEMAS
# ==========================================
class DepartmentBase(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None


class DepartmentCreate(DepartmentBase):
    pass


class DepartmentOut(DepartmentBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True


class OfficerOut(BaseModel):
    id: str
    user_id: str
    department_id: str
    badge_number: Optional[str] = None
    designation: Optional[str] = None
    is_available: bool
    user: Optional[UserOut] = None
    department: Optional[DepartmentOut] = None

    class Config:
        from_attributes = True


# ==========================================
# AI PIPELINE SCHEMAS
# ==========================================
class AIAnalysisRequest(BaseModel):
    title: str
    description: str
    category: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class AIAnalysisResult(BaseModel):
    category: str
    confidence: float
    priority: str
    priority_score: int
    priority_reason: str
    sentiment: str
    sentiment_score: float
    recommended_department_id: Optional[str] = None
    recommended_department_name: Optional[str] = None
    summary: str
    recommended_action: str
    keywords: List[str] = []


class DuplicateCheckRequest(BaseModel):
    title: str
    description: str
    category: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    exclude_id: Optional[str] = None


class DuplicateMatch(BaseModel):
    grievance_id: str
    title: str
    category: str
    status: str
    similarity_score: float
    distance_meters: Optional[float] = None
    created_at: datetime


# ==========================================
# ATTACHMENT & EVIDENCE SCHEMAS
# ==========================================
class AttachmentOut(BaseModel):
    id: str
    file_url: str
    file_name: str
    file_type: Optional[str] = None
    file_size: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ResolutionEvidenceCreate(BaseModel):
    remarks: str = Field(..., min_length=5)
    file_url: Optional[str] = None
    file_name: Optional[str] = None


class ResolutionEvidenceOut(BaseModel):
    id: str
    grievance_id: str
    officer_id: str
    file_url: str
    file_name: Optional[str] = None
    remarks: str
    created_at: datetime
    officer: Optional[UserOut] = None

    class Config:
        from_attributes = True


# ==========================================
# STATUS HISTORY & FEEDBACK SCHEMAS
# ==========================================
class StatusHistoryOut(BaseModel):
    id: str
    previous_status: Optional[str] = None
    new_status: str
    changed_by: Optional[str] = None
    remarks: Optional[str] = None
    created_at: datetime
    user: Optional[UserOut] = None

    class Config:
        from_attributes = True


class FeedbackCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None


class FeedbackOut(BaseModel):
    id: str
    grievance_id: str
    citizen_id: str
    rating: int
    comment: Optional[str] = None
    created_at: datetime
    citizen: Optional[UserOut] = None

    class Config:
        from_attributes = True


# ==========================================
# GRIEVANCE SCHEMAS
# ==========================================
class GrievanceCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    description: str = Field(..., min_length=10)
    category: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None


class GrievanceAssignRequest(BaseModel):
    department_id: str
    officer_id: Optional[str] = None
    remarks: Optional[str] = "Assigned by administration."


class GrievanceOverrideRequest(BaseModel):
    category: Optional[str] = None
    priority: Optional[str] = None
    department_id: Optional[str] = None
    remarks: Optional[str] = "Classification updated by administration."


class GrievanceStatusUpdateRequest(BaseModel):
    status: str = Field(..., pattern="^(Submitted|Assigned|In Progress|Resolved|Rejected)$")
    remarks: Optional[str] = None


class DuplicateLinkOut(BaseModel):
    id: str
    duplicate_of_grievance_id: str
    similarity_score: float
    distance_meters: Optional[float] = None
    status: str
    created_at: datetime
    duplicate_of: Optional[Any] = None

    class Config:
        from_attributes = True


class GrievanceOut(BaseModel):
    id: str
    citizen_id: str
    title: str
    description: str
    category: str
    ai_category: Optional[str] = None
    priority: str
    ai_priority: Optional[str] = None
    priority_reason: Optional[str] = None
    sentiment: Optional[str] = None
    sentiment_score: Optional[float] = None
    department_id: Optional[str] = None
    ai_department_id: Optional[str] = None
    assigned_officer_id: Optional[str] = None
    ai_summary: Optional[str] = None
    ai_recommendation: Optional[str] = None
    ai_confidence: Optional[float] = None
    ai_keywords: Optional[List[str]] = []
    status: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None
    is_duplicate: bool = False
    duplicate_of_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    # Nested relations
    citizen: Optional[UserOut] = None
    department: Optional[DepartmentOut] = None
    assigned_officer: Optional[OfficerOut] = None

    class Config:
        from_attributes = True


class GrievanceDetailOut(GrievanceOut):
    attachments: List[AttachmentOut] = []
    status_history: List[StatusHistoryOut] = []
    resolution_evidence: Optional[ResolutionEvidenceOut] = None
    feedback: Optional[FeedbackOut] = None
    duplicate_links: List[DuplicateLinkOut] = []


# ==========================================
# NOTIFICATION SCHEMAS
# ==========================================
class NotificationOut(BaseModel):
    id: str
    user_id: str
    title: str
    message: str
    link: Optional[str] = None
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ==========================================
# ANALYTICS SCHEMAS
# ==========================================
class AnalyticsSummaryOut(BaseModel):
    total_grievances: int
    pending_grievances: int
    assigned_grievances: int
    in_progress_grievances: int
    resolved_grievances: int
    high_priority_count: int
    avg_resolution_hours: float
    duplicate_count: int
    categories_breakdown: List[dict]
    priorities_breakdown: List[dict]
    status_breakdown: List[dict]
    department_breakdown: List[dict]
    sentiment_breakdown: List[dict]


class AnalyticsTrendPoint(BaseModel):
    date: str
    submitted: int
    resolved: int


class HeatmapPoint(BaseModel):
    id: str
    title: str
    category: str
    priority: str
    status: str
    latitude: float
    longitude: float
