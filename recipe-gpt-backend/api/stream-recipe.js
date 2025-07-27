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

    // Initialize Google GenAI
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    console.log('Using Google GenAI SDK for streaming recipe generation');

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Generate content with streaming using Google GenAI SDK
    const contents = [{
      role: 'user',
      parts: [{
        text: `Generate a recipe using these ingredients: ${ingredients.map(ing => `${ing.quantity} ${ing.unit} ${ing.name}`).join(', ')}. Style: ${styleId}. Please provide a complete recipe with ingredients, instructions, and cooking details.`
      }]
    }];

    const config = {
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 2048 * 2,
      }
    };

    const response = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      config,
      contents,
    });

    let fullResponse = '';

    // Stream the response
    for await (const chunk of response) {
      const chunkText = chunk.text;
      if (chunkText) {
        fullResponse += chunkText;
        res.write(chunkText);
      }
    }

    const responseTime = Date.now() - startTime;

    // Log to Supabase
    try {
      const promptText = `Generate a recipe using these ingredients: ${ingredients.map(ing => `${ing.quantity} ${ing.unit} ${ing.name}`).join(', ')}. Style: ${styleId}. Please provide a complete recipe with ingredients, instructions, and cooking details.`;
      
      await supabase
        .from('llm_messages')
        .insert({
          client_ip: clientIP,
          request_type: 'stream_recipe',
          ingredients_count: ingredients.length,
          style_id: styleId,
          prompt_text: promptText,
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