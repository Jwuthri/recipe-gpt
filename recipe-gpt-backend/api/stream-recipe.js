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
        text: `Create a detailed recipe using these ingredients: ${ingredients.map(ing => `${ing.quantity} ${ing.unit} ${ing.name}`).join(', ')}.

Recipe Style: ${styleId}

Please format the response using this EXACT template:

# [Recipe Title]

*[Brief appetizing description in 1-2 sentences]*

## 📊 Recipe Info
- **Prep Time:** [X minutes]
- **Cook Time:** [X minutes] 
- **Total Time:** [X minutes]
- **Servings:** [X servings]
- **Difficulty:** [Easy/Medium/Hard]
- **Cuisine:** [Type of cuisine]

## 🥘 Ingredients
${ingredients.map(ing => `- ${ing.quantity} ${ing.unit} ${ing.name}`).join('\n')}
[Add any additional ingredients needed]

## 👨‍🍳 Instructions
1. [Detailed step-by-step instruction]
2. [Continue with each step...]
[Continue until recipe is complete]

## 📈 Nutrition (Per Serving)

| Nutrient | Amount |
|----------|--------|
| Calories | [X kcal] |
| Protein | [X g] |
| Carbohydrates | [X g] |
| Fat | [X g] |
| Fiber | [X g] |
| Sugar | [X g] |
| Sodium | [X mg] |

## 💡 Chef's Tips
- [Helpful tip or variation]
- [Storage instructions]
- [Serving suggestions]

---
*Enjoy your delicious ${styleId} meal!* 🍽️`
      }]
    }];

    const config = {
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 2048 * 3, // Increased for detailed template with nutrition info
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