import os
import base64
import json
import asyncio
from typing import List, Optional, AsyncGenerator
from fastapi import UploadFile, HTTPException
import google.generativeai as genai
from PIL import Image
import io
from dotenv import load_dotenv
from schemas import Ingredient

load_dotenv()

class LLMService:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY environment variable is required")
        
        genai.configure(api_key=self.api_key)
        self.model = genai.GenerativeModel('gemini-2.5-flash')
    
    async def analyze_images_stream(self, files: List[UploadFile]) -> AsyncGenerator[dict, None]:
        """Analyze uploaded images to extract ingredients with streaming progress"""
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
            
            # Create prompt based on number of images
            prompt_text = f"""Analyze these {len(files)} image(s) of a fridge/pantry and list all visible food ingredients with their estimated quantities. 

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

            # Prepare content for Gemini
            content_parts = [prompt_text]
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
                    "done": True
                }
                
            except (json.JSONDecodeError, KeyError) as e:
                # Fallback: parse ingredients from text
                ingredients = self._parse_ingredients_from_text(response.text)
                yield {
                    "progress": f"✅ Analysis complete! Found {len(ingredients)} ingredients",
                    "stage": "complete", 
                    "ingredients": [{"name": ing.name, "unit": ing.unit, "quantity": ing.quantity} for ing in ingredients],
                    "done": True
                }
                
        except Exception as e:
            if isinstance(e, HTTPException):
                raise e
            raise HTTPException(status_code=500, detail=f"Error analyzing images: {str(e)}")

    async def analyze_images(self, files: List[UploadFile]) -> List[Ingredient]:
        """Analyze uploaded images to extract ingredients"""
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
            
            # Create prompt based on number of images
            prompt_text = f"""Analyze these {len(files)} image(s) of a fridge/pantry and list all visible food ingredients with their estimated quantities. 

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

            # Prepare content for Gemini
            content_parts = [prompt_text]
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
                    max_output_tokens=2048,
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
                
                return ingredients if ingredients else [Ingredient(name="No ingredients detected", unit="units", quantity="0")]
                
            except (json.JSONDecodeError, KeyError) as e:
                # Fallback: parse ingredients from text
                return self._parse_ingredients_from_text(response.text)
                
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
        context: Optional[str] = None,
        ingredients: Optional[List[Ingredient]] = None
    ) -> str:
        """Generate a chat response using Gemini"""
        try:
            # Build enhanced prompt
            enhanced_prompt = self._build_chat_prompt(message, context, ingredients)
            
            # Generate response
            response = await asyncio.to_thread(
                self.model.generate_content,
                enhanced_prompt,
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
        context: Optional[str] = None,
        ingredients: Optional[List[Ingredient]] = None
    ) -> AsyncGenerator[str, None]:
        """Generate a streaming chat response"""
        try:
            # Build enhanced prompt
            enhanced_prompt = self._build_chat_prompt(message, context, ingredients)
            
            # Generate response (Gemini doesn't have native streaming, so we simulate it)
            response = await asyncio.to_thread(
                self.model.generate_content,
                enhanced_prompt,
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
    
    def _build_chat_prompt(
        self, 
        message: str, 
        context: Optional[str] = None,
        ingredients: Optional[List[Ingredient]] = None
    ) -> str:
        """Build an enhanced prompt for chat"""
        # Check if this is a recipe request
        is_recipe_request = any(word in message.lower() for word in [
            'recipe', 'cook', 'prepare', 'make', 'dish', 'meal', 'food', 'ingredient'
        ])
        
        prompt_parts = []
        
        # Add context about being a cooking assistant
        prompt_parts.append("You are a helpful cooking assistant and recipe expert.")
        
        # Add ingredients context if available
        if ingredients:
            ingredient_list = ", ".join([f"{ing.quantity} {ing.unit} {ing.name}" for ing in ingredients])
            prompt_parts.append(f"Available ingredients: {ingredient_list}")
        
        # Add conversation context if available
        if context:
            prompt_parts.append(f"Previous conversation context: {context}")
        
        # Add the user's message
        prompt_parts.append(f"User's message: {message}")
        
        # Add formatting instructions
        format_instructions = """
Respond helpfully using proper markdown formatting:
- Use **bold** for emphasis and key points
- Use bullet points (- or •) for lists
- Use ## for section headers when giving structured info
- Include relevant emojis to make responses engaging
- Keep responses focused, helpful but not too long
- Make it visually appealing with proper formatting
"""
        
        # Add recipe-specific instructions if needed
        if is_recipe_request:
            recipe_instructions = """
If its a recipe request, please provide a recipe with the following format:
```Recipe template
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
| Calories | 450 |
| Protein | 25g |
| Carbs | 35g |
| Fat | 20g |
| Sugar | 8g |
| Fiber | 5g |
| Sodium | 650mg |
```
"""
            format_instructions += recipe_instructions
        
        prompt_parts.append(format_instructions)
        
        return "\n\n".join(prompt_parts)
    
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