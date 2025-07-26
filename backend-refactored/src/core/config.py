"""Application configuration management."""

import os
from typing import Optional
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """Application settings."""
    
    # Database
    database_url: str = Field(
        default="sqlite:///./recipe_gpt.db",
        description="Database URL"
    )
    
    # LLM
    gemini_api_key: str = Field(
        ...,
        description="Google Gemini API key"
    )
    
    # API
    api_title: str = Field(
        default="Recipe GPT API",
        description="API title"
    )
    api_version: str = Field(
        default="2.0.0",
        description="API version"
    )
    api_description: str = Field(
        default="A cooking assistant API with ingredient analysis and recipe generation",
        description="API description"
    )
    
    # CORS
    cors_origins: list[str] = Field(
        default=["*"],
        description="Allowed CORS origins"
    )
    
    # File uploads
    max_upload_size: int = Field(
        default=10 * 1024 * 1024,  # 10MB
        description="Maximum file upload size in bytes"
    )
    max_images_per_request: int = Field(
        default=3,
        description="Maximum number of images per analysis request"
    )
    
    # LLM settings
    llm_max_tokens: int = Field(
        default=2048,
        description="Maximum tokens for LLM responses"
    )
    llm_temperature: float = Field(
        default=0.33,
        description="LLM temperature setting"
    )
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


# Global settings instance
settings = Settings()


def get_settings() -> Settings:
    """Get application settings."""
    return settings 