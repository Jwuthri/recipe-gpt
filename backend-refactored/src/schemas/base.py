"""Base schema classes with common functionality."""

from datetime import datetime
from typing import Any, Dict
from pydantic import BaseModel, ConfigDict


class BaseSchema(BaseModel):
    """Base schema with common configuration."""
    
    model_config = ConfigDict(
        from_attributes=True,
        validate_assignment=True,
        arbitrary_types_allowed=True,
        use_enum_values=True
    )


class TimestampSchemaMixin(BaseModel):
    """Mixin for timestamp fields in schemas."""
    
    created_at: datetime
    updated_at: datetime | None = None


class ResponseSchema(BaseSchema, TimestampSchemaMixin):
    """Base response schema with timestamps."""
    
    id: int 