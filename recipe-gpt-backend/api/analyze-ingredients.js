import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  console.log('\n🚀 =================================');
  console.log('🚀 ANALYZE INGREDIENTS API CALLED');
  console.log('🚀 =================================');
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    console.log('✅ CORS preflight request handled');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    console.log(`❌ Method not allowed: ${req.method}`);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);

  console.log(`\n📋 REQUEST INFO [${requestId}]`);
  console.log(`🕐 Timestamp: ${new Date().toISOString()}`);
  console.log(`🌍 Client IP: ${clientIP}`);
  console.log(`📦 User Agent: ${req.headers['user-agent'] || 'unknown'}`);
  console.log(`📊 Content Length: ${req.headers['content-length'] || 'unknown'}`);
  console.log(`🔗 Referer: ${req.headers.referer || 'none'}`);
  console.log(`📋 All Headers:`, JSON.stringify(req.headers, null, 2));
  console.log(`🔑 Body Keys: [${Object.keys(req.body || {}).join(', ')}]`);
  console.log(`📏 Body Size: ${JSON.stringify(req.body || {}).length} chars`);

  try {
    const { images } = req.body;

    console.log(`\n🖼️  IMAGE VALIDATION [${requestId}]`);
    console.log(`📥 Raw images data type: ${typeof images}`);
    console.log(`📊 Is Array: ${Array.isArray(images)}`);
    console.log(`🔢 Images count: ${images ? images.length : 0}`);
    
    if (!images || !Array.isArray(images) || images.length === 0) {
      console.log(`❌ VALIDATION FAILED [${requestId}]`);
      console.log(`❌ Images: ${images}`);
      console.log(`❌ Type: ${typeof images}`);
      console.log(`❌ Is Array: ${Array.isArray(images)}`);
      console.log(`❌ Length: ${images?.length || 'N/A'}`);
      return res.status(400).json({ error: 'Images array is required' });
    }

    console.log(`✅ IMAGE VALIDATION PASSED [${requestId}]`);

    // Initialize Google GenAI
    console.log(`\n🤖 GEMINI API SETUP [${requestId}]`);
    console.log(`🔑 API Key exists: ${!!process.env.GEMINI_API_KEY}`);
    console.log(`🔑 API Key length: ${process.env.GEMINI_API_KEY?.length || 0}`);
    console.log(`🔑 API Key prefix: ${process.env.GEMINI_API_KEY?.substring(0, 10) || 'MISSING'}...`);
    
    if (!process.env.GEMINI_API_KEY) {
      console.log(`❌ GEMINI_API_KEY NOT SET [${requestId}]`);
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }
    
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    console.log(`✅ Gemini AI initialized successfully [${requestId}]`);
    console.log(`🎯 Using model: gemini-2.5-flash`);

    // Prepare image parts for Gemini Vision API with validation
    console.log(`\n🔍 IMAGE PROCESSING [${requestId}]`);
    const imageParts = [];
    
    for (let i = 0; i < images.length; i++) {
      const imageBase64 = images[i];
      console.log(`\n📸 Processing image ${i + 1}/${images.length} [${requestId}]:`);
      console.log(`  📏 Length: ${imageBase64.length} chars`);
      console.log(`  🏷️  Starts with 'data:': ${imageBase64.startsWith('data:')}`);
      console.log(`  🔤 First 50 chars: ${imageBase64.substring(0, 50)}...`);
      
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
        console.log(`  🧪 Validating base64 format...`);
        // Try to decode to validate
        const buffer = Buffer.from(cleanBase64, 'base64');
        console.log(`  ✅ Base64 decode successful, buffer size: ${buffer.length} bytes`);
        
        // Detect MIME type from image header
        let mimeType = "image/jpeg"; // default
        if (buffer.length >= 8) {
          const header = buffer.toString('hex', 0, 8).toLowerCase();
          console.log(`  🔍 Image header: ${header}`);
          if (header.startsWith('89504e47')) {
            mimeType = "image/png";
          } else if (header.startsWith('ffd8ff')) {
            mimeType = "image/jpeg";
          } else if (header.startsWith('47494638')) {
            mimeType = "image/gif";
          } else if (header.startsWith('52494646')) {
            mimeType = "image/webp";
          }
          console.log(`  🎨 Detected MIME type: ${mimeType}`);
        }
        
        console.log(`✅ Image ${i + 1} validation PASSED [${requestId}]:`, {
          mimeType: mimeType,
          base64Length: cleanBase64.length,
          bufferSize: buffer.length,
          sizeKB: Math.round(buffer.length / 1024)
        });
        
        imageParts.push({
          inlineData: {
            mimeType: mimeType,
            data: cleanBase64
          }
        });
        console.log(`  ✅ Added to imageParts array`);
      } catch (error) {
        console.log(`❌ Image ${i + 1} FAILED base64 validation [${requestId}]:`, error.message);
        console.log(`❌ Base64 preview: ${cleanBase64.substring(0, 100)}...`);
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
    console.log(`\n🚀 GEMINI API CALL [${requestId}]`);
    console.log(`📤 Preparing request to Gemini API...`);
    
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

    console.log(`📋 Request Structure [${requestId}]:`);
    console.log(`  🎯 Model: gemini-2.5-flash`);
    console.log(`  📄 Contents length: ${contents.length}`);
    console.log(`  🧩 Parts count: ${contents[0].parts.length}`);
    console.log(`  🔧 Config: ${JSON.stringify(config, null, 2)}`);
    console.log(`  📝 Text prompt length: ${textPart.text.length} chars`);
    console.log(`  🖼️  Image parts: ${imageParts.length}`);

    let result;
    try {
      console.log(`\n🔄 Making API call to Gemini... [${requestId}]`);
      const apiCallStart = Date.now();
      
      result = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        config,
        contents,
      });
      
      const apiCallTime = Date.now() - apiCallStart;
      console.log(`✅ API call completed in ${apiCallTime}ms [${requestId}]`);
      console.log(`📊 Result object keys: [${Object.keys(result || {}).join(', ')}]`);
      
    } catch (apiError) {
      console.log(`❌ GEMINI API CALL FAILED [${requestId}]:`);
      console.log(`❌ Error message: ${apiError.message}`);
      console.log(`❌ Error status: ${apiError.status}`);
      console.log(`❌ Error statusText: ${apiError.statusText}`);
      console.log(`❌ Full error:`, apiError);
      throw apiError;
    }

    const responseTime = Date.now() - startTime;

    console.log(`\n📥 GEMINI RESPONSE [${requestId}]`);
    console.log(`⏱️  Total response time: ${responseTime}ms`);
    console.log(`✅ Has result object: ${!!result}`);
    console.log(`🔑 Result keys: [${result ? Object.keys(result).join(', ') : 'none'}]`);

    // Extract the generated text
    console.log(`\n🔍 EXTRACTING RESPONSE TEXT [${requestId}]`);
    const generatedText = result.text;
    
    if (!generatedText) {
      console.log(`❌ NO TEXT IN RESPONSE [${requestId}]:`);
      console.log(`❌ Full result object:`, JSON.stringify(result, null, 2));
      throw new Error('No response from Gemini API');
    }

    console.log(`✅ Generated text extracted [${requestId}]:`);
    console.log(`  📏 Length: ${generatedText.length} chars`);
    console.log(`  📝 Preview: ${generatedText.substring(0, 300)}...`);
    console.log(`  🔚 Ending: ...${generatedText.substring(generatedText.length - 100)}`);

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

    console.log(`\n🎉 FINAL RESPONSE [${requestId}]`);
    console.log(`✅ Success: true`);
    console.log(`🥕 Ingredients found: ${ingredients.length}`);
    console.log(`⏱️  Total processing time: ${responseTime}ms`);
    console.log(`📋 Sample ingredients:`, ingredients.slice(0, 3));
    console.log(`📊 All ingredients:`, ingredients.map(i => `${i.name} (${i.quantity} ${i.unit})`));

    const finalResponse = {
      success: true,
      ingredients: ingredients,
      responseTime: responseTime,
      requestId: requestId,
      timestamp: new Date().toISOString()
    };

    console.log(`📤 Sending response [${requestId}]:`, {
      statusCode: 200,
      responseSize: JSON.stringify(finalResponse).length
    });

    return res.status(200).json(finalResponse);

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