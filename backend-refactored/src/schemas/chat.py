"""Chat-related Pydantic schemas."""

from typing import List, Optional
from pydantic import Field

from .base import BaseSchema
from .ingredient import Ingredient


class ChatRequest(BaseSchema):
    """Schema for chat request."""
    
    session_id: int = Field(
        ...,
        gt=0,
        description="ID of the chat session"
    )
    message: str = Field(
        ...,
        min_length=1,
        max_length=5000,
        description="User message"
    )
    ingredients: Optional[List[Ingredient]] = Field(
        None,
        description="Optional list of ingredients"
    )


class ChatStreamResponse(BaseSchema):
    """Schema for streaming chat response."""
    
    chunk: Optional[str] = Field(
        None,
        description="Response chunk"
    )
    full_response: Optional[str] = Field(
        None,
        description="Full response text"
    )
    done: bool = Field(
        default=False,
        description="Whether streaming is complete"
    )
    message_id: Optional[int] = Field(
        None,
        description="ID of the saved message"
    ) 