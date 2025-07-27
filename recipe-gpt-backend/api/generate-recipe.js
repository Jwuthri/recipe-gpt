import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Rate limiting storage (in-memory for simplicity)
const rateLimitMap = new Map();

// Simple rate limiting function
function isRateLimited(ip) {
  const now = Date.now();
  const userRequests = rateLimitMap.get(ip) || [];
  
  // Remove requests older than 1 minute
  const recentRequests = userRequests.filter(time => now - time < 60000);
  
  // Allow max 10 requests per minute
  if (recentRequests.length >= 10) {
    return true;
  }
  
  // Update the map
  recentRequests.push(now);
  rateLimitMap.set(ip, recentRequests);
  
  return false;
}

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get client IP for rate limiting
  const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
  
  // Check rate limit
  if (isRateLimited(clientIP)) {
    return res.status(429).json({ 
      error: 'Rate limit exceeded. Please wait before making another request.' 
    });
  }

  const startTime = Date.now();

  try {
    const { ingredients, styleId, isStreaming = false } = req.body;

    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return res.status(400).json({ error: 'Ingredients array is required' });
    }

    if (!styleId) {
      return res.status(400).json({ error: 'Style ID is required' });
    }

    // Prepare the request for Gemini API
    const geminiRequest = {
      contents: [{
        parts: [{
          text: `Generate a recipe using these ingredients: ${ingredients.map(ing => `${ing.quantity} ${ing.unit} ${ing.name}`).join(', ')}. Style: ${styleId}. Please provide a complete recipe with ingredients, instructions, and cooking details.`
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      }
    };

    // Choose the appropriate Gemini endpoint
    const endpoint = isStreaming 
      ? 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent'
      : 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

    // Make request to Gemini API
    const response = await fetch(`${endpoint}?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(geminiRequest)
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const geminiResponse = await response.json();
    const responseTime = Date.now() - startTime;

    // Extract the generated text
    let generatedText = '';
    if (geminiResponse.candidates && geminiResponse.candidates[0]) {
      generatedText = geminiResponse.candidates[0].content?.parts?.[0]?.text || '';
    }

    // Log to Supabase
    try {
      await supabase
        .from('llm_messages')
        .insert({
          client_ip: clientIP,
          request_type: 'generate_recipe',
          ingredients_count: ingredients.length,
          style_id: styleId,
          prompt_text: geminiRequest.contents[0].parts[0].text,
          response_text: generatedText,
          response_time_ms: responseTime,
          success: true,
          gemini_response: geminiResponse,
          timestamp: new Date().toISOString()
        });
    } catch (logError) {
      console.error('Failed to log to Supabase:', logError);
      // Don't fail the request if logging fails
    }

    // Return the response
    return res.status(200).json({
      success: true,
      recipe: generatedText,
      responseTime: responseTime,
      geminiResponse
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    // Log error to Supabase
    try {
      await supabase
        .from('llm_messages')
        .insert({
          client_ip: clientIP,
          request_type: 'generate_recipe',
          ingredients_count: req.body?.ingredients?.length || 0,
          style_id: req.body?.styleId || 'unknown',
          prompt_text: '',
          response_text: '',
          response_time_ms: responseTime,
          success: false,
          error_message: error.message,
          timestamp: new Date().toISOString()
        });
    } catch (logError) {
      console.error('Failed to log error to Supabase:', logError);
    }

    console.error('Recipe generation error:', error);
    return res.status(500).json({ 
      error: 'Failed to generate recipe',
      message: error.message 
    });
  }
} 