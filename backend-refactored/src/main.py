"""Main FastAPI application."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from src.core.config import get_settings
from src.core.database import create_tables
from src.routes import users, sessions, chat, images

settings = get_settings()

# Create FastAPI app
app = FastAPI(
    title=settings.api_title,
    version=settings.api_version,
    description=settings.api_description,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(users.router, prefix="/api/v1", tags=["users"])
app.include_router(sessions.router, prefix="/api/v1", tags=["sessions"])
app.include_router(chat.router, prefix="/api/v1", tags=["chat"])
app.include_router(images.router, prefix="/api/v1", tags=["images"])


@app.on_event("startup")
async def startup_event():
    """Initialize database on startup."""
    create_tables()


@app.get("/", include_in_schema=False)
async def root():
    """Root endpoint."""
    return JSONResponse({
        "message": "Recipe GPT API",
        "version": settings.api_version,
        "docs": "/docs"
    })


@app.get("/health", include_in_schema=False)
async def health_check():
    """Health check endpoint."""
    return JSONResponse({"status": "healthy"}) 