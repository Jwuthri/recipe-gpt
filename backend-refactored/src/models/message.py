"""Message model for the Recipe GPT application."""

import json
from enum import Enum
from typing import List, Dict, Any, Optional, TYPE_CHECKING
from sqlalchemy import String, Text, Integer, ForeignKey, JSON
from sqlalchemy.orm import relationship, Mapped, mapped_column

from .base import BaseModel

if TYPE_CHECKING:
    from .chat_session import ChatSession


class MessageRole(str, Enum):
    """Enumeration for message roles."""
    SYSTEM = "system"
    USER = "user"
    ASSISTANT = "assistant"


class MessageType(str, Enum):
    """Enumeration for message types."""
    TEXT = "text"
    IMAGE = "image"


class Message(BaseModel):
    """Message model representing individual conversation turns."""
    
    __tablename__ = "messages"
    
    session_id: Mapped[int] = mapped_column(ForeignKey("chat_sessions.id"), nullable=False, index=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    role: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    message_type: Mapped[str] = mapped_column(String(20), default=MessageType.TEXT.value, nullable=False)
    message_metadata: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    
    # Relationships
    session: Mapped["ChatSession"] = relationship("ChatSession", back_populates="messages")
    
    @property
    def is_system_message(self) -> bool:
        """Check if this is a system message."""
        return self.role == MessageRole.SYSTEM.value
    
    @property
    def is_user_message(self) -> bool:
        """Check if this is a user message."""
        return self.role == MessageRole.USER.value
    
    @property
    def is_assistant_message(self) -> bool:
        """Check if this is an assistant message."""
        return self.role == MessageRole.ASSISTANT.value
    
    @property
    def has_images(self) -> bool:
        """Check if this message contains images."""
        return (
            self.message_type == MessageType.IMAGE.value and
            self.message_metadata is not None and
            "images" in self.message_metadata
        )
    
    def get_images(self) -> List[Dict[str, Any]]:
        """Get images from message metadata."""
        if self.has_images:
            return self.message_metadata.get("images", [])
        return []
    
    def add_image(self, image_data: str, content_type: str = "image/jpeg") -> None:
        """Add an image to this message."""
        if self.message_metadata is None:
            self.message_metadata = {}
        
        if "images" not in self.message_metadata:
            self.message_metadata["images"] = []
        
        self.message_metadata["images"].append({
            "data": image_data,
            "content_type": content_type
        })
        
        self.message_type = MessageType.IMAGE.value
    
    def __repr__(self) -> str:
        content_preview = self.content[:50] + "..." if len(self.content) > 50 else self.content
        return f"<Message(id={self.id}, session_id={self.session_id}, role='{self.role}', content='{content_preview}')>" 