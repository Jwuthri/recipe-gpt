import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
  const startTime = Date.now();

  console.log(`[${new Date().toISOString()}] New request from ${clientIP}`);
  console.log('Request headers:', JSON.stringify(req.headers, null, 2));
  console.log('Request body keys:', Object.keys(req.body || {}));

  try {
    const { images } = req.body;

    console.log('Images received:', images ? `${images.length} images` : 'no images');
    
    if (!images || !Array.isArray(images) || images.length === 0) {
      console.error('Invalid images array:', { images, type: typeof images, isArray: Array.isArray(images) });
      return res.status(400).json({ error: 'Images array is required' });
    }

    // Initialize Google GenAI
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }
    
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    console.log('Using Google GenAI SDK with model: gemini-2.5-flash');

    // Prepare image parts for Gemini Vision API with validation
    const imageParts = [];
    
    for (let i = 0; i < images.length; i++) {
      const imageBase64 = images[i];
      console.log(`Processing image ${i + 1}:`, {
        length: imageBase64.length,
        startsWithData: imageBase64.startsWith('data:')
      });
      
      // Clean the base64 data
      let cleanBase64 = imageBase64;
      
      // Remove data URL prefix if present
      if (cleanBase64.startsWith('data:')) {
        const commaIndex = cleanBase64.indexOf(',');
        if (commaIndex !== -1) {
          cleanBase64 = cleanBase64.substring(commaIndex + 1);
        }
      }
      
      // Validate base64 format
      if (!cleanBase64) {
        console.warn(`Image ${i + 1} is empty or null`);
        continue;
      }
      
      if (cleanBase64.length < 50) {
        console.warn(`Image ${i + 1} appears to be too small: length=${cleanBase64.length}`);
        continue;
      }
      
      // Check if it's valid base64
      try {
        // Try to decode to validate
        const buffer = Buffer.from(cleanBase64, 'base64');
        
        // Detect MIME type from image header
        let mimeType = "image/jpeg"; // default
        if (buffer.length >= 8) {
          const header = buffer.toString('hex', 0, 8).toLowerCase();
          if (header.startsWith('89504e47')) {
            mimeType = "image/png";
          } else if (header.startsWith('ffd8ff')) {
            mimeType = "image/jpeg";
          } else if (header.startsWith('47494638')) {
            mimeType = "image/gif";
          } else if (header.startsWith('52494646')) {
            mimeType = "image/webp";
          }
        }
        
        console.log(`✅ Image ${i + 1} validation passed:`, {
          mimeType: mimeType,
          base64Length: cleanBase64.length,
          bufferSize: buffer.length
        });
        
        imageParts.push({
          inlineData: {
            mimeType: mimeType,
            data: cleanBase64
          }
        });
      } catch (error) {
        console.error(`❌ Image ${i + 1} failed base64 validation:`, error.message);
        continue;
      }
    }
    
    if (imageParts.length === 0) {
      throw new Error('No valid images found after processing');
    }
    
    console.log(`Successfully processed ${imageParts.length} out of ${images.length} images`);

    const textPart = {
      text: `Analyze these images of food/pantry/fridge and identify all visible food ingredients. 
      For each ingredient, estimate a reasonable quantity and unit.
      Return a JSON array of ingredient objects with this exact format: 
      [{"name": "chicken breast", "quantity": "2", "unit": "pieces"}, {"name": "onion", "quantity": "1", "unit": "medium"}, {"name": "garlic", "quantity": "3", "unit": "cloves"}].
      Only include actual food ingredients, not containers, utensils, or non-food items.
      Be specific about ingredients and provide realistic quantities.
      Common units: pieces, cloves, cups, tablespoons, teaspoons, grams, ounces, pounds, medium, large, small.
      Return ONLY the JSON array, no additional text.`
    };

    console.log('Prepared request with:', {
      textPartLength: textPart.text.length,
      imagePartsCount: imageParts.length,
      hasApiKey: !!process.env.GEMINI_API_KEY
    });

    // Make request using Google GenAI SDK with correct structure
    console.log('Making request to Gemini API using official SDK...');
    
    const contents = [{
      role: 'user',
      parts: [
        textPart,
        ...imageParts
      ]
    }];

    const config = {
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 1024 * 4,
      }
    };

    let result;
    try {
      console.log('Making API call with:', {
        model: 'gemini-2.5-flash',
        contentsLength: contents.length,
        partsCount: contents[0].parts.length,
        configKeys: Object.keys(config)
      });
      
      result = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        config,
        contents,
      });
    } catch (apiError) {
      console.error('API call failed:', {
        error: apiError.message,
        stack: apiError.stack,
        status: apiError.status,
        statusText: apiError.statusText
      });
      throw apiError;
    }

    const responseTime = Date.now() - startTime;

    console.log('Gemini API response received:', {
      responseTime: `${responseTime}ms`,
      hasResult: !!result,
      resultKeys: result ? Object.keys(result) : []
    });

    // Extract the generated text
    const generatedText = result.text;
    
    if (!generatedText) {
      console.error('No text in Gemini response:', result);
      throw new Error('No response from Gemini API');
    }

    console.log('Generated text length:', generatedText.length);
    console.log('Generated text preview:', generatedText.substring(0, 200) + '...');

    // Parse the JSON response to extract ingredients
    let ingredients = [];
    try {
      // Clean the response to extract just the JSON part
      const jsonMatch = generatedText.match(/\[.*\]/s);
      if (jsonMatch) {
        ingredients = JSON.parse(jsonMatch[0]);
        // Validate that each ingredient has the required fields
        ingredients = ingredients.map(ingredient => {
          if (typeof ingredient === 'string') {
            // Convert string to ingredient object
            return {
              name: ingredient,
              quantity: '1',
              unit: 'piece'
            };
          } else if (ingredient && typeof ingredient === 'object') {
            // Ensure all required fields exist
            return {
              name: ingredient.name || 'Unknown ingredient',
              quantity: ingredient.quantity || '1',
              unit: ingredient.unit || 'piece'
            };
          }
          return {
            name: 'Unknown ingredient',
            quantity: '1',
            unit: 'piece'
          };
        });
      } else {
        // Fallback: try to extract ingredients from text lines
        const lines = generatedText.split('\n').filter(line => line.trim());
        ingredients = lines.map(line => ({
          name: line.replace(/^[-*•]\s*/, '').trim(),
          quantity: '1',
          unit: 'piece'
        })).filter(ingredient => ingredient.name);
      }
    } catch (parseError) {
      console.error('Failed to parse ingredients:', parseError);
      // Last fallback: extract ingredients from the raw text
      const lines = generatedText.split('\n').filter(line => line.trim());
      ingredients = lines.map(line => ({
        name: line.replace(/^[-*•]\s*/, '').trim(),
        quantity: '1',
        unit: 'piece'
      })).filter(ingredient => ingredient.name);
    }

    // Log to Supabase
    try {
      await supabase.from('llm_messages').insert({
        client_ip: clientIP,
        request_type: 'analyze_ingredients',
        ingredients_count: images.length,
        prompt_text: 'Image analysis request',
        response_text: JSON.stringify(ingredients),
        response_time_ms: responseTime,
        success: true,
        gemini_response: { generatedText }
      });
    } catch (logError) {
      console.error('Failed to log to Supabase:', logError);
    }

    console.log('Final response:', {
      success: true,
      ingredientsCount: ingredients.length,
      responseTime: responseTime,
      ingredients: ingredients.slice(0, 3) // Log first 3 ingredients
    });

    return res.status(200).json({
      success: true,
      ingredients: ingredients,
      responseTime: responseTime
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    console.error('ERROR in analyze-ingredients:', {
      message: error.message,
      stack: error.stack,
      responseTime: `${responseTime}ms`,
      clientIP: clientIP
    });
    
    // Log error to Supabase
    try {
      await supabase.from('llm_messages').insert({
        client_ip: clientIP,
        request_type: 'analyze_ingredients',
        prompt_text: 'Image analysis request',
        response_time_ms: responseTime,
        success: false,
        error_message: error.message
      });
    } catch (logError) {
      console.error('Failed to log error to Supabase:', logError);
    }

    console.error('Analyze ingredients error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to analyze ingredients',
      details: error.message
    });
  }
} 