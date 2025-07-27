# 🔐 API Key Security Guide

## Current Problem ⚠️

Your Gemini API key is currently stored in the Flutter app bundle (`.env` file), which means:
- ❌ **Anyone can extract it** from the app binary
- ❌ **No rate limiting control** 
- ❌ **Direct billing exposure**
- ❌ **Can't revoke access** for specific users

---

## 🛡️ Secure Solutions

### **Option 1: Backend Proxy Server** ⭐ **RECOMMENDED**

Create a simple backend that proxies requests to Gemini API.

#### **Quick Setup with Vercel/Netlify:**

```javascript
// api/generate-recipe.js (Vercel)
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body)
      }
    );

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate recipe' });
  }
}
```

**Flutter Changes:**
```dart
// Update network_client.dart
static const String backendUrl = 'https://your-app.vercel.app/api';

Future<Map<String, dynamic>> post({
  required String endpoint,
  required Map<String, dynamic> data,
}) async {
  final response = await _dio.post(
    '$backendUrl/$endpoint',  // No API key needed!
    data: jsonEncode(data),
  );
  return response.data;
}
```

---

### **Option 2: Firebase Functions** 🔥

Use Firebase for serverless backend.

#### **Setup:**
```bash
npm install -g firebase-tools
firebase init functions
```

```javascript
// functions/index.js
const functions = require('firebase-functions');
const fetch = require('node-fetch');

exports.generateRecipe = functions.https.onCall(async (data, context) => {
  // Optional: Add authentication
  // if (!context.auth) throw new functions.https.HttpsError('unauthenticated');

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${functions.config().gemini.api_key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }
    );

    return await response.json();
  } catch (error) {
    throw new functions.https.HttpsError('internal', 'Recipe generation failed');
  }
});
```

**Flutter Integration:**
```dart
// Add firebase_functions to pubspec.yaml
dependencies:
  cloud_functions: ^4.4.3

// Use in your app
final callable = FirebaseFunctions.instance.httpsCallable('generateRecipe');
final result = await callable.call(requestData);
```

---

### **Option 3: Supabase Edge Functions** 🚀

Modern, TypeScript-based serverless functions.

```typescript
// supabase/functions/generate-recipe/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const { data } = await req.json()
  
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${Deno.env.get('GEMINI_API_KEY')}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }
  )

  return new Response(JSON.stringify(await response.json()))
})
```

---

### **Option 4: Custom Express Server** 🔧

For more control and features.

```javascript
// server.js
const express = require('express');
const rateLimit = require('express-rate-limit');
const app = express();

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use(limiter);
app.use(express.json());

app.post('/api/generate-recipe', async (req, res) => {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body)
      }
    );

    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Generation failed' });
  }
});

app.listen(3000);
```

---

## 🚀 Implementation Steps

### **Quick Win: Vercel Deployment** (Recommended)

1. **Create Vercel Project:**
```bash
mkdir recipe-gpt-backend
cd recipe-gpt-backend
npm init -y
mkdir api
```

2. **Create API endpoint:**
```javascript
// api/generate-recipe.js
// (Code from Option 1 above)
```

3. **Deploy:**
```bash
npx vercel
# Add GEMINI_API_KEY environment variable in dashboard
```

4. **Update Flutter app:**
```dart
// lib/core/constants/app_constants.dart
static const String backendUrl = 'https://your-app.vercel.app/api';
```

---

## 🔧 Additional Security Features

### **User Authentication**
```dart
// Add Firebase Auth or similar
dependencies:
  firebase_auth: ^4.15.2
```

### **Request Signing**
```dart
// Add HMAC signatures to prevent tampering
import 'package:crypto/crypto.dart';

String generateSignature(String data, String secret) {
  var hmac = Hmac(sha256, utf8.encode(secret));
  return hmac.convert(utf8.encode(data)).toString();
}
```

### **Rate Limiting Client-Side**
```dart
class RateLimiter {
  static final Map<String, DateTime> _lastRequest = {};
  static const Duration minInterval = Duration(seconds: 2);

  static bool canMakeRequest(String userId) {
    final lastRequest = _lastRequest[userId];
    if (lastRequest == null) return true;
    
    return DateTime.now().difference(lastRequest) >= minInterval;
  }
}
```

---

## 📊 Comparison

| Solution | Cost | Complexity | Security | Performance |
|----------|------|------------|----------|-------------|
| **Vercel** | Free tier | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Firebase** | Pay-per-use | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Supabase** | Free tier | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Custom Server** | $5-20/month | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

---

## 🎯 Next Steps

1. **Choose a solution** (I recommend Vercel for simplicity)
2. **Set up backend proxy**
3. **Update Flutter app** to use backend
4. **Remove API key** from client code
5. **Add authentication** (optional but recommended)
6. **Deploy and test**

Want me to help you implement any of these solutions? 