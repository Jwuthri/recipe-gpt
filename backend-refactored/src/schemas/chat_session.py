"""Chat session-related Pydantic schemas."""

from typing import Optional
from pydantic import Field

from .base import BaseSchema, ResponseSchema


class SessionCreate(BaseSchema):
    """Schema for creating a new chat session."""
    
    user_id: int = Field(
        ...,
        gt=0,
        description="ID of the user creating the session"
    )
    title: Optional[str] = Field(
        None,
        min_length=1,
        max_length=200,
        description="Optional session title"
    )
    session_type: str = Field(
        default="chat",
        description="Type of session"
    )


class SessionResponse(ResponseSchema):
    """Schema for chat session response."""
    
    user_id: int
    title: Optional[str] = None
    session_type: str 