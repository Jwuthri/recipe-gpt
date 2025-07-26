"""Service for managing users."""

from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from src.models import User
from src.schemas.user import UserCreate
from .base import BaseService


class UserService(BaseService):
    """Service for managing users."""
    
    def get_by_device_id(self, device_id: str) -> Optional[User]:
        """Get user by device ID."""
        return self.db.query(User).filter(User.device_id == device_id).first()
    
    def create_or_get_user(self, user_data: UserCreate) -> User:
        """Create a new user or return existing one."""
        # Check if user already exists
        existing_user = self.get_by_device_id(user_data.device_id)
        if existing_user:
            return existing_user
        
        # Create new user
        return self.create(
            User,
            device_id=user_data.device_id,
            username=user_data.username,
            email=user_data.email
        )
    
    def update_user(self, user_id: int, **kwargs) -> User:
        """Update user information."""
        user = self.get_by_id_or_404(User, user_id)
        return self.update(user, **kwargs) 