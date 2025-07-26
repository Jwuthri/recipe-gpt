"""Chat session model for the Recipe GPT application."""

from typing import List, Optional, TYPE_CHECKING
from sqlalchemy import String, Integer, ForeignKey
from sqlalchemy.orm import relationship, Mapped, mapped_column

from .base import BaseModel

if TYPE_CHECKING:
    from .user import User
    from .message import Message


class ChatSession(BaseModel):
    """Chat session model representing conversation containers."""
    
    __tablename__ = "chat_sessions"
    
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    title: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    session_type: Mapped[str] = mapped_column(String(50), default="chat", nullable=False)
    
    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="sessions")
    messages: Mapped[List["Message"]] = relationship("Message", back_populates="session", cascade="all, delete-orphan", order_by="Message.created_at")
    
    def get_messages_count(self) -> int:
        """Get the number of messages in this session."""
        return len(self.messages)
    
    def get_latest_message(self) -> Optional["Message"]:
        """Get the most recent message in this session."""
        if self.messages:
            return self.messages[-1]
        return None
    
    def __repr__(self) -> str:
        return f"<ChatSession(id={self.id}, user_id={self.user_id}, title='{self.title}')>" 