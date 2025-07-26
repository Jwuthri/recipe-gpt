/**
 * AI Service combining Google Gemini Flash 2.5 for image analysis 
 * and OpenAI GPT-4.1-mini for recipe generation
 */

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
const GEMINI_STREAM_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent';

// Check if API key is available
if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_api_key_here') {
  console.warn('⚠️ GEMINI_API_KEY not configured! Please add your API key to .env file');
}

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
            maxOutputTokens: 2048 * 4,
            temperature: 0.33,
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
            maxOutputTokens: 2048 * 4,
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
      
      // Fast streaming by sentences
      if (onChunk) {
        const sentences = fullContent.split(/([.!?]\s+)/);
        let currentContent = '';
        
        for (let i = 0; i < sentences.length; i++) {
          currentContent += sentences[i];
          onChunk(sentences[i], currentContent);
          
          // Fast streaming with minimal delay
          if (i < sentences.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 5));
          }
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

  // Helper method to filter out potentially problematic ingredients
  filterIngredients(ingredients) {
    const problematicKeywords = [
      'beer', 'wine', 'vodka', 'whiskey', 'rum', 'gin', 'alcohol', 'liquor',
      'sake', 'champagne', 'brandy', 'tequila', 'cocktail', 'bourbon'
    ];
    
    return ingredients.filter(ingredient => {
      const name = ingredient.name.toLowerCase();
      const isProblematic = problematicKeywords.some(keyword => 
        name.includes(keyword)
      );
      
      if (isProblematic) {
        console.log(`🚫 Filtering out potentially problematic ingredient: ${ingredient.name}`);
      }
      
      return !isProblematic;
    });
  }

  // Chat method for conversational recipe assistance
  async generateChatResponse(prompt, onChunk, onComplete, onError) {
    try {
      // Check if API key is available
      if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_api_key_here') {
        const error = new Error('Gemini API key not configured. Please add EXPO_PUBLIC_GEMINI_API_KEY to your .env file.');
        console.error(error.message);
        if (onError) onError(error);
        throw error;
      }

      console.log('🔥 Making API request to Gemini...');
      console.log('📝 Prompt length:', prompt.length);

      const requestBody = {
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
          maxOutputTokens: 2048 * 4,
          temperature: 0.33,
        },
      };

      // React Native doesn't support streaming, so use regular API with chunked processing
      const response = await fetch(`${GEMINI_BASE_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ HTTP error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        console.error('❌ Gemini API error:', data.error);
        throw new Error(`Gemini API error: ${data.error.message}`);
      }

      if (!data.candidates || !data.candidates[0]) {
        console.error('❌ No candidates in response:', data);
        throw new Error('No response from Gemini API');
      }

      // Check if content was blocked by safety filters
      const candidate = data.candidates[0];
      if (candidate.finishReason === 'SAFETY') {
        console.error('❌ Content blocked by safety filters:', candidate.safetyRatings);
        throw new Error('Content was blocked by safety filters. Please try with different ingredients.');
      }

      if (candidate.finishReason === 'RECITATION') {
        console.error('❌ Content blocked due to recitation:', candidate);
        throw new Error('Content was blocked due to potential copyright issues. Please try again.');
      }

      if (candidate.finishReason === 'MAX_TOKENS') {
        console.error('❌ Response hit maximum token limit:', candidate);
        throw new Error('Response was too long and got cut off. Please try with fewer ingredients or a simpler request.');
      }

      if (!candidate.content || !candidate.content.parts || !candidate.content.parts[0]) {
        console.error('❌ Invalid response structure:', candidate);
        console.error('❌ Finish reason:', candidate.finishReason);
        console.error('❌ Safety ratings:', candidate.safetyRatings);
        throw new Error('Invalid response structure from Gemini API. Content may have been filtered.');
      }

      const fullContent = candidate.content.parts[0].text;
      console.log('✅ Recipe generated successfully! Length:', fullContent.length);
      
      // Check if content is empty
      if (!fullContent || fullContent.trim().length === 0) {
        console.error('❌ Empty content received');
        console.error('❌ Full response:', JSON.stringify(data, null, 2));
        throw new Error('Received empty response. Content may have been filtered by safety policies.');
      }
      
      // Simulate streaming with sentence-by-sentence reveal (much faster)
      if (onChunk) {
        let currentContent = '';
        const sentences = fullContent.split(/(?<=[.!?])\s+/);
        
        for (let i = 0; i < sentences.length; i++) {
          const sentence = sentences[i] + (i < sentences.length - 1 ? ' ' : '');
          currentContent += sentence;
          onChunk(sentence, currentContent);
          
          // Fast sentence streaming - 200ms between sentences
          if (i < sentences.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        }
      }
      
      if (onComplete) {
        onComplete(fullContent);
      }

    } catch (error) {
      console.error('💥 Error generating chat response with Gemini:', error);
      console.error('💥 Error stack:', error.stack);
      console.error('💥 Error message:', error.message);
      console.error('💥 Error name:', error.name);
      
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