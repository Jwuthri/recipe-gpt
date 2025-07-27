#!/bin/bash

echo "🚀 Recipe GPT Backend Deployment Script"
echo "======================================="

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "Installing Vercel CLI..."
    npm install -g vercel
fi

# Deploy to Vercel
echo "Deploying to Vercel..."
vercel --prod

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Go to your Vercel dashboard"
echo "2. Add these environment variables:"
echo "   - GEMINI_API_KEY: Your Google Gemini API key"
echo "   - SUPABASE_URL: Your Supabase project URL"
echo "   - SUPABASE_ANON_KEY: Your Supabase anon key"
echo ""
echo "3. Copy your Vercel URL and update Flutter app:"
echo "   lib/core/constants/app_constants.dart -> backendUrl"
echo ""
echo "📊 Test your deployment:"
echo "https://your-app.vercel.app/api/analytics"
