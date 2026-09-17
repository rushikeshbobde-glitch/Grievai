from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.all_schemas import UserCreate, UserLogin, TokenResponse, UserOut
from app.services.auth_service import register_user, authenticate_user, get_current_user
from app.models.all_models import User

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED, summary="Register a new user (Citizen, Officer, Admin)")
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    """Registers a new account with hashed password and role assignment."""
    user = register_user(db, user_in)
    return user


@router.post("/login", response_model=TokenResponse, summary="Login with email and password")
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """Authenticates credentials and returns signed JWT bearer access token."""
    return authenticate_user(db, credentials)


@router.get("/me", response_model=UserOut, summary="Get current logged-in user profile")
def get_me(current_user: User = Depends(get_current_user)):
    """Returns the authenticated user profile."""
    return current_user
