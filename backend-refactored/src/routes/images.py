"""API routes for image analysis."""

from typing import List
from fastapi import APIRouter, Depends, UploadFile, File, Form
from sqlalchemy.orm import Session

from src.core.database import get_db
from src.schemas.ingredient import IngredientAnalysisResponse
from src.services.conversation_service import ConversationService

router = APIRouter()


@router.post("/analyze-images", response_model=IngredientAnalysisResponse)
async def analyze_images(
    files: List[UploadFile] = File(...),
    session_id: int = Form(...),
    db: Session = Depends(get_db)
):
    """Analyze images to extract ingredients."""
    conversation_service = ConversationService(db)
    
    user_msg, assistant_msg, analysis_response = await conversation_service.handle_image_analysis(session_id, files)
    
    return analysis_response 