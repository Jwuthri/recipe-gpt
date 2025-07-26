"""Pydantic schemas for message data validation."""

from typing import Optional, Dict, Any
from pydantic import Field

from .base import ResponseSchema, BaseSchema
from src.models.message import MessageRole, MessageType


class MessageCreate(BaseSchema):
    """Schema for creating a new message."""
    
    session_id: int = Field(..., description="ID of the session this message belongs to")
    content: str = Field(..., description="Message content")
    role: MessageRole = Field(..., description="Message role (system, user, assistant)")
    message_type: MessageType = Field(default=MessageType.TEXT, description="Type of message")
    message_metadata: Optional[Dict[str, Any]] = Field(default=None, description="Additional message metadata")


class MessageResponse(ResponseSchema):
    """Schema for message responses."""
    
    session_id: int
    content: str
    role: MessageRole
    message_type: MessageType
    message_metadata: Optional[Dict[str, Any]] = None 