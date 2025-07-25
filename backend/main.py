from fastapi import FastAPI, HTTPException, Depends, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import uvicorn
import os
from typing import List, Optional
import json

from database import get_db, engine
from models import Base, User, ChatSession, Message
from services.llm_service import LLMService
from schemas import (
    UserCreate, UserResponse, 
    SessionCreate, SessionResponse,
    MessageCreate, MessageResponse,
    IngredientAnalysisResponse,
    ChatRequest, ChatStreamResponse
)

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Recipe GPT Backend",
    description="FastAPI backend for Recipe GPT with LLM calls and database storage",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize LLM service
llm_service = LLMService()

@app.get("/")
async def root():
    return {"message": "Recipe GPT Backend is running!"}

@app.post("/users/", response_model=UserResponse)
async def create_user(user: UserCreate, db: Session = Depends(get_db)):
    """Create a new user"""
    # Check if user already exists
    existing_user = db.query(User).filter(User.device_id == user.device_id).first()
    if existing_user:
        return existing_user
    
    db_user = User(**user.dict())
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: int, db: Session = Depends(get_db)):
    """Get user by ID"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.post("/sessions/", response_model=SessionResponse)
async def create_session(session: SessionCreate, db: Session = Depends(get_db)):
    """Create a new chat session"""
    # Verify user exists
    user = db.query(User).filter(User.id == session.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db_session = ChatSession(**session.dict())
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session

@app.get("/sessions/{session_id}", response_model=SessionResponse)
async def get_session(session_id: int, db: Session = Depends(get_db)):
    """Get session by ID"""
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session

@app.get("/users/{user_id}/sessions", response_model=List[SessionResponse])
async def get_user_sessions(user_id: int, db: Session = Depends(get_db)):
    """Get all sessions for a user"""
    sessions = db.query(ChatSession).filter(ChatSession.user_id == user_id).order_by(ChatSession.created_at.desc()).all()
    return sessions

@app.post("/analyze-images/stream")
async def analyze_images_stream(
    files: List[UploadFile] = File(...),
    user_id: int = Form(...),
    db: Session = Depends(get_db)
):
    """Analyze images to extract ingredients with streaming progress"""
    try:
        # Verify user exists
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Validate files
        if len(files) == 0:
            raise HTTPException(status_code=400, detail="No images provided")
        if len(files) > 3:
            raise HTTPException(status_code=400, detail="Maximum 3 images allowed")
        
        async def generate_analysis_stream():
            try:
                # Send initial progress
                yield f"data: {json.dumps({'progress': '📦 Preparing images for analysis...', 'stage': 'preparing'})}\n\n"
                # Process images with streaming progress
                async for update in llm_service.analyze_images_stream(files):
                    yield f"data: {json.dumps(update)}\n\n"
                
            except Exception as e:
                yield f"data: {json.dumps({'error': str(e)})}\n\n"
        
        return StreamingResponse(
            generate_analysis_stream(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Access-Control-Allow-Origin": "*",
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze-images", response_model=IngredientAnalysisResponse)
async def analyze_images(
    files: List[UploadFile] = File(...),
    user_id: int = Form(...),
    db: Session = Depends(get_db)
):
    """Analyze images to extract ingredients (non-streaming fallback)"""
    try:
        # Verify user exists
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Validate files
        if len(files) == 0:
            raise HTTPException(status_code=400, detail="No images provided")
        if len(files) > 3:
            raise HTTPException(status_code=400, detail="Maximum 3 images allowed")
        
        # Process images with LLM
        ingredients = await llm_service.analyze_images(files)
        
        return IngredientAnalysisResponse(
            success=True,
            ingredients=ingredients,
            message=f"Found {len(ingredients)} ingredients"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat")
async def chat(request: ChatRequest, db: Session = Depends(get_db)):
    """Generate chat response (non-streaming)"""
    try:
        # Verify session exists
        session = db.query(ChatSession).filter(ChatSession.id == request.session_id).first()
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Save user message
        user_message = Message(
            session_id=request.session_id,
            content=request.message,
            is_ai=False,
            message_type="text"
        )
        db.add(user_message)
        db.commit()
        
        # Generate AI response
        ai_response = await llm_service.generate_chat_response(
            request.message,
            request.context,
            request.ingredients
        )
        
        # Save AI message
        ai_message = Message(
            session_id=request.session_id,
            content=ai_response,
            is_ai=True,
            message_type="text"
        )
        db.add(ai_message)
        db.commit()
        
        return {
            "success": True,
            "response": ai_response,
            "user_message_id": user_message.id,
            "ai_message_id": ai_message.id
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat/stream")
async def chat_stream(request: ChatRequest, db: Session = Depends(get_db)):
    """Generate streaming chat response"""
    try:
        # Verify session exists
        session = db.query(ChatSession).filter(ChatSession.id == request.session_id).first()
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Save user message
        user_message = Message(
            session_id=request.session_id,
            content=request.message,
            is_ai=False,
            message_type="text"
        )
        db.add(user_message)
        db.commit()
        
        async def generate_stream():
            full_response = ""
            async for chunk in llm_service.generate_chat_response_stream(
                request.message,
                request.context,
                request.ingredients
            ):
                full_response += chunk
                yield f"data: {json.dumps({'chunk': chunk, 'full_response': full_response})}\n\n"
            
            # Save complete AI message
            ai_message = Message(
                session_id=request.session_id,
                content=full_response,
                is_ai=True,
                message_type="text"
            )
            db.add(ai_message)
            db.commit()
            
            yield f"data: {json.dumps({'done': True, 'message_id': ai_message.id})}\n\n"
        
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

@app.get("/sessions/{session_id}/messages", response_model=List[MessageResponse])
async def get_session_messages(session_id: int, db: Session = Depends(get_db)):
    """Get all messages for a session"""
    messages = db.query(Message).filter(Message.session_id == session_id).order_by(Message.created_at.asc()).all()
    return messages

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000) 