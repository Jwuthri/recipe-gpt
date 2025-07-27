import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Import API handlers
const analyzeIngredientsHandler = async (req, res) => {
  try {
    // Import the handler dynamically to mimic Vercel's behavior
    const { default: handler } = await import('./api/analyze-ingredients.js');
    await handler(req, res);
  } catch (error) {
    console.error('Error in analyze-ingredients handler:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

const streamRecipeHandler = async (req, res) => {
  try {
    const { default: handler } = await import('./api/stream-recipe.js');
    await handler(req, res);
  } catch (error) {
    console.error('Error in stream-recipe handler:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

// API routes
app.post('/api/analyze-ingredients', analyzeIngredientsHandler);
app.post('/api/stream-recipe', streamRecipeHandler);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    env: {
      hasGeminiKey: !!process.env.GEMINI_API_KEY,
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      hasSupabaseKey: !!process.env.SUPABASE_ANON_KEY
    }
  });
});

// Catch all for debugging
app.use((req, res) => {
  console.log(`🔍 Unhandled route: ${req.method} ${req.path}`);
  res.status(404).json({ error: 'Not found', path: req.path });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  res.status(500).json({ error: 'Internal server error', details: error.message });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Local development server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔍 Analyze ingredients: http://localhost:${PORT}/api/analyze-ingredients`);
  console.log(`🍳 Stream recipe: http://localhost:${PORT}/api/stream-recipe`);
  console.log('');
  console.log('Environment check:');
  console.log(`  GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log(`  SUPABASE_URL: ${process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing'}`);
  console.log(`  SUPABASE_ANON_KEY: ${process.env.SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}`);
}); 