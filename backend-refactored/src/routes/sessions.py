"""Chat session management routes."""

from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from src.core.database import get_db
from src.schemas.chat_session import SessionCreate, SessionResponse
from src.services.session_service import SessionService

router = APIRouter()


@router.post("/sessions/", response_model=SessionResponse)
async def create_session(session: SessionCreate, db: Session = Depends(get_db)):
    """Create a new chat session with system message."""
    session_service = SessionService(db)
    return session_service.create_session_with_system_message(session)


@router.get("/sessions/{session_id}", response_model=SessionResponse)
async def get_session(session_id: int, db: Session = Depends(get_db)):
    """Get session by ID."""
    session_service = SessionService(db)
    return session_service.get_session_with_messages(session_id)


@router.get("/users/{user_id}/sessions/", response_model=List[SessionResponse])
async def get_user_sessions(user_id: int, db: Session = Depends(get_db)):
    """Get all sessions for a user."""
    session_service = SessionService(db)
    return session_service.get_user_sessions(user_id) 