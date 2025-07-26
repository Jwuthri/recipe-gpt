"""Service for managing conversations and messages."""

import asyncio
import base64
from typing import List, Optional, Dict, Any, Tuple
from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session

from src.models.user import User
from src.models.chat_session import ChatSession
from src.models.message import Message, MessageRole, MessageType
from src.schemas.ingredient import Ingredient, IngredientAnalysisResponse
from .base import BaseService
from .llm_service import LLMService


class ConversationService(BaseService):
    """Service for managing conversations and messages."""
    
    def __init__(self, db: Session):
        super().__init__(db)
        self.llm_service = LLMService(db)
    
    def create_system_message(self, session_id: int) -> Message:
        """Create an initial system message for a session."""
        try:
            # Get system prompt from LLM service
            system_prompt = self.llm_service.get_system_prompt()
            
            # Create system message
            system_message = Message(
                session_id=session_id,
                content=system_prompt,
                role=MessageRole.SYSTEM.value,
                message_type=MessageType.TEXT.value
            )
            
            self.db.add(system_message)
            self.commit()
            
            return system_message
            
        except Exception as e:
            self.rollback()
            raise HTTPException(status_code=500, detail=f"Error creating system message: {str(e)}")
    
    def create_user_message(
        self,
        session_id: int,
        content: str,
        message_type: MessageType = MessageType.TEXT,
        images: Optional[List[Dict[str, Any]]] = None
    ) -> Message:
        """Create a user message."""
        try:
            message_metadata = None
            if images:
                message_metadata = {"images": images}
            
            user_message = Message(
                session_id=session_id,
                content=content,
                role=MessageRole.USER.value,
                message_type=message_type.value,
                message_metadata=message_metadata
            )
            
            self.db.add(user_message)
            self.commit()
            
            return user_message
            
        except Exception as e:
            self.rollback()
            raise HTTPException(status_code=500, detail=f"Error creating user message: {str(e)}")
    
    def create_assistant_message(self, session_id: int, content: str) -> Message:
        """Create an assistant message."""
        try:
            assistant_message = Message(
                session_id=session_id,
                content=content,
                role=MessageRole.ASSISTANT.value,
                message_type=MessageType.TEXT.value
            )
            
            self.db.add(assistant_message)
            self.commit()
            
            return assistant_message
            
        except Exception as e:
            self.rollback()
            raise HTTPException(status_code=500, detail=f"Error creating assistant message: {str(e)}")
    
    def get_session_messages(self, session_id: int) -> List[Message]:
        """Get all messages for a session."""
        return self.db.query(Message).filter(
            Message.session_id == session_id
        ).order_by(Message.created_at).all()
    
    async def handle_chat_message(
        self,
        session_id: int,
        user_message: str,
        ingredients: Optional[List[Ingredient]] = None
    ) -> Tuple[Message, Message]:
        """Handle a complete chat interaction."""
        try:
            # Verify session exists
            session = self.get_by_id(ChatSession, session_id)
            if not session:
                raise HTTPException(status_code=404, detail="Session not found")
            
            # Create user message
            user_msg = self.create_user_message(session_id, user_message)
            
            # Generate AI response - let HTTPExceptions propagate
            ai_response = await self.llm_service.generate_chat_response(
                session_id, user_message, ingredients
            )
            
            # Create assistant message
            assistant_msg = self.create_assistant_message(session_id, ai_response)
            
            return user_msg, assistant_msg
            
        except HTTPException:
            # Re-raise HTTPExceptions without modification
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error handling chat message: {str(e)}")
    
    async def handle_image_analysis(
        self,
        session_id: int,
        files: List[UploadFile]
    ) -> Tuple[Message, Message, IngredientAnalysisResponse]:
        """Handle image analysis request."""
        try:
            # Verify session exists
            session = self.get_by_id(ChatSession, session_id)
            if not session:
                raise HTTPException(status_code=404, detail="Session not found")
            
            # Convert uploaded files to base64
            images = []
            for file in files:
                content = await file.read()
                image_data = base64.b64encode(content).decode('utf-8')
                images.append({
                    "data": image_data,
                    "content_type": file.content_type or "image/jpeg",
                    "filename": file.filename
                })
            breakpoint()
            # Create user message with images
            user_msg = self.create_user_message(
                session_id=session_id,
                content=f"Please analyze these {len(files)} image(s) of my fridge/pantry and identify the ingredients.",
                message_type=MessageType.IMAGE,
                images=images
            )
            
            # Analyze images - let HTTPExceptions propagate
            ai_response, ingredients = await self.llm_service.analyze_images(session_id, files)
            
            # Create assistant message
            assistant_msg = self.create_assistant_message(session_id, ai_response)
            
            # Create response
            analysis_response = IngredientAnalysisResponse(
                success=True,
                message=ai_response,
                ingredients=ingredients,
                user_message_id=user_msg.id,
                ai_message_id=assistant_msg.id
            )
            
            return user_msg, assistant_msg, analysis_response
            
        except HTTPException:
            # Re-raise HTTPExceptions without modification
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error handling image analysis: {str(e)}")
    
    async def handle_streaming_chat(
        self,
        session_id: int,
        user_message: str,
        ingredients: Optional[List[Ingredient]] = None
    ):
        """Handle streaming chat interaction."""
        try:
            # Verify session exists
            session = self.get_by_id(ChatSession, session_id)
            if not session:
                raise HTTPException(status_code=404, detail="Session not found")
            
            # Create user message
            user_msg = self.create_user_message(session_id, user_message)
            
            # Start streaming response
            full_response = ""
            async for chunk in self.llm_service.generate_chat_response_stream(
                session_id, user_message, ingredients
            ):
                full_response += chunk
                yield {
                    "chunk": chunk,
                    "done": False,
                    "user_message_id": user_msg.id
                }
            
            # Create assistant message with full response
            assistant_msg = self.create_assistant_message(session_id, full_response)
            
            # Send final completion message
            yield {
                "chunk": "",
                "done": True,
                "user_message_id": user_msg.id,
                "message_id": assistant_msg.id,
                "full_response": full_response
            }
            
        except HTTPException:
            # Re-raise HTTPExceptions without modification
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error handling streaming chat: {str(e)}") 