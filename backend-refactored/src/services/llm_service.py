"""Service for handling LLM interactions."""

import asyncio
import base64
import json
import mimetypes
from typing import List, Dict, Any, Optional, Tuple
from fastapi import HTTPException
from sqlalchemy.orm import Session

from src.core.config import get_settings
from src.models.message import Message, MessageRole, MessageType
from src.schemas.ingredient import Ingredient

# Import Gemini types
try:
    from google import genai
    from google.genai import types
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    genai = None
    types = None


class LLMService:
    """Service for interacting with the Gemini LLM."""
    
    def __init__(self, db: Session):
        self.db = db
        self.settings = get_settings()
        
        if not GEMINI_AVAILABLE:
            raise HTTPException(
                status_code=500, 
                detail="Gemini API library not available. Please install google-genai."
            )
        
        if not self.settings.gemini_api_key:
            raise HTTPException(
                status_code=500,
                detail="GEMINI_API_KEY not configured. Please set the environment variable."
            )
        
        try:
            # Initialize Gemini client
            self.client = genai.Client(api_key=self.settings.gemini_api_key)
            self.model = "gemini-2.0-flash-exp"
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to initialize Gemini client: {str(e)}"
            )
    
    def get_system_prompt(self) -> str:
        """Get the system prompt for the cooking assistant."""
        return """You are a helpful cooking assistant AI. Your role is to:

1. Help users with cooking questions, recipes, and techniques
2. Provide clear, step-by-step cooking instructions
3. Suggest recipes based on available ingredients
4. Give cooking tips and food safety advice
5. Be encouraging and supportive for users of all skill levels

When analyzing images of food or ingredients, describe what you see and suggest recipes.
When given a list of ingredients, suggest creative and practical recipes.
Always prioritize food safety and provide cooking times and temperatures when relevant."""
    
    def get_conversation_messages(self, session_id: int) -> List[Message]:
        """Get all messages for a session ordered by creation time."""
        return (
            self.db.query(Message)
            .filter(Message.session_id == session_id)
            .order_by(Message.created_at)
            .all()
        )
    
    def format_conversation_for_gemini(self, messages: List[Message], current_message: str, ingredients: Optional[List[Ingredient]] = None) -> List:
        """Format conversation history for Gemini API using types.Content."""
        try:
            contents = []
            
            # Handle system message first
            system_messages = [msg for msg in messages if msg.role == MessageRole.SYSTEM.value]
            if system_messages:
                # Add system message as initial user message
                system_content = system_messages[0].content
                contents.append(types.Content(
                    role="user",
                    parts=[types.Part.from_text(text=system_content)]
                ))
                # Add model acknowledgment
                contents.append(types.Content(
                    role="model", 
                    parts=[types.Part.from_text(text="I understand. I'm ready to help you with cooking!")]
                ))
            
            # Add conversation history (excluding system messages)
            conversation_messages = [msg for msg in messages if msg.role != MessageRole.SYSTEM.value]
            
            for message in conversation_messages:
                # Map our roles to Gemini roles
                gemini_role = "user" if message.role == MessageRole.USER.value else "model"
                
                parts = []
                
                # Add text content
                parts.append(types.Part.from_text(text=message.content))
                
                # Add images if present
                if message.has_images:
                    for img in message.get_images():
                        try:
                            image_data = base64.b64decode(img["data"])
                            content_type = img.get("content_type", "image/jpeg")
                            parts.append(types.Part.from_bytes(data=image_data, mime_type=content_type))
                        except Exception as e:
                            print(f"Error processing image: {e}")
                            continue
                
                contents.append(types.Content(role=gemini_role, parts=parts))
            
            # Add current message with ingredients if provided
            current_parts = []
            
            if ingredients:
                ingredient_text = "\n\nI have these ingredients:\n" + "\n".join([
                    f"- {ing.quantity} {ing.unit} {ing.name}" for ing in ingredients
                ])
                current_message = current_message + ingredient_text
            
            current_parts.append(types.Part.from_text(text=current_message))
            contents.append(types.Content(role="user", parts=current_parts))
            
            return contents
            
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error formatting conversation for Gemini: {str(e)}"
            )
    
    async def generate_chat_response(self, session_id: int, message: str, ingredients: Optional[List[Ingredient]] = None) -> str:
        """Generate a chat response using Gemini."""
        try:
            # Get conversation history
            messages = self.get_conversation_messages(session_id)
            
            # Format for Gemini
            contents = self.format_conversation_for_gemini(messages, message, ingredients)
            
            # Generate response
            config = types.GenerateContentConfig(
                temperature=0.7,
                max_output_tokens=1000,
            )
            
            response = await self.client.aio.models.generate_content(
                model=self.model,
                contents=contents,
                config=config
            )
            
            if response and response.candidates:
                return response.candidates[0].content.parts[0].text
            else:
                raise HTTPException(status_code=500, detail="No response generated from LLM")
                
        except Exception as e:
            if "API key" in str(e).lower():
                raise HTTPException(
                    status_code=500,
                    detail="Invalid or missing Gemini API key. Please check your GEMINI_API_KEY environment variable."
                )
            elif "quota" in str(e).lower() or "limit" in str(e).lower():
                raise HTTPException(
                    status_code=429,
                    detail="API quota exceeded. Please try again later."
                )
            else:
                raise HTTPException(
                    status_code=500,
                    detail=f"Error generating chat response: {str(e)}"
                )
    
    async def generate_chat_response_stream(self, session_id: int, message: str, ingredients: Optional[List[Ingredient]] = None):
        """Generate a streaming chat response using Gemini."""
        try:
            # Get conversation history
            messages = self.get_conversation_messages(session_id)
            
            # Format for Gemini
            contents = self.format_conversation_for_gemini(messages, message, ingredients)
            
            # Generate streaming response
            config = types.GenerateContentConfig(
                temperature=0.7,
                max_output_tokens=1000,
            )
            
            async for chunk in self.client.aio.models.generate_content_stream(
                model=self.model,
                contents=contents,
                config=config
            ):
                if chunk.candidates and chunk.candidates[0].content.parts:
                    text = chunk.candidates[0].content.parts[0].text
                    if text:
                        yield text
                        
        except Exception as e:
            if "API key" in str(e).lower():
                raise HTTPException(
                    status_code=500,
                    detail="Invalid or missing Gemini API key. Please check your GEMINI_API_KEY environment variable."
                )
            else:
                raise HTTPException(
                    status_code=500,
                    detail=f"Error generating streaming response: {str(e)}"
                )
    
    async def analyze_images(self, session_id: int, files) -> Tuple[str, List[Ingredient]]:
        """Analyze images to extract ingredients."""
        try:
            # Get conversation history
            messages = self.get_conversation_messages(session_id)
            
            # Create image analysis prompt
            analysis_prompt = f"Please analyze these {len(files)} image(s) of my fridge/pantry and identify the ingredients you can see. List each ingredient with estimated quantities."
            
            # Prepare content with images
            parts = [types.Part.from_text(text=analysis_prompt)]
            
            for file in files:
                try:
                    # Read and process image
                    content = await file.read()
                    content_type = file.content_type or "image/jpeg"
                    
                    # Add image to parts
                    parts.append(types.Part.from_bytes(data=content, mime_type=content_type))
                except Exception as e:
                    print(f"Error processing file {file.filename}: {e}")
                    continue
            
            # Generate response
            config = types.GenerateContentConfig(
                temperature=0.7,
                max_output_tokens=1000,
            )
            
            contents = [types.Content(role="user", parts=parts)]
            
            response = await self.client.aio.models.generate_content(
                model=self.model,
                contents=contents,
                config=config
            )
            
            if response and response.candidates:
                ai_response = response.candidates[0].content.parts[0].text
                
                # Parse ingredients from response (simplified)
                ingredients = self._parse_ingredients_from_response(ai_response)
                
                return ai_response, ingredients
            else:
                raise HTTPException(status_code=500, detail="No response generated from image analysis")
                
        except Exception as e:
            if "API key" in str(e).lower():
                raise HTTPException(
                    status_code=500,
                    detail="Invalid or missing Gemini API key for image analysis."
                )
            else:
                raise HTTPException(
                    status_code=500,
                    detail=f"Error analyzing images: {str(e)}"
                )
    
    def _parse_ingredients_from_response(self, response: str) -> List[Ingredient]:
        """Parse ingredients from AI response text."""
        ingredients = []
        
        # Simple parsing - look for lines that might be ingredients
        lines = response.split('\n')
        
        for line in lines:
            line = line.strip()
            if line and ('-' in line or '•' in line or line[0].isdigit()):
                # Try to extract ingredient info
                # This is a simplified parser - you might want more sophisticated parsing
                clean_line = line.replace('-', '').replace('•', '').strip()
                
                if clean_line:
                    # Default values
                    name = clean_line
                    quantity = "1"
                    unit = "piece"
                    
                    # Try to extract quantity and unit (basic parsing)
                    words = clean_line.split()
                    if len(words) >= 2 and words[0].replace('.', '').isdigit():
                        quantity = words[0]
                        name = ' '.join(words[1:])
                    
                    ingredients.append(Ingredient(
                        name=name,
                        quantity=quantity,
                        unit=unit
                    ))
        
        return ingredients[:10]  # Limit to 10 ingredients 