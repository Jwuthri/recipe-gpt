export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Return API documentation
  return res.status(200).json({
    name: "Recipe GPT Backend API",
    version: "1.0.0",
    description: "Secure backend for Recipe GPT with AI-powered ingredient analysis",
    status: "online",
    timestamp: new Date().toISOString(),
    endpoints: {
      "POST /api/analyze-ingredients": {
        description: "Analyze food images to extract ingredients",
        parameters: {
          images: "Array of base64 encoded images"
        }
      },
      "POST /api/stream-recipe": {
        description: "Generate streaming recipe based on ingredients",
        parameters: {
          ingredients: "Array of ingredient objects",
          style: "Recipe style preference"
        }
      },
      "GET /api/health": {
        description: "Health check endpoint"
      }
    },
    usage: {
      example: "POST /api/analyze-ingredients",
      body: {
        images: ["base64encodedimage..."]
      }
    },
    features: [
      "🔒 Secure API key protection",
      "🤖 AI-powered ingredient analysis", 
      "📊 Request logging & analytics",
      "⚡ Fast serverless functions",
      "🌍 Global CDN deployment"
    ],
    support: {
      documentation: "See README.md",
      issues: "GitHub Issues"
    }
  });
}