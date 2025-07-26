# Recipe GPT - Frontend ↔ Backend Connection Guide

## ✅ Connection Complete!

The `recipe-gpt-expo` app has been successfully connected to the new `backend-refactored` service.

## 🔧 Changes Made

### 1. Updated BackendService.js
- **API Prefix**: Added `/api/v1` prefix to all API endpoints
- **Image Analysis**: Updated to use `session_id` instead of `user_id` 
- **Session Management**: Improved session handling for image analysis
- **Error Handling**: Maintained compatibility with existing error handling

### 2. API Endpoint Mapping

| Frontend Call | Old Endpoint | New Endpoint |
|---------------|--------------|--------------|
| User Creation | `/users/` | `/api/v1/users/` |
| Session Creation | `/sessions/` | `/api/v1/sessions/` |
| Get User Sessions | `/users/{id}/sessions` | `/api/v1/users/{id}/sessions/` |
| Image Analysis | `/analyze-images` | `/api/v1/analyze-images` |
| Chat Messages | `/chat` | `/api/v1/chat` |
| Get Session Messages | `/sessions/{id}/messages` | `/api/v1/sessions/{id}` |

### 3. New Features Available
- **Improved Error Handling**: Better error responses from FastAPI backend
- **Enhanced API Documentation**: Automatic OpenAPI docs at `/docs`
- **Better Session Management**: More robust session tracking
- **Image Analysis**: Now properly integrated with sessions

## 🚀 Quick Start

### Option 1: Use the Startup Script
```bash
./start-dev.sh
```
Then choose option 3 to start both services.

### Option 2: Manual Start

1. **Start Backend**:
```bash
cd backend-refactored
./run.sh
```

2. **Start Frontend** (in new terminal):
```bash
cd recipe-gpt-expo
npm install
npm start
```

## 🔍 Testing the Connection

1. **Backend Health Check**: Visit `http://localhost:8000/health`
2. **API Documentation**: Visit `http://localhost:8000/docs`
3. **Frontend**: Open the Expo app and try:
   - Taking photos of ingredients
   - Generating recipes
   - Chatting with the AI

## 📱 Mobile Testing

- **iOS Simulator**: `npm run ios` in the expo directory
- **Android Emulator**: `npm run android` in the expo directory
- **Physical Device**: Use Expo Go app to scan QR code

## ⚠️ Requirements

- **Backend**: Python 3.8+, pip, GEMINI_API_KEY in `.env`
- **Frontend**: Node.js, npm, Expo CLI
- **Network**: Both services run on localhost:8000 (backend) and Expo dev server (frontend)

## 🐛 Troubleshooting

- **Connection Issues**: Ensure backend is running first
- **CORS Errors**: Already configured for cross-origin requests
- **Image Upload**: Requires active session (automatically created)
- **Environment Variables**: Set `GEMINI_API_KEY` in backend-refactored/.env

## 📝 Notes

- The app automatically creates sessions when needed
- All chat and image analysis is now properly tracked in the database
- The frontend maintains the same user experience while using the new robust backend 