"""User management routes."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from src.core.database import get_db
from src.schemas.user import UserCreate, UserResponse
from src.services.user_service import UserService

router = APIRouter()


@router.post("/users/", response_model=UserResponse)
async def create_user(user: UserCreate, db: Session = Depends(get_db)):
    """Create a new user or return existing one."""
    user_service = UserService(db)
    return user_service.create_or_get_user(user)


@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: int, db: Session = Depends(get_db)):
    """Get user by ID."""
    user_service = UserService(db)
    from src.models import User
    return user_service.get_by_id_or_404(User, user_id) 