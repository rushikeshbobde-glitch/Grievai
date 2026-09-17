from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.all_models import Department, Officer, User
from app.schemas.all_schemas import DepartmentOut, DepartmentCreate, OfficerOut
from app.services.auth_service import get_current_user, require_role

router = APIRouter(prefix="/departments", tags=["Departments & Officers"])


@router.get("", response_model=List[DepartmentOut], summary="List all municipal departments")
def list_departments(db: Session = Depends(get_db)):
    """Retrieves all registered government departments."""
    return db.query(Department).order_by(Department.name.asc()).all()


@router.post("", response_model=DepartmentOut, status_code=status.HTTP_201_CREATED, summary="Create a new department (Admin)")
def create_department(
    dept_in: DepartmentCreate,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """Creates a new civic department record."""
    existing = db.query(Department).filter(Department.code == dept_in.code.upper()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Department with this code already exists.")
    
    dept = Department(
        name=dept_in.name,
        code=dept_in.code.upper(),
        description=dept_in.description,
        contact_email=dept_in.contact_email,
        contact_phone=dept_in.contact_phone
    )
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return dept


@router.get("/officers", response_model=List[OfficerOut], summary="List field resolution officers")
def list_officers(
    department_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves all registered officers, optionally filtered by department."""
    query = db.query(Officer)
    if department_id:
        query = query.filter(Officer.department_id == department_id)
    return query.all()
