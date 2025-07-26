"""Service for managing chat sessions."""

from typing import List, Optional
from sqlalchemy.orm import Session

from src.models import ChatSession, User
from src.schemas.chat_session import SessionCreate
from .base import BaseService
from .conversation_service import ConversationService


class SessionService(BaseService):
    """Service for managing chat sessions."""
    
    def __init__(self, db: Session):
        super().__init__(db)
        self.conversation_service = ConversationService(db)
    
    def create_session_with_system_message(self, session_data: SessionCreate) -> ChatSession:
        """Create a new session with initial system message."""
        # Verify user exists
        user = self.get_by_id_or_404(User, session_data.user_id)
        
        # Create session
        session = self.create(
            ChatSession,
            user_id=session_data.user_id,
            title=session_data.title,
            session_type=session_data.session_type
        )
        
        # Create initial system message
        self.conversation_service.create_system_message(session.id)
        
        return session
    
    def get_user_sessions(self, user_id: int) -> List[ChatSession]:
        """Get all sessions for a user."""
        return self.db.query(ChatSession).filter(
            ChatSession.user_id == user_id
        ).order_by(ChatSession.created_at.desc()).all()
    
    def get_session_with_messages(self, session_id: int) -> ChatSession:
        """Get session with all messages loaded."""
        session = self.get_by_id_or_404(ChatSession, session_id)
        # Messages are loaded via relationship
        return session 