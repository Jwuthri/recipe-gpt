"""User model for the Recipe GPT application."""

from typing import List, Optional, TYPE_CHECKING
from sqlalchemy import String
from sqlalchemy.orm import relationship, Mapped, mapped_column

from .base import BaseModel

if TYPE_CHECKING:
    from .chat_session import ChatSession


class User(BaseModel):
    """User model representing app users."""
    
    __tablename__ = "users"
    
    device_id: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    username: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    # Relationships
    sessions: Mapped[List["ChatSession"]] = relationship("ChatSession", back_populates="user", cascade="all, delete-orphan")
    
    def __repr__(self) -> str:
        return f"<User(id={self.id}, device_id='{self.device_id}', username='{self.username}')>" 