import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Text, Boolean, Float, Integer, DateTime, ForeignKey, JSON
)
from sqlalchemy.orm import relationship
from app.core.database import Base


def generate_uuid():
    return str(uuid.uuid4())


def get_utc_now():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="citizen", index=True)  # citizen, admin, officer
    phone = Column(String(50), nullable=True)
    avatar_url = Column(Text, nullable=True)
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)

    # Relationships
    grievances = relationship("Grievance", back_populates="citizen", foreign_keys="Grievance.citizen_id", cascade="all, delete-orphan")
    officer_profile = relationship("Officer", back_populates="user", uselist=False, cascade="all, delete-orphan")
    feedbacks = relationship("Feedback", back_populates="citizen", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")


class Department(Base):
    __tablename__ = "departments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), unique=True, nullable=False)
    code = Column(String(50), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    contact_email = Column(String(255), nullable=True)
    contact_phone = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=get_utc_now)

    # Relationships
    officers = relationship("Officer", back_populates="department")
    grievances = relationship("Grievance", back_populates="department", foreign_keys="Grievance.department_id")


class Officer(Base):
    __tablename__ = "officers"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    department_id = Column(String(36), ForeignKey("departments.id", ondelete="RESTRICT"), nullable=False)
    badge_number = Column(String(100), unique=True, nullable=True)
    designation = Column(String(255), default="Field Resolution Officer")
    is_available = Column(Boolean, default=True)
    created_at = Column(DateTime, default=get_utc_now)

    # Relationships
    user = relationship("User", back_populates="officer_profile")
    department = relationship("Department", back_populates="officers")
    assigned_grievances = relationship("Grievance", back_populates="assigned_officer", foreign_keys="Grievance.assigned_officer_id")


class Grievance(Base):
    __tablename__ = "grievances"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    citizen_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)

    # Category & Priority
    category = Column(String(100), nullable=False, default="Other", index=True)
    ai_category = Column(String(100), nullable=True)
    priority = Column(String(50), nullable=False, default="Medium", index=True)  # Low, Medium, High
    ai_priority = Column(String(50), nullable=True)
    priority_reason = Column(Text, nullable=True)

    # Sentiment
    sentiment = Column(String(50), default="Neutral")  # Positive, Neutral, Negative
    sentiment_score = Column(Float, default=0.0)

    # Routing
    department_id = Column(String(36), ForeignKey("departments.id", ondelete="SET NULL"), nullable=True, index=True)
    ai_department_id = Column(String(36), ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)
    assigned_officer_id = Column(String(36), ForeignKey("officers.id", ondelete="SET NULL"), nullable=True, index=True)

    # Explainable AI Insights
    ai_summary = Column(Text, nullable=True)
    ai_recommendation = Column(Text, nullable=True)
    ai_confidence = Column(Float, default=0.0)
    ai_keywords = Column(JSON, default=list)

    # Status
    status = Column(String(50), nullable=False, default="Submitted", index=True)  # Submitted, Assigned, In Progress, Resolved, Rejected

    # Location
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    address = Column(Text, nullable=True)

    # Duplicates
    is_duplicate = Column(Boolean, default=False)
    duplicate_of_id = Column(String(36), ForeignKey("grievances.id", ondelete="SET NULL"), nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=get_utc_now, index=True)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)

    # Relationships
    citizen = relationship("User", back_populates="grievances", foreign_keys=[citizen_id])
    department = relationship("Department", back_populates="grievances", foreign_keys=[department_id])
    assigned_officer = relationship("Officer", back_populates="assigned_grievances", foreign_keys=[assigned_officer_id])
    attachments = relationship("GrievanceAttachment", back_populates="grievance", cascade="all, delete-orphan")
    status_history = relationship("GrievanceStatusHistory", back_populates="grievance", cascade="all, delete-orphan", order_by="GrievanceStatusHistory.created_at")
    resolution_evidence = relationship("ResolutionEvidence", back_populates="grievance", uselist=False, cascade="all, delete-orphan")
    feedback = relationship("Feedback", back_populates="grievance", uselist=False, cascade="all, delete-orphan")
    duplicate_links = relationship("DuplicateLink", back_populates="grievance", foreign_keys="DuplicateLink.grievance_id", cascade="all, delete-orphan")


class GrievanceAttachment(Base):
    __tablename__ = "grievance_attachments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    grievance_id = Column(String(36), ForeignKey("grievances.id", ondelete="CASCADE"), nullable=False, index=True)
    file_url = Column(Text, nullable=False)
    file_name = Column(String(255), nullable=False)
    file_type = Column(String(100), nullable=True)
    file_size = Column(Integer, nullable=True)
    uploaded_by = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=get_utc_now)

    # Relationship
    grievance = relationship("Grievance", back_populates="attachments")


class GrievanceStatusHistory(Base):
    __tablename__ = "grievance_status_history"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    grievance_id = Column(String(36), ForeignKey("grievances.id", ondelete="CASCADE"), nullable=False, index=True)
    previous_status = Column(String(50), nullable=True)
    new_status = Column(String(50), nullable=False)
    changed_by = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime, default=get_utc_now)

    # Relationships
    grievance = relationship("Grievance", back_populates="status_history")
    user = relationship("User", foreign_keys=[changed_by])


class ResolutionEvidence(Base):
    __tablename__ = "resolution_evidence"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    grievance_id = Column(String(36), ForeignKey("grievances.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    officer_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    file_url = Column(Text, nullable=False)
    file_name = Column(String(255), nullable=True)
    remarks = Column(Text, nullable=False)
    created_at = Column(DateTime, default=get_utc_now)

    # Relationships
    grievance = relationship("Grievance", back_populates="resolution_evidence")
    officer = relationship("User", foreign_keys=[officer_id])


class DuplicateLink(Base):
    __tablename__ = "duplicate_links"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    grievance_id = Column(String(36), ForeignKey("grievances.id", ondelete="CASCADE"), nullable=False, index=True)
    duplicate_of_grievance_id = Column(String(36), ForeignKey("grievances.id", ondelete="CASCADE"), nullable=False, index=True)
    similarity_score = Column(Float, nullable=False)
    distance_meters = Column(Float, nullable=True)
    status = Column(String(50), default="flagged")  # flagged, merged, dismissed
    created_at = Column(DateTime, default=get_utc_now)

    # Relationships
    grievance = relationship("Grievance", foreign_keys=[grievance_id], back_populates="duplicate_links")
    duplicate_of = relationship("Grievance", foreign_keys=[duplicate_of_grievance_id])


class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    grievance_id = Column(String(36), ForeignKey("grievances.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    citizen_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    rating = Column(Integer, nullable=False)  # 1 to 5
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=get_utc_now)

    # Relationships
    grievance = relationship("Grievance", back_populates="feedback")
    citizen = relationship("User", back_populates="feedbacks")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    link = Column(Text, nullable=True)
    is_read = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime, default=get_utc_now)

    # Relationship
    user = relationship("User", back_populates="notifications")
