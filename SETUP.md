# Recipe GPT - Backend Integration Setup

🎉 **Your Recipe GPT app now has a powerful Python FastAPI backend!**

## What Changed

- ✅ **All LLM calls moved to backend** - No more API keys in frontend
- ✅ **Database storage** - Users, sessions, and messages are now persisted
- ✅ **Better security** - API keys are server-side only
- ✅ **Scalability** - Can handle multiple users and sessions
- ✅ **Message history** - Chat conversations are saved
- ✅ **Session management** - Each recipe/chat session is tracked

## Quick Start

### 1. Start the Backend

```bash
cd backend
./start_dev.sh
```

The script will:
- Create a virtual environment if needed
- Install Python dependencies
- Create a `.env` file if missing
- Start the FastAPI server on `http://localhost:8000`

**Important**: You'll need to add your **Gemini API key** to the `.env` file when prompted.

### 2. Start the Frontend

```bash
cd recipe-gpt-expo
npm install  # Install new dependencies
npm start    # Start Expo
```

## Backend Architecture

### Database Schema
```
Users (device-based identification)
├── Sessions (chat/recipe sessions)
    └── Messages (conversation history)
```

### API Endpoints
- `POST /users/` - Create/get user
- `POST /sessions/` - Create chat session
- `POST /analyze-images` - Analyze fridge photos
- `POST /chat/stream` - Streaming chat responses
- `GET /sessions/{id}/messages` - Get chat history

### Key Features
- **Streaming responses** for real-time chat experience
- **Image analysis** with ingredient extraction
- **Recipe generation** with nutritional info
- **Session persistence** across app restarts
- **User management** via device IDs

## Development Workflow

### Backend Development
```bash
cd backend
source venv/bin/activate  # Activate virtual environment
uvicorn main:app --reload # Start with auto-reload
```

### Frontend Development
```bash
cd recipe-gpt-expo
npm start  # Start Expo development server
```

### API Documentation
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Database Options

### SQLite (Default - for development)
- Automatically created as `recipe_gpt.db`
- No additional setup required
- Perfect for development and testing

### PostgreSQL (Production recommended)
```bash
# Update .env file:
DATABASE_URL=postgresql://username:password@localhost:5432/recipe_gpt
```

### Docker with PostgreSQL
```bash
cd backend
docker-compose up -d  # Start backend + PostgreSQL
```

## Configuration

### Environment Variables (`.env`)
```env
# Database
DATABASE_URL=sqlite:///./recipe_gpt.db

# Google Gemini API
GEMINI_API_KEY=your_actual_api_key_here

# App Settings
SECRET_KEY=your_secret_key
DEBUG=True
```

### Frontend Configuration
Backend URL is automatically set:
- Development: `http://localhost:8000`
- Production: Update `BACKEND_URL` in `BackendService.js`

## Migration Notes

### What's Different for Users
- **First launch**: App will create a user account automatically
- **Sessions**: Each chat/recipe session is now saved
- **History**: Previous conversations persist
- **Offline**: App requires backend connection for LLM features

### Backward Compatibility
- All existing AI functionality works the same
- Same UI and user experience
- Existing screens and components unchanged

## Production Deployment

### Backend Deployment
```bash
# Build Docker image
docker build -t recipe-gpt-backend .

# Deploy with your preferred service (Railway, Render, etc.)
docker run -p 8000:8000 \
  -e GEMINI_API_KEY=your_key \
  -e DATABASE_URL=your_db_url \
  recipe-gpt-backend
```

### Frontend Deployment
- Update `BACKEND_URL` in `BackendService.js`
- Build and deploy as usual with Expo

## Troubleshooting

### Backend Issues
```bash
# Check backend is running
curl http://localhost:8000/

# View logs
uvicorn main:app --reload --log-level debug

# Reset database
rm recipe_gpt.db  # SQLite only
```

### Frontend Issues
```bash
# Clear cache
expo start --clear

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Common Errors

**"Connection refused"**
- Make sure backend is running on port 8000
- Check firewall settings

**"No API key"**
- Add your Gemini API key to backend `.env` file
- Restart backend after adding key

**"Database error"**
- Check database URL in `.env`
- For PostgreSQL, ensure database exists

## Next Steps

🚀 **Your app is now ready with a professional backend!**

### Potential Enhancements
- [ ] User authentication (login/signup)
- [ ] Recipe favorites and ratings
- [ ] Meal planning features
- [ ] Social sharing
- [ ] Recipe search and filtering
- [ ] Nutritional tracking
- [ ] Shopping list generation

### Monitoring & Analytics
- Add logging and error tracking
- Monitor API usage and performance
- Database query optimization
- User behavior analytics

---

**Need help?** Check the API documentation at `http://localhost:8000/docs` or review the code in the `backend/` directory. 