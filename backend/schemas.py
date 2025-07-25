from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

# User schemas
class UserCreate(BaseModel):
    device_id: str
    username: Optional[str] = None
    email: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    device_id: str
    username: Optional[str]
    email: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

# Session schemas
class SessionCreate(BaseModel):
    user_id: int
    title: Optional[str] = None
    ingredients: Optional[List[Dict[str, Any]]] = None
    session_type: str = "chat"

class SessionResponse(BaseModel):
    id: int
    user_id: int
    title: Optional[str]
    ingredients: Optional[List[Dict[str, Any]]]
    session_type: str
    created_at: datetime
    
    class Config:
        from_attributes = True

# Message schemas
class MessageCreate(BaseModel):
    session_id: int
    content: str
    is_ai: bool = False
    message_type: str = "text"
    metadata: Optional[Dict[str, Any]] = None

class MessageResponse(BaseModel):
    id: int
    session_id: int
    content: str
    is_ai: bool
    message_type: str
    metadata: Optional[Dict[str, Any]]
    created_at: datetime
    
    class Config:
        from_attributes = True

# Ingredient schemas
class Ingredient(BaseModel):
    name: str
    quantity: str
    unit: str

class IngredientAnalysisResponse(BaseModel):
    success: bool
    ingredients: List[Ingredient]
    message: str

# Chat schemas
class ChatRequest(BaseModel):
    session_id: int
    message: str
    context: Optional[str] = None
    ingredients: Optional[List[Ingredient]] = None

class ChatStreamResponse(BaseModel):
    chunk: Optional[str] = None
    full_response: Optional[str] = None
    done: bool = False
    message_id: Optional[int] = None 