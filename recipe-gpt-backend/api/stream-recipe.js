import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
  const startTime = Date.now();

  try {
    const { ingredients, styleId } = req.body;

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

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Make streaming request to Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?key=${process.env.GEMINI_API_KEY}&alt=sse`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(geminiRequest)
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    let fullResponse = '';
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            
            try {
              const parsed = JSON.parse(data);
              if (parsed.candidates?.[0]?.content?.parts?.[0]?.text) {
                const text = parsed.candidates[0].content.parts[0].text;
                fullResponse += text;
                res.write(text);
              }
            } catch (parseError) {
              // Skip invalid JSON
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    const responseTime = Date.now() - startTime;

    // Log to Supabase
    try {
      await supabase
        .from('llm_messages')
        .insert({
          client_ip: clientIP,
          request_type: 'stream_recipe',
          ingredients_count: ingredients.length,
          style_id: styleId,
          prompt_text: geminiRequest.contents[0].parts[0].text,
          response_text: fullResponse,
          response_time_ms: responseTime,
          success: true,
          timestamp: new Date().toISOString()
        });
    } catch (logError) {
      console.error('Failed to log to Supabase:', logError);
    }

    res.end();

  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    // Log error to Supabase
    try {
      await supabase
        .from('llm_messages')
        .insert({
          client_ip: clientIP,
          request_type: 'stream_recipe',
          ingredients_count: req.body?.ingredients?.length || 0,
          style_id: req.body?.styleId || 'unknown',
          response_time_ms: responseTime,
          success: false,
          error_message: error.message,
          timestamp: new Date().toISOString()
        });
    } catch (logError) {
      console.error('Failed to log error to Supabase:', logError);
    }

    res.status(500).json({ error: 'Streaming failed', message: error.message });
  }
} 