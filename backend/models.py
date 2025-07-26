from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, nullable=True)
    email = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    sessions = relationship("ChatSession", back_populates="user")

class ChatSession(Base):
    __tablename__ = "chat_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=True)
    session_type = Column(String, default="chat")  # chat, recipe_generation, image_analysis
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="sessions")
    messages = relationship("Message", back_populates="session")

class Message(Base):
    __tablename__ = "messages"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("chat_sessions.id"), nullable=False)
    content = Column(Text, nullable=False)
    role = Column(String, nullable=False)  # system, user, assistant
    message_type = Column(String, default="text")  # text, image, recipe, ingredients
    meta = Column(JSON, nullable=True)  # Store additional data like ingredients, cooking time, etc.
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    session = relationship("ChatSession", back_populates="messages")