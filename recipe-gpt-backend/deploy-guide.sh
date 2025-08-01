#!/bin/bash

echo "🚀 Recipe GPT Backend - Deploy to Render.com"
echo "==========================================="
echo ""
echo "✅ Your backend is ready! Here's how to deploy:"
echo ""
echo "1. 🌐 Go to: https://render.com"
echo "2. �� Sign up/Login with GitHub"  
echo "3. ➕ Click 'New +' → 'Web Service'"
echo "4. 🔗 Connect your GitHub repo: recipe-gpt"
echo "5. 📂 Root directory: recipe-gpt-backend"
echo "6. 🏗️  Build command: npm install"
echo "7. ▶️  Start command: node api/generate-recipe.js"
echo "8. 🔧 Add these environment variables:"
echo "     GEMINI_API_KEY=-NearwoI0"
echo "     SUPABASE_URL=https://.supabase.co"
echo "     SUPABASE_ANON_KEY=eyJ..."
echo "9. 🚀 Click Deploy!"
echo ""
echo "🎯 After deployment:"
echo "   • Copy your Render URL (like: https://recipe-gpt-backend-abc123.onrender.com)"
echo "   • Update Flutter app: lib/core/constants/app_constants.dart"
echo "   • Set: backendUrl = 'https://your-app.onrender.com/api'"
echo "   • Set: useBackend = true"
echo ""
echo "💡 FREE TIER: 750 hours/month (perfect for testing!)"
