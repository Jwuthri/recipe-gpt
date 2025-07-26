"""User-related Pydantic schemas."""

from typing import Optional
from pydantic import Field, EmailStr

from .base import BaseSchema, ResponseSchema


class UserCreate(BaseSchema):
    """Schema for creating a new user."""
    
    device_id: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="Unique device identifier"
    )
    username: Optional[str] = Field(
        None,
        min_length=1,
        max_length=100,
        description="Optional username"
    )
    email: Optional[EmailStr] = Field(
        None,
        description="Optional email address"
    )


class UserResponse(ResponseSchema):
    """Schema for user response."""
    
    device_id: str
    username: Optional[str] = None
    email: Optional[str] = None 