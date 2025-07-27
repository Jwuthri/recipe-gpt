import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
  const startTime = Date.now();

  try {
    const { images } = req.body;

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: 'Images array is required' });
    }

    // Prepare image parts for Gemini Vision API
    const imageParts = images.map(imageBase64 => ({
      inline_data: {
        mime_type: "image/jpeg",
        data: imageBase64.replace(/^data:image\/[a-z]+;base64,/, '') // Remove data URL prefix if present
      }
    }));

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

    // Prepare the request for Gemini Vision API
    const geminiRequest = {
      contents: [{
        parts: [textPart, ...imageParts]
      }],
      generationConfig: {
        temperature: 0.1,
        topK: 32,
        topP: 0.95,
        maxOutputTokens: 1024,
      }
    };

    // Make request to Gemini Vision API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(geminiRequest)
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${error}`);
    }

    const geminiData = await response.json();
    const responseTime = Date.now() - startTime;

    // Extract the generated text
    const generatedText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!generatedText) {
      throw new Error('No response from Gemini API');
    }

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
        gemini_response: geminiData
      });
    } catch (logError) {
      console.error('Failed to log to Supabase:', logError);
    }

    return res.status(200).json({
      success: true,
      ingredients: ingredients,
      responseTime: responseTime
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    
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