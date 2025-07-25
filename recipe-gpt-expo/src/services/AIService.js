/**
 * AI Service combining Google Gemini Flash 2.5 for image analysis 
 * and OpenAI GPT-4.1-mini for recipe generation
 */

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

class AIService {
  async analyzeImages(imageUris, onProgress = null) {
    try {
      // Validate input
      if (!Array.isArray(imageUris)) {
        imageUris = [imageUris]; // Convert single URI to array
      }
      
      if (imageUris.length === 0) {
        throw new Error('No images provided');
      }
      
      if (imageUris.length > 3) {
        throw new Error('Maximum 3 images allowed');
      }
      
      console.log(`Analyzing ${imageUris.length} image(s)`);
      
      if (onProgress) {
        onProgress('🔍 Scanning your photos...');
      }
      
      // Convert all images to base64 with MIME types
      const imageData = await Promise.all(
        imageUris.map(async (uri, index) => {
          if (onProgress) {
            onProgress(`📸 Processing image ${index + 1}/${imageUris.length}...`);
          }
          
          const {base64Data, mimeType} = await this.convertImageToBase64(uri);
          console.log(`Converted image with MIME type: ${mimeType}`);
          return {
            inline_data: {
              mime_type: mimeType,
              data: base64Data,
            },
          };
        })
      );
      
      if (onProgress) {
        onProgress('🧠 AI is analyzing your ingredients...');
      }
      
      // Create prompt based on number of images
      const promptText = imageUris.length === 1 
        ? 'Analyze this image of a fridge/pantry and list all visible food ingredients with their estimated quantities. Format the response as a JSON array where each item has "name", "unit", and "quantity" properties. The "name" should be the ingredient name, "unit" should be the unit of measurement (g, kg, ml, l, pieces, etc.), and "quantity" should be the quantity/amount. Be specific about quantities (e.g., {"name": "eggs", "unit": "pieces", "quantity": "2"}). Only include actual food ingredients, not containers or non-food items. Return ONLY the JSON array, no additional text.'
        : `Analyze these ${imageUris.length} images of a fridge/pantry and list all visible food ingredients with their estimated quantities from ALL images. Combine ingredients from all images into a single list. Format the response as a JSON array where each item has "name", "unit", and "quantity" properties. The "name" should be the ingredient name, "unit" should be the unit of measurement (g, kg, ml, l, pieces, etc.), and "quantity" should be the quantity/amount. Be specific about quantities (e.g., {"name": "eggs", "unit": "pieces", "quantity": "2"}). Only include actual food ingredients, not containers or non-food items. If the same ingredient appears in multiple images, combine the quantities. Return ONLY the JSON array, no additional text.`;
      
      // Build parts array with text prompt first, then all images
      const parts = [
        {
          text: promptText,
        },
        ...imageData,
      ];
      
      const response = await fetch(`${GEMINI_BASE_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: parts,
            },
          ],
          generationConfig: {
            maxOutputTokens: 5000,
            temperature: 0.3,
          },
        }),
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message);
      }

      if (!data.candidates || !data.candidates[0]) {
        throw new Error('No response from Gemini API');
      }

      if (onProgress) {
        onProgress('✨ Finalizing ingredient list...');
      }

      // Parse the JSON response
      const content = data.candidates[0].content.parts[0].text;
      try {
        // Clean up the response to extract JSON
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
        return JSON.parse(content);
      } catch (parseError) {
        // If JSON parsing fails, try to extract ingredients from text
        return this.parseIngredientsFromText(content);
      }
    } catch (error) {
      console.error('Error analyzing images with Gemini:', error);
      throw error;
    }
  }

  // Backward compatibility method for single image
  async analyzeImage(imageUri) {
    return this.analyzeImages([imageUri]);
  }

  async generateRecipeStream(ingredients, onChunk, onComplete, onError) {
    try {
      const ingredientList = ingredients
        .map(ing => `${ing.quantity} ${ing.unit} ${ing.name}`)
        .join('\n- ');

      const prompt = `Create a delicious recipe using these ingredients:\n\n- ${ingredientList}\n\nPlease provide:\n1. Recipe title\n2. Cooking time and servings\n3. Complete ingredient list with measurements\n4. Step-by-step cooking instructions\n5. Tips or variations if applicable\n\nFormat the response in clean markdown with proper headings and sections.`;

      const response = await fetch(`${GEMINI_BASE_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            maxOutputTokens: 8000,
            temperature: 0.7,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message);
      }

      if (!data.candidates || !data.candidates[0]) {
        throw new Error('No response from Gemini API');
      }

      const fullContent = data.candidates[0].content.parts[0].text;
      
      // Simulate streaming by sending chunks
      if (onChunk) {
        const words = fullContent.split(' ');
        let currentContent = '';
        
        for (let i = 0; i < words.length; i++) {
          currentContent += (i > 0 ? ' ' : '') + words[i];
          onChunk(words[i] + (i < words.length - 1 ? ' ' : ''), currentContent);
          
          // Small delay to simulate streaming
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }
      
      if (onComplete) {
        onComplete(fullContent);
      }

    } catch (error) {
      console.error('Error generating recipe with Gemini:', error);
      if (onError) {
        onError(error);
      }
      throw error;
    }
  }

  // Non-streaming version for backward compatibility
  async generateRecipe(ingredients) {
    return new Promise((resolve, reject) => {
      let fullContent = '';
      
      this.generateRecipeStream(
        ingredients,
        (chunk, content) => {
          fullContent = content;
        },
        (finalContent) => {
          resolve(finalContent);
        },
        (error) => {
          reject(error);
        }
      );
    });
  }

  // Chat method for conversational recipe assistance
  async generateChatResponse(prompt, onChunk, onComplete, onError) {
    try {
      const response = await fetch(`${GEMINI_BASE_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            maxOutputTokens: 2048,
            temperature: 0.33,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message);
      }

      if (!data.candidates || !data.candidates[0]) {
        throw new Error('No response from Gemini API');
      }

      const fullContent = data.candidates[0].content.parts[0].text;
      
      // Simulate streaming by sending chunks
      if (onChunk) {
        const words = fullContent.split(' ');
        let currentContent = '';
        
        for (let i = 0; i < words.length; i++) {
          currentContent += (i > 0 ? ' ' : '') + words[i];
          onChunk(words[i] + (i < words.length - 1 ? ' ' : ''), currentContent);
          
          // Small delay to simulate streaming
          await new Promise(resolve => setTimeout(resolve, 30));
        }
      }
      
      if (onComplete) {
        onComplete(fullContent);
      }

    } catch (error) {
      console.error('Error generating chat response with Gemini:', error);
      if (onError) {
        onError(error);
      }
      throw error;
    }
  }

  detectImageTypeFromUri(imageUri) {
    // Extract file extension from URI
    const extension = imageUri.toLowerCase().split('.').pop()?.split('?')[0];
    
    // Gemini supports: JPEG, PNG, WebP, HEIC, HEIF
    // We'll handle common formats and fallback to JPEG
    switch (extension) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'gif':
        return 'image/gif';
      case 'webp':
        return 'image/webp';
      case 'heic':
      case 'heif':
        return 'image/heic';
      case 'bmp':
        return 'image/bmp';
      case 'tiff':
      case 'tif':
        return 'image/tiff';
      default:
        // Default to JPEG for unknown types
        console.warn(`Unknown image format: ${extension}, defaulting to JPEG`);
        return 'image/jpeg';
    }
  }

  async convertImageToBase64(imageUri) {
    try {
      // Detect MIME type from URI first
      let mimeType = this.detectImageTypeFromUri(imageUri);
      
      console.log(`Converting image: ${imageUri}`);
      
      // Handle different URI formats
      if (imageUri.startsWith('file://') || imageUri.startsWith('/')) {
        // Local file path - use XMLHttpRequest for React Native
        return new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.onload = function() {
            if (xhr.status === 200) {
              const reader = new FileReader();
              reader.onloadend = () => {
                const base64 = reader.result.split(',')[1];
                // Try to get MIME type from response
                const contentType = xhr.getResponseHeader('content-type');
                if (contentType) {
                  mimeType = contentType;
                }
                resolve({
                  base64Data: base64,
                  mimeType: mimeType
                });
              };
              reader.onerror = reject;
              reader.readAsDataURL(xhr.response);
            } else {
              reject(new Error(`Failed to load image: ${xhr.status}`));
            }
          };
          xhr.onerror = () => reject(new Error('Network error loading image'));
          xhr.open('GET', imageUri, true);
          xhr.responseType = 'blob';
          xhr.send();
        });
      } else if (imageUri.startsWith('data:')) {
        // Data URI - extract base64 and MIME type directly
        const matches = imageUri.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
          return {
            base64Data: matches[2],
            mimeType: matches[1]
          };
        } else {
          throw new Error('Invalid data URI format');
        }
      } else {
        // HTTP/HTTPS URL - use fetch
        const response = await fetch(imageUri);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const blob = await response.blob();
        
        // Update MIME type from blob if available
        if (blob.type) {
          mimeType = blob.type;
        }
        
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const base64 = reader.result.split(',')[1];
            resolve({
              base64Data: base64,
              mimeType: mimeType
            });
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      }
    } catch (error) {
      console.error('Failed to convert image to base64:', error);
      throw new Error(`Failed to convert image to base64: ${error.message}`);
    }
  }

  parseIngredientsFromMarkdown(text) {
    // Parse ingredients from markdown list format
    const lines = text.split('\n');
    const ingredients = [];
    
    lines.forEach(line => {
      const trimmed = line.trim();
      // Look for markdown list items (starting with - or *)
      if (trimmed && (trimmed.startsWith('-') || trimmed.startsWith('*'))) {
        // Remove the list marker and trim
        const content = trimmed.substring(1).trim();
        
        // Try to parse quantity, unit, and name
        // Pattern: "2 eggs" or "500g chicken breast" or "1 liter milk"
        const match = content.match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z]*)\s+(.+)$/);
        
        if (match) {
          const [, quantity, unit, name] = match;
          ingredients.push({
            name: name.trim(),
            unit: unit || 'units',
            quantity: quantity,
          });
        } else {
          // Fallback: try to split by first space to get quantity and rest
          const parts = content.split(' ');
          if (parts.length >= 2) {
            const firstPart = parts[0];
            const rest = parts.slice(1).join(' ');
            
            // Check if first part contains quantity and unit
            const quantityMatch = firstPart.match(/^(\d+(?:\.\d+)?)([a-zA-Z]*)$/);
            if (quantityMatch) {
              ingredients.push({
                name: rest,
                unit: quantityMatch[2] || 'units',
                quantity: quantityMatch[1],
              });
            } else {
              // No clear quantity pattern, treat as simple item
              ingredients.push({
                name: content,
                unit: 'unit',
                quantity: '1',
              });
            }
          }
        }
      }
    });
    
    return ingredients.length > 0 ? ingredients : [
      { name: 'No ingredients detected', unit: 'units', quantity: '0' }
    ];
  }

  parseIngredientsFromText(text) {
    // Fallback method to parse ingredients from text response
    const lines = text.split('\n');
    const ingredients = [];
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('**')) {
        // Try to extract ingredient info from text
        const match = trimmed.match(/^[\-\*\d\s]*(.+?)[\s\-]*(\d+(?:\.\d+)?)\s*(\w+)/);
        if (match) {
          ingredients.push({
            name: match[1].trim(),
            unit: match[3],
            quantity: match[2],
          });
        } else {
          // Basic fallback
          const parts = trimmed.replace(/^[\-\*\s]+/, '').split(' ');
          if (parts.length >= 2) {
            ingredients.push({
              name: parts.slice(0, -2).join(' '),
              unit: parts[parts.length - 1] || 'unit',
              quantity: parts[parts.length - 2] || '1',
            });
          }
        }
      }
    });
    
    return ingredients.length > 0 ? ingredients : [
      { name: 'No ingredients detected', unit: 'units', quantity: '0' }
    ];
  }
}

export default new AIService(); 