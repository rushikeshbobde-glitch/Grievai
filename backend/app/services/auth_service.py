from datetime import timedelta
from typing import Optional, List
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token, decode_access_token
from app.models.all_models import User, Officer, Department
from app.schemas.all_schemas import UserCreate, UserLogin, TokenResponse, UserOut

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")


def register_user(db: Session, user_in: UserCreate) -> User:
    """Registers a new citizen, officer, or admin."""
    existing = db.query(User).filter(User.email == user_in.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )

    user = User(
        name=user_in.name,
        email=user_in.email.lower(),
        password_hash=get_password_hash(user_in.password),
        role=user_in.role,
        phone=user_in.phone
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # If user is an officer, link to officer table
    if user_in.role == "officer":
        dept = None
        if user_in.department_id:
            dept = db.query(Department).filter(Department.id == user_in.department_id).first()
        if not dept:
            dept = db.query(Department).first()

        if dept:
            officer = Officer(
                user_id=user.id,
                department_id=dept.id,
                badge_number=f"OFF-{user.id[:6].upper()}",
                designation=user_in.designation or "Field Resolution Officer",
                is_available=True
            )
            db.add(officer)
            db.commit()

    return user


def authenticate_user(db: Session, credentials: UserLogin) -> TokenResponse:
    """Authenticates user credentials and returns JWT token."""
    user = db.query(User).filter(User.email == credentials.email.lower()).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    if not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    access_token = create_access_token(
        data={"sub": user.id, "email": user.email, "role": user.role}
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserOut.model_validate(user)
    )


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    """Dependency that extracts and validates the currently logged-in user."""
    payload = decode_access_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token."
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User account not found."
        )

    return user


def require_role(allowed_roles: List[str]):
    """Role-based authorization dependency factory."""
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: requires one of roles: {', '.join(allowed_roles)}"
            )
        return current_user
    return role_checker
