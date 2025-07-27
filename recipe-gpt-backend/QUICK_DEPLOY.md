# 🚀 Quick Deploy Guide

## Step 1: Deploy to Render.com

1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Click **"New +"** → **"Web Service"**
4. Connect your **recipe-gpt** repo
5. Settings:
   - **Root Directory**: `recipe-gpt-backend`
   - **Build Command**: `npm install`
   - **Start Command**: `node api/generate-recipe.js`
6. Add Environment Variables:
   ```
   GEMINI_API_KEY=AIzaSyDpyNrQ3UiSwcEB4PXAOaVQ1Y-NearwoI0
   SUPABASE_URL=https://ycgsybcfwwdfxjkpnrlb.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljZ3N5YmNmd3dkZnhqa3BucmxiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI2NzE5MDcsImV4cCI6MjA0ODI0NzkwN30.NJ8IeGNvRpD6yfm7W_HLkAGAJBTkCkF0PFJelWJhXQQ
   ```
7. Click **Deploy**!

## Step 2: Test Your Backend

```bash
./test-backend.sh https://your-app.onrender.com
```

## Step 3: Connect Flutter App

Update `lib/core/constants/app_constants.dart`:

```dart
static const String backendUrl = 'https://your-app.onrender.com/api';
static const bool useBackend = true; // Enable secure backend! 🔐
```

## 🎉 Done!

Your app now uses:
- ✅ Secure API key protection
- ✅ Request logging & analytics  
- ✅ Rate limiting
- ✅ Production-ready backend

**Free Tier**: 750 hours/month (perfect for testing!)

---

## Alternative: One-Click Deploy

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/your-username/recipe-gpt)

*Note: Replace `your-username` with your actual GitHub username* 