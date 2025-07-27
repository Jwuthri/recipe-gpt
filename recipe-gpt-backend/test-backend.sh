#!/bin/bash

# Test your deployed backend
echo "🧪 Testing Recipe GPT Backend"
echo "=============================="

if [ -z "$1" ]; then
    echo "❌ Please provide your Render URL:"
    echo "   ./test-backend.sh https://your-app.onrender.com"
    exit 1
fi

BACKEND_URL="$1"

echo "🌐 Testing: $BACKEND_URL"
echo ""

echo "1. 🏥 Health check..."
curl -s -o /dev/null -w "Status: %{http_code}\n" "$BACKEND_URL/api/generate-recipe" || echo "❌ Backend not responding"

echo ""
echo "2. 🥘 Testing recipe generation..."
curl -X POST "$BACKEND_URL/api/generate-recipe" \
  -H "Content-Type: application/json" \
  -d '{"ingredients":[{"name":"chicken","quantity":"2","unit":"pieces"}],"styleId":"mediterranean"}' \
  --max-time 30 \
  | head -200

echo ""
echo ""
echo "✅ If you see recipe content above, your backend works!"
echo ""
echo "🎯 Next steps:"
echo "   1. Copy this URL: $BACKEND_URL/api"
echo "   2. Update Flutter app:"
echo "      • Open: lib/core/constants/app_constants.dart" 
echo "      • Set: backendUrl = '$BACKEND_URL/api'"
echo "      • Set: useBackend = true"
echo "   3. Test your app!" 