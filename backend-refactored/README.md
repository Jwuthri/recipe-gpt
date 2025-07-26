# Recipe GPT Backend - Refactored

A clean, maintainable FastAPI backend for a cooking assistant that analyzes ingredients and provides recipes with chat functionality.

## 🏗️ Architecture

This is a refactored version following best practices:

- **Clean Code**: PEP8 standards, descriptive names, modular design
- **Proper Structure**: Organized into models, services, routes, schemas
- **Database**: Clean SQLAlchemy ORM with proper relationships
- **LLM Integration**: Structured message handling (system/user/assistant)
- **Testing**: Comprehensive test suite with pytest
- **Dev Experience**: Makefile, environment variables, type hints

## 📁 Project Structure

```
backend-refactored/
├── src/
│   ├── core/           # Configuration and database
│   ├── models/         # SQLAlchemy models
│   ├── schemas/        # Pydantic schemas
│   ├── services/       # Business logic
│   ├── routes/         # API endpoints
│   └── main.py         # FastAPI application
├── tests/              # Test suite
├── requirements.txt    # Dependencies
├── Makefile           # Development commands
└── README.md          # This file
```

## 🚀 Quick Start

### 1. Clone and Setup

```bash
# Clone the repository
cd backend-refactored

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
make install
```

### 2. Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your settings
nano .env
```

Required environment variables:
```env
GEMINI_API_KEY=your_gemini_api_key_here
DATABASE_URL=sqlite:///./recipe_gpt.db
```

### 3. Run the Application

```bash
# Development server with auto-reload
make run

# Or manually
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at:
- **API**: http://localhost:8000
- **Documentation**: http://localhost:8000/docs
- **Alternative Docs**: http://localhost:8000/redoc

## 🧪 Testing

```bash
# Run all tests
make test

# Run tests with coverage
make test-cov

# Run specific test file
pytest tests/test_models.py -v
```

## 🛠️ Development

### Code Quality

```bash
# Format code
make format

# Run linting
make lint

# Clean cache files
make clean
```

### Database

The application uses SQLAlchemy with automatic table creation on startup. For production, consider using Alembic migrations:

```bash
# Initialize Alembic (one time)
alembic init alembic

# Create migration
alembic revision --autogenerate -m "Create initial tables"

# Apply migration
alembic upgrade head
```

## 📚 API Endpoints

### Users
- `POST /api/v1/users/` - Create or get user
- `GET /api/v1/users/{user_id}` - Get user by ID

### Sessions  
- `POST /api/v1/sessions/` - Create chat session
- `GET /api/v1/sessions/{session_id}` - Get session
- `GET /api/v1/users/{user_id}/sessions/` - Get user sessions

### Chat
- `POST /api/v1/chat` - Send chat message
- `POST /api/v1/chat/stream` - Send chat message (streaming)

### Images
- `POST /api/v1/analyze-images` - Analyze images for ingredients

## 🏛️ Architecture Details

### Models
- **User**: Device-based user identification
- **ChatSession**: Conversation containers  
- **Message**: Individual messages with roles (system/user/assistant)

### Services
- **UserService**: User management
- **SessionService**: Session creation with system messages
- **ConversationService**: Message handling and conversation flow
- **LLMService**: AI interactions with structured message handling

### Message Flow
1. User creates session → System message automatically added
2. User sends message → Stored as user message
3. LLM generates response using full conversation history
4. Response stored as assistant message
5. Images stored as base64 in message metadata

## 🔧 Configuration

All configuration is centralized in `src/core/config.py` using Pydantic settings:

```python
# Example configuration
DATABASE_URL=sqlite:///./recipe_gpt.db
GEMINI_API_KEY=your_key
LLM_MAX_TOKENS=2048
LLM_TEMPERATURE=0.33
MAX_IMAGES_PER_REQUEST=3
```

## 🚢 Production Deployment

```bash
# Install production dependencies
pip install gunicorn

# Run with Gunicorn
gunicorn src.main:app -w 4 -k uvicorn.workers.UvicornWorker --host 0.0.0.0 --port 8000

# Or use the Makefile
make run-prod
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Write tests for new functionality
4. Ensure all tests pass: `make test`
5. Format code: `make format`
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License. 