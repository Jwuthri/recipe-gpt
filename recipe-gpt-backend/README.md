# 🚀 Recipe GPT Backend

Secure backend for Recipe GPT app with **Vercel + Supabase** that:
- 🔐 **Protects API keys** (server-side only)
- 📊 **Logs all LLM requests** for analytics
- ⚡ **Handles streaming** recipe generation
- 🛡️ **Rate limiting** protection
- 📈 **Real-time analytics** dashboard

## 🏗️ Architecture

```
Flutter App → Vercel API → Gemini API
                ↓
            Supabase DB (logging)
```

## 📋 Setup Steps

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create new project
2. Copy your project URL and anon key
3. Run this SQL in Supabase SQL Editor:

```sql
-- Create the llm_messages table
CREATE TABLE llm_messages (
  id BIGSERIAL PRIMARY KEY,
  client_ip TEXT,
  request_type TEXT NOT NULL,
  ingredients_count INTEGER,
  style_id TEXT,
  prompt_text TEXT,
  response_text TEXT,
  response_time_ms INTEGER,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  gemini_response JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX idx_llm_messages_timestamp ON llm_messages(timestamp);
CREATE INDEX idx_llm_messages_success ON llm_messages(success);
CREATE INDEX idx_llm_messages_request_type ON llm_messages(request_type);

-- Enable Row Level Security (optional)
ALTER TABLE llm_messages ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow inserts from your backend
CREATE POLICY "Allow backend inserts" ON llm_messages
  FOR INSERT WITH CHECK (true);

-- Create a policy for reading (you can restrict this)
CREATE POLICY "Allow backend reads" ON llm_messages
  FOR SELECT USING (true);
```

### 2. Deploy to Vercel

```bash
# Install dependencies
npm install

# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Add environment variables in Vercel dashboard:
# - GEMINI_API_KEY: Your Google Gemini API key
# - SUPABASE_URL: Your Supabase project URL
# - SUPABASE_ANON_KEY: Your Supabase anon key
```

### 3. Update Flutter App

Update your Flutter app to use the new backend:

```dart
// lib/core/constants/app_constants.dart
static const String backendUrl = 'https://your-vercel-app.vercel.app/api';

// lib/core/network/network_client.dart
Future<Map<String, dynamic>> post({
  required String endpoint,
  required Map<String, dynamic> data,
}) async {
  final response = await _dio.post(
    '${AppConstants.backendUrl}/$endpoint',
    data: jsonEncode(data),
    options: Options(
      headers: {'Content-Type': 'application/json'},
    ),
  );
  return response.data;
}
```

## 🛠️ API Endpoints

### `POST /api/generate-recipe`
Generate a complete recipe.

**Request:**
```json
{
  "ingredients": [
    {"name": "chicken", "quantity": "2", "unit": "pieces"},
    {"name": "rice", "quantity": "1", "unit": "cup"}
  ],
  "styleId": "quick-easy"
}
```

**Response:**
```json
{
  "success": true,
  "recipe": "Generated recipe text...",
  "responseTime": 1234
}
```

### `POST /api/stream-recipe`
Stream recipe generation in real-time.

**Request:** Same as above
**Response:** Server-sent events stream

### `GET /api/analytics?period=24h`
Get usage analytics.

**Parameters:**
- `period`: `1h`, `24h`, `7d`, `30d`

**Response:**
```json
{
  "totalRequests": 150,
  "successRate": "98.5%",
  "averageResponseTime": "1234ms",
  "popularStyles": [
    {"style": "quick-easy", "count": 45},
    {"style": "healthy", "count": 32}
  ]
}
```

## 📊 Features

### ✅ **Security**
- API keys stored server-side only
- Rate limiting (10 requests/minute per IP)
- CORS protection
- Input validation

### ✅ **Monitoring**
- All requests logged to Supabase
- Response times tracked
- Error logging
- Success rates monitored

### ✅ **Analytics**
- Real-time usage stats
- Popular recipe styles
- Performance metrics
- Recent activity feed

### ✅ **Scalability**
- Serverless functions (auto-scaling)
- Efficient database queries
- Streaming support
- Rate limiting

## 🔧 Environment Variables

Create these in your Vercel dashboard:

```env
GEMINI_API_KEY=your_gemini_api_key_here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

## 📈 Analytics Dashboard

View your analytics at:
`https://your-vercel-app.vercel.app/api/analytics`

Example response:
```json
{
  "period": "24h",
  "totalRequests": 156,
  "successfulRequests": 154,
  "failedRequests": 2,
  "successRate": "98.72%",
  "averageResponseTime": "1245ms",
  "popularStyles": [
    {"style": "quick-easy", "count": 45},
    {"style": "healthy", "count": 32},
    {"style": "vegan", "count": 28}
  ]
}
```

## 🚀 Deployment Commands

```bash
# Development
npm run dev

# Production deployment
npm run deploy

# View logs
vercel logs
```

## 🛡️ Rate Limiting

Current limits:
- **10 requests per minute** per IP address
- **30 second timeout** per request
- **Automatic cleanup** of old rate limit data

## 📊 Database Schema

```sql
CREATE TABLE llm_messages (
  id BIGSERIAL PRIMARY KEY,
  client_ip TEXT,                 -- User IP for rate limiting
  request_type TEXT NOT NULL,     -- 'generate_recipe' or 'stream_recipe'
  ingredients_count INTEGER,      -- Number of ingredients
  style_id TEXT,                  -- Recipe style (quick-easy, healthy, etc.)
  prompt_text TEXT,               -- What was sent to Gemini
  response_text TEXT,             -- What Gemini returned
  response_time_ms INTEGER,       -- How long it took
  success BOOLEAN DEFAULT true,   -- Did it succeed?
  error_message TEXT,             -- Error if failed
  gemini_response JSONB,          -- Full Gemini response
  timestamp TIMESTAMPTZ DEFAULT NOW()
);
```

This gives you full visibility into your app's AI usage! 🎉 