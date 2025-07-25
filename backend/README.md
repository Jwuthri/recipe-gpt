# Recipe GPT Backend

A FastAPI backend for Recipe GPT that handles all LLM calls and provides database storage for users, sessions, and messages.

## Features

- 🤖 Google Gemini integration for image analysis and recipe generation
- 💾 PostgreSQL/SQLite database for data persistence
- 👥 User management with device-based identification
- 💬 Chat sessions with message history
- 📸 Image analysis to extract ingredients
- 🍳 Recipe generation and cooking assistance
- 🌊 Streaming chat responses
- 🚀 Production-ready with Docker support

## Setup

### Prerequisites

- Python 3.11+
- PostgreSQL (optional, SQLite used by default)
- Google Gemini API key

### Installation

1. **Clone and navigate to backend:**
   ```bash
   cd backend
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables:**
   Create a `.env` file:
   ```bash
   # Database (optional - defaults to SQLite)
   DATABASE_URL=postgresql://username:password@localhost:5432/recipe_gpt

   # Google Gemini API
   GEMINI_API_KEY=your_gemini_api_key_here

   # App Settings
   SECRET_KEY=your_secret_key_here
   DEBUG=True
   ```

5. **Run the application:**
   ```bash
   python main.py
   ```

   Or with uvicorn:
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

## API Endpoints

### Users
- `POST /users/` - Create a new user
- `GET /users/{user_id}` - Get user by ID

### Sessions
- `POST /sessions/` - Create a new chat session
- `GET /sessions/{session_id}` - Get session by ID
- `GET /users/{user_id}/sessions` - Get all sessions for a user

### Messages
- `GET /sessions/{session_id}/messages` - Get all messages for a session

### AI Features
- `POST /analyze-images` - Analyze images to extract ingredients
- `POST /chat` - Generate chat response (non-streaming)
- `POST /chat/stream` - Generate streaming chat response

## Database Schema

### Users
- `id` - Primary key
- `device_id` - Unique device identifier
- `username` - Optional username
- `email` - Optional email
- `created_at` - Creation timestamp

### Chat Sessions
- `id` - Primary key
- `user_id` - Foreign key to users
- `title` - Optional session title
- `ingredients` - JSON array of ingredients
- `session_type` - Type of session (chat, recipe_generation, etc.)
- `created_at` - Creation timestamp

### Messages
- `id` - Primary key
- `session_id` - Foreign key to sessions
- `content` - Message content
- `is_ai` - Boolean indicating if message is from AI
- `message_type` - Type of message (text, image, recipe, etc.)
- `metadata` - JSON metadata
- `created_at` - Creation timestamp

## Docker Deployment

1. **Build the image:**
   ```bash
   docker build -t recipe-gpt-backend .
   ```

2. **Run with Docker:**
   ```bash
   docker run -p 8000:8000 -e GEMINI_API_KEY=your_key recipe-gpt-backend
   ```

3. **With PostgreSQL:**
   ```bash
   docker run -p 8000:8000 \
     -e GEMINI_API_KEY=your_key \
     -e DATABASE_URL=postgresql://user:pass@host:5432/db \
     recipe-gpt-backend
   ```

## Development

### API Documentation
Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### Database Migrations
If using PostgreSQL and need migrations:
```bash
pip install alembic
alembic init alembic
# Configure alembic.ini and env.py
alembic revision --autogenerate -m "Initial migration"
alembic upgrade head
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | Database connection string | `sqlite:///./recipe_gpt.db` |
| `GEMINI_API_KEY` | Google Gemini API key | Required |
| `SECRET_KEY` | Secret key for security | Required |
| `DEBUG` | Debug mode | `False` |

## Integration with Frontend

The React Native app should be updated to call these backend endpoints instead of making direct LLM API calls. Key changes needed:

1. Replace direct Gemini API calls with HTTP requests to backend
2. Implement user creation and session management
3. Update image analysis to upload files to `/analyze-images`
4. Update chat functionality to use `/chat/stream` endpoint
5. Store session data and message history

## Security Considerations

- API keys are server-side only
- CORS is configured (update for production)
- Database credentials are environment-based
- User identification via device IDs
- Input validation on all endpoints

## Performance

- Async/await throughout for non-blocking operations
- Database connection pooling with SQLAlchemy
- Streaming responses for better UX
- Image optimization and validation
- Error handling and graceful degradation 