"""API routes for chat interactions."""

import asyncio
import json
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from src.core.database import get_db
from src.schemas.chat import ChatRequest, ChatStreamResponse
from src.schemas.message import MessageResponse
from src.services.conversation_service import ConversationService

router = APIRouter()


@router.post("/chat", response_model=dict)
async def chat(
    request: ChatRequest,
    db: Session = Depends(get_db)
):
    """Send a chat message and get response."""
    try:
        conversation_service = ConversationService(db)
        user_msg, assistant_msg = await conversation_service.handle_chat_message(
            request.session_id, request.message, request.ingredients
        )
        
        return {
            "success": True,
            "response": assistant_msg.content,
            "user_message_id": user_msg.id,
            "ai_message_id": assistant_msg.id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/chat/stream")
async def chat_stream(
    request: ChatRequest,
    db: Session = Depends(get_db)
):
    """Send a chat message and get streaming response."""
    try:
        conversation_service = ConversationService(db)
        
        async def generate_stream():
            async for chunk_data in conversation_service.handle_streaming_chat(
                request.session_id, request.message, request.ingredients
            ):
                # chunk_data is already a dict from the service
                yield f"data: {json.dumps(chunk_data)}\n\n"
        
        return StreamingResponse(
            generate_stream(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Access-Control-Allow-Origin": "*",
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 