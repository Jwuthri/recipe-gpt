import os
import base64
import json
import asyncio
from typing import List, Optional, AsyncGenerator, Tuple
from fastapi import UploadFile, HTTPException
import google.generativeai as genai
from PIL import Image
import io
from dotenv import load_dotenv
from schemas import Ingredient
from sqlalchemy.orm import Session

load_dotenv()

class LLMService:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY environment variable is required")
        
        genai.configure(api_key=self.api_key)
        self.model = genai.GenerativeModel('gemini-2.5-flash')
    
    async def analyze_images_stream(self, files: List[UploadFile], session_id: int, db: Session) -> AsyncGenerator[dict, None]:
        """Analyze uploaded images to extract ingredients with streaming progress and conversation history"""
        try:
            if not files:
                raise HTTPException(status_code=400, detail="No images provided")
            
            if len(files) > 3:
                raise HTTPException(status_code=400, detail="Maximum 3 images allowed")
            
            # Send progress update
            yield {"progress": f"📸 Processing {len(files)} image(s)...", "stage": "processing"}
            
            # Prepare images for Gemini
            image_parts = []
            for i, file in enumerate(files):
                # Send progress for each image
                yield {"progress": f"📸 Processing image {i + 1}/{len(files)}...", "stage": "processing"}
                
                # Read image content
                content = await file.read()
                
                # Detect MIME type
                mime_type = self._detect_mime_type(file.filename, file.content_type, content)
                
                # Validate image
                try:
                    image = Image.open(io.BytesIO(content))
                    
                    # For Gemini compatibility, convert to supported formats if needed
                    if mime_type not in ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']:
                        # Convert unsupported formats to JPEG
                        if image.mode != 'RGB':
                            image = image.convert('RGB')
                        img_buffer = io.BytesIO()
                        image.save(img_buffer, format='JPEG')
                        img_buffer.seek(0)
                        image_parts.append({
                            'data': img_buffer.getvalue(),
                            'mime_type': 'image/jpeg'
                        })
                    else:
                        # Use original format if supported
                        if mime_type in ['image/heic', 'image/heif'] and image.mode != 'RGB':
                            # Convert HEIC/HEIF to RGB for better compatibility
                            image = image.convert('RGB')
                            img_buffer = io.BytesIO()
                            image.save(img_buffer, format='JPEG')
                            img_buffer.seek(0)
                            image_parts.append({
                                'data': img_buffer.getvalue(),
                                'mime_type': 'image/jpeg'
                            })
                        else:
                            image_parts.append({
                                'data': content,
                                'mime_type': mime_type
                            })
                        
                except Exception as e:
                    raise HTTPException(status_code=400, detail=f"Invalid image file: {str(e)}")
            
            # Send analysis progress
            yield {"progress": "🧠 AI is analyzing your ingredients...", "stage": "analyzing"}
            
            # Build conversation history
            conversation_messages = self._build_image_analysis_conversation(session_id, db, len(files))
            
            # Create prompt for image analysis
            analysis_prompt = f"""Analyze these {len(files)} image(s) of a fridge/pantry and list all visible food ingredients with their estimated quantities. 

Format the response as a JSON array where each item has "name", "unit", and "quantity" properties. 
- "name": the ingredient name
- "unit": unit of measurement (g, kg, ml, l, pieces, cups, tbsp, tsp, etc.)
- "quantity": the estimated quantity/amount

Be specific about quantities. Examples:
{{"name": "eggs", "unit": "pieces", "quantity": "6"}}
{{"name": "milk", "unit": "ml", "quantity": "1000"}}
{{"name": "chicken breast", "unit": "g", "quantity": "500"}}

Only include actual food ingredients, not containers or non-food items. 
If the same ingredient appears in multiple images, combine the quantities.
Return ONLY the JSON array, no additional text."""

            # Prepare content for Gemini with conversation history
            gemini_content = self._format_for_gemini(conversation_messages)
            gemini_content += f"\n\nUser: {analysis_prompt}"
            
            # Add images to content
            content_parts = [gemini_content]
            for img_data in image_parts:
                content_parts.append({
                    'mime_type': img_data['mime_type'],
                    'data': img_data['data']
                })
            
            # Generate response
            response = await asyncio.to_thread(
                self.model.generate_content,
                content_parts,
                generation_config=genai.types.GenerationConfig(
                    max_output_tokens=5000,
                    temperature=0.3,
                )
            )
            
            if not response.text:
                raise HTTPException(status_code=500, detail="No response from Gemini API")
            
            # Send finalizing progress
            yield {"progress": "✨ Finalizing ingredient list...", "stage": "finalizing"}
            
            # Parse JSON response
            try:
                # Clean up response to extract JSON
                response_text = response.text.strip()
                
                # Try to find JSON array in response
                start_idx = response_text.find('[')
                end_idx = response_text.rfind(']') + 1
                
                if start_idx != -1 and end_idx > start_idx:
                    json_text = response_text[start_idx:end_idx]
                    ingredients_data = json.loads(json_text)
                else:
                    # Fallback: try parsing entire response
                    ingredients_data = json.loads(response_text)
                
                # Convert to Ingredient objects
                ingredients = []
                for item in ingredients_data:
                    if isinstance(item, dict) and all(key in item for key in ['name', 'unit', 'quantity']):
                        ingredients.append({
                            'name': item['name'],
                            'unit': item['unit'],
                            'quantity': str(item['quantity'])
                        })
                
                if not ingredients:
                    ingredients = [{'name': 'No ingredients detected', 'unit': 'units', 'quantity': '0'}]
                
                # Send final result
                yield {
                    "progress": f"✅ Analysis complete! Found {len(ingredients)} ingredients",
                    "stage": "complete",
                    "ingredients": ingredients,
                    "response": response.text,
                    "done": True
                }
                
            except (json.JSONDecodeError, KeyError) as e:
                # Fallback: parse ingredients from text
                ingredients = self._parse_ingredients_from_text(response.text)
                yield {
                    "progress": f"✅ Analysis complete! Found {len(ingredients)} ingredients",
                    "stage": "complete", 
                    "ingredients": [{"name": ing.name, "unit": ing.unit, "quantity": ing.quantity} for ing in ingredients],
                    "response": response.text,
                    "done": True
                }
                
        except Exception as e:
            if isinstance(e, HTTPException):
                raise e
            raise HTTPException(status_code=500, detail=f"Error analyzing images: {str(e)}")

    async def analyze_images(self, files: List[UploadFile], session_id: int, db: Session) -> Tuple[str, List[Ingredient]]:
        """Analyze uploaded images to extract ingredients with conversation history"""
        try:
            if not files:
                raise HTTPException(status_code=400, detail="No images provided")
            
            if len(files) > 3:
                raise HTTPException(status_code=400, detail="Maximum 3 images allowed")
            
            # Prepare images for Gemini
            image_parts = []
            for file in files:
                # Read image content
                content = await file.read()
                
                # Detect MIME type
                mime_type = self._detect_mime_type(file.filename, file.content_type, content)
                
                # Validate image
                try:
                    image = Image.open(io.BytesIO(content))
                    
                    # For Gemini compatibility, convert to supported formats if needed
                    if mime_type not in ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']:
                        # Convert unsupported formats to JPEG
                        if image.mode != 'RGB':
                            image = image.convert('RGB')
                        img_buffer = io.BytesIO()
                        image.save(img_buffer, format='JPEG')
                        img_buffer.seek(0)
                        image_parts.append({
                            'data': img_buffer.getvalue(),
                            'mime_type': 'image/jpeg'
                        })
                    else:
                        # Use original format if supported
                        if mime_type in ['image/heic', 'image/heif'] and image.mode != 'RGB':
                            # Convert HEIC/HEIF to RGB for better compatibility
                            image = image.convert('RGB')
                            img_buffer = io.BytesIO()
                            image.save(img_buffer, format='JPEG')
                            img_buffer.seek(0)
                            image_parts.append({
                                'data': img_buffer.getvalue(),
                                'mime_type': 'image/jpeg'
                            })
                        else:
                            image_parts.append({
                                'data': content,
                                'mime_type': mime_type
                            })
                        
                except Exception as e:
                    raise HTTPException(status_code=400, detail=f"Invalid image file: {str(e)}")
            
            # Build conversation history
            conversation_messages = self._build_image_analysis_conversation(session_id, db, len(files))
            
            # Create prompt for image analysis
            analysis_prompt = f"""Analyze these {len(files)} image(s) of a fridge/pantry and list all visible food ingredients with their estimated quantities. 

Format the response as a JSON array where each item has "name", "unit", and "quantity" properties. 
- "name": the ingredient name
- "unit": unit of measurement (g, kg, ml, l, pieces, cups, tbsp, tsp, etc.)
- "quantity": the estimated quantity/amount

Be specific about quantities. Examples:
{{"name": "eggs", "unit": "pieces", "quantity": "6"}}
{{"name": "milk", "unit": "ml", "quantity": "1000"}}
{{"name": "chicken breast", "unit": "g", "quantity": "500"}}

Only include actual food ingredients, not containers or non-food items. 
If the same ingredient appears in multiple images, combine the quantities.
Return ONLY the JSON array, no additional text."""

            # Prepare content for Gemini with conversation history
            gemini_content = self._format_for_gemini(conversation_messages)
            gemini_content += f"\n\nUser: {analysis_prompt}"
            
            # Add images to content
            content_parts = [gemini_content]
            for img_data in image_parts:
                content_parts.append({
                    'mime_type': img_data['mime_type'],
                    'data': img_data['data']
                })
            
            # Generate response
            response = await asyncio.to_thread(
                self.model.generate_content,
                content_parts,
                generation_config=genai.types.GenerationConfig(
                    max_output_tokens=2048*4,
                    temperature=0.33,
                )
            )
            
            if not response.text:
                raise HTTPException(status_code=500, detail="No response from Gemini API")
            
            # Parse JSON response
            try:
                # Clean up response to extract JSON
                response_text = response.text.strip()
                
                # Try to find JSON array in response
                start_idx = response_text.find('[')
                end_idx = response_text.rfind(']') + 1
                
                if start_idx != -1 and end_idx > start_idx:
                    json_text = response_text[start_idx:end_idx]
                    ingredients_data = json.loads(json_text)
                else:
                    # Fallback: try parsing entire response
                    ingredients_data = json.loads(response_text)
                
                # Convert to Ingredient objects
                ingredients = []
                for item in ingredients_data:
                    if isinstance(item, dict) and all(key in item for key in ['name', 'unit', 'quantity']):
                        ingredients.append(Ingredient(
                            name=item['name'],
                            unit=item['unit'],
                            quantity=str(item['quantity'])
                        ))
                
                result_ingredients = ingredients if ingredients else [Ingredient(name="No ingredients detected", unit="units", quantity="0")]
                return response.text, result_ingredients
                
            except (json.JSONDecodeError, KeyError) as e:
                # Fallback: parse ingredients from text
                ingredients = self._parse_ingredients_from_text(response.text)
                return response.text, ingredients
                
        except Exception as e:
            if isinstance(e, HTTPException):
                raise e
            raise HTTPException(status_code=500, detail=f"Error analyzing images: {str(e)}")
    
    def _detect_mime_type(self, filename: Optional[str], content_type: Optional[str], content: bytes) -> str:
        """Detect MIME type from filename, content-type header, or file content"""
        
        # First try the content-type header if available and valid
        if content_type and content_type.startswith('image/'):
            # Validate it's a supported image type
            supported_types = [
                'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 
                'image/webp', 'image/heic', 'image/heif', 'image/bmp', 
                'image/tiff', 'image/tif'
            ]
            if content_type.lower() in supported_types:
                # Normalize jpg to jpeg
                if content_type.lower() == 'image/jpg':
                    return 'image/jpeg'
                return content_type.lower()
        
        # Try to detect from filename extension
        if filename:
            extension = filename.lower().split('.')[-1] if '.' in filename else ''
            extension_map = {
                'jpg': 'image/jpeg',
                'jpeg': 'image/jpeg', 
                'png': 'image/png',
                'gif': 'image/gif',
                'webp': 'image/webp',
                'heic': 'image/heic',
                'heif': 'image/heif',
                'bmp': 'image/bmp',
                'tiff': 'image/tiff',
                'tif': 'image/tiff'
            }
            if extension in extension_map:
                return extension_map[extension]
        
        # Try to detect from file content (magic bytes)
        if len(content) >= 4:
            # JPEG
            if content[:2] == b'\xff\xd8':
                return 'image/jpeg'
            # PNG
            elif content[:8] == b'\x89PNG\r\n\x1a\n':
                return 'image/png'
            # GIF
            elif content[:6] in [b'GIF87a', b'GIF89a']:
                return 'image/gif'
            # WebP
            elif content[:4] == b'RIFF' and content[8:12] == b'WEBP':
                return 'image/webp'
            # BMP
            elif content[:2] == b'BM':
                return 'image/bmp'
            # TIFF
            elif content[:4] in [b'II*\x00', b'MM\x00*']:
                return 'image/tiff'
            # HEIC/HEIF (more complex detection)
            elif b'ftyp' in content[:32] and (b'heic' in content[:32] or b'mif1' in content[:32]):
                return 'image/heic'
        
        # Default fallback
        print(f"Warning: Could not detect MIME type for file {filename}, defaulting to image/jpeg")
        return 'image/jpeg'
    
    async def generate_chat_response(
        self, 
        message: str, 
        session_id: int,
        db: Session,
        ingredients: Optional[List[Ingredient]] = None
    ) -> str:
        """Generate a chat response using Gemini with proper conversation history"""
        try:
            # Build conversation messages from database
            conversation_messages = self._build_conversation_messages(session_id, db, message, ingredients)
            
            # Convert to Gemini format
            gemini_content = self._format_for_gemini(conversation_messages)
            
            # Generate response
            response = await asyncio.to_thread(
                self.model.generate_content,
                gemini_content,
                generation_config=genai.types.GenerationConfig(
                    max_output_tokens=2048,
                    temperature=0.33,
                )
            )
            
            if not response.text:
                raise HTTPException(status_code=500, detail="No response from Gemini API")
            
            return response.text
            
        except Exception as e:
            if isinstance(e, HTTPException):
                raise e
            raise HTTPException(status_code=500, detail=f"Error generating chat response: {str(e)}")
    
    async def generate_chat_response_stream(
        self,
        message: str,
        session_id: int,
        db: Session,
        ingredients: Optional[List[Ingredient]] = None
    ) -> AsyncGenerator[str, None]:
        """Generate a streaming chat response with proper conversation history"""
        try:
            # Build conversation messages from database
            conversation_messages = self._build_conversation_messages(session_id, db, message, ingredients)
            
            # Convert to Gemini format
            gemini_content = self._format_for_gemini(conversation_messages)
            
            # Generate response (Gemini doesn't have native streaming, so we simulate it)
            response = await asyncio.to_thread(
                self.model.generate_content,
                gemini_content,
                generation_config=genai.types.GenerationConfig(
                    max_output_tokens=2048,
                    temperature=0.33,
                )
            )
            
            if not response.text:
                raise HTTPException(status_code=500, detail="No response from Gemini API")
            
            # Simulate streaming by breaking text into chunks
            full_text = response.text
            chunks = self._split_text_into_chunks(full_text)
            
            for chunk in chunks:
                yield chunk
                # Small delay to simulate real streaming
                await asyncio.sleep(0.05)
                
        except Exception as e:
            if isinstance(e, HTTPException):
                raise e
            raise HTTPException(status_code=500, detail=f"Error generating streaming response: {str(e)}")
    
    def _build_conversation_messages(
        self,
        session_id: int,
        db: Session,
        current_message: str,
        ingredients: Optional[List[Ingredient]] = None
    ) -> List[dict]:
        """Build conversation messages from database history"""
        from models import Message, ChatSession  # Import here to avoid circular imports
        
        # Get conversation history
        messages = db.query(Message).filter(
            Message.session_id == session_id
        ).order_by(Message.created_at).all()
        
        conversation_messages = []
        
        # Add all historical messages (including system message)
        for msg in messages:
            conversation_messages.append({
                "role": msg.role,
                "content": msg.content
            })
        
        # Build current user message with ingredients if provided
        current_content = current_message
        if ingredients:
            ingredient_list = ", ".join([f"{ing.quantity} {ing.unit} {ing.name}" for ing in ingredients])
            current_content = f"I have these ingredients: {ingredient_list}\n\n{current_message}"
        
        # Add current user message
        conversation_messages.append({
            "role": "user", 
            "content": current_content
        })
        
        return conversation_messages
    
    def _get_system_prompt(self, ingredients: Optional[List] = None) -> str:
        """Get the system prompt for the cooking assistant"""
        base_prompt = """
You are a helpful cooking assistant and recipe expert.

Respond helpfully using proper markdown formatting:
- Use **bold** for emphasis and key points
- Use bullet points (- or •) for lists
- Use ## for section headers when giving structured info
- Include relevant emojis to make responses engaging
- Keep responses focused, helpful but not too long
- Make it visually appealing with proper formatting

You are also a pro at triage requests:
- if the user is asking a question about the previous recipe or an update please use the `RECIPE TEMPLATE` to respond.
- if a user is asking for question none related to cooking, please respond with a basic message that you are not able to help with that.
- if the user is asking for a recipe, please provide a recipe with the `RECIPE TEMPLATE` to respond.

```RECIPE TEMPLATE
# 🍳 [Creative Recipe Name]

⏱️ **Prep Time:** X minutes | 🔥 **Cook Time:** X minutes | 🍽️ **Serves:** X people

## 🥘 Ingredients
- List all ingredients with specific measurements
- Include both user's ingredients and any common additions needed
- Use bullet points with quantities

## 📝 Instructions
1. Provide detailed, step-by-step cooking instructions
2. Include cooking techniques and temperatures
3. Add timing for each major step
4. Make it 6-10 clear, actionable steps
5. Include plating/presentation tips

## 💡 Chef's Tips
- Share 2-3 professional cooking tips
- Mention ingredient substitutions
- Storage or leftover suggestions

## 🌟 Variations
- Suggest 1-2 creative variations of the recipe
- Different flavor profiles or dietary modifications

## 🍳Nutritional information:
| Nutrient | Amount |
|----------|--------|
| Calories | 450    |
| Protein  | 25g    |
| Carbs    | 35g    |
| Fat      | 20g    |
| Sugar    | 8g     |
| Fiber    | 5g     |
| Sodium   | 650mg  |
```"""

        return base_prompt
    
    def _format_for_gemini(self, conversation_messages: List[dict]) -> str:
        """Format conversation messages for Gemini (which expects a single prompt)"""
        # For now, we'll convert the conversation to a single prompt since Gemini doesn't support chat history natively
        # In the future, this can be updated when Gemini supports proper conversation format
        
        formatted_parts = []
        
        for msg in conversation_messages:
            if msg["role"] == "system":
                formatted_parts.append(msg["content"])
            elif msg["role"] == "user":
                formatted_parts.append(f"User: {msg['content']}")
            elif msg["role"] == "assistant":
                formatted_parts.append(f"Assistant: {msg['content']}")
        
        return "\n\n".join(formatted_parts)
    
    def _split_text_into_chunks(self, text: str) -> List[str]:
        """Split text into chunks for streaming simulation"""
        # Split by sentences and paragraphs for natural streaming
        chunks = []
        sentences = text.split('. ')
        
        for i, sentence in enumerate(sentences):
            if i == len(sentences) - 1:
                chunks.append(sentence)  # Last sentence, don't add period
            else:
                chunks.append(sentence + '. ')
        
        return chunks
    
    def _parse_ingredients_from_text(self, text: str) -> List[Ingredient]:
        """Fallback method to parse ingredients from text response"""
        lines = text.split('\n')
        ingredients = []
        
        for line in lines:
            line = line.strip()
            if line and not line.startswith('#') and not line.startswith('**'):
                # Try to extract ingredient info from text
                # Remove markdown list markers
                line = line.replace('-', '').replace('*', '').strip()
                
                # Try to parse quantity, unit, and name
                parts = line.split()
                if len(parts) >= 3:
                    try:
                        quantity = parts[0]
                        unit = parts[1]
                        name = ' '.join(parts[2:])
                        
                        # Validate quantity is numeric
                        float(quantity)
                        
                        ingredients.append(Ingredient(
                            name=name,
                            unit=unit,
                            quantity=quantity
                        ))
                    except ValueError:
                        # If quantity is not numeric, treat as simple ingredient
                        ingredients.append(Ingredient(
                            name=line,
                            unit="unit",
                            quantity="1"
                        ))
        
        return ingredients if ingredients else [Ingredient(name="No ingredients detected", unit="units", quantity="0")] 

    def _build_image_analysis_conversation(self, session_id: int, db: Session, num_images: int) -> List[dict]:
        """Build conversation messages for image analysis"""
        from models import Message  # Import here to avoid circular imports
        
        # Get conversation history
        messages = db.query(Message).filter(
            Message.session_id == session_id
        ).order_by(Message.created_at).all()
        
        conversation_messages = []
        
        # Add all historical messages (including system message)
        for msg in messages:
            conversation_messages.append({
                "role": msg.role,
                "content": msg.content
            })
        
        return conversation_messages 