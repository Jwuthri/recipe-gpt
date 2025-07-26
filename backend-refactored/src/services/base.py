"""Base service class with common functionality."""

from typing import Any, Dict, Optional, Type, TypeVar
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status

from src.models.base import BaseModel

ModelType = TypeVar("ModelType", bound=BaseModel)


class BaseService:
    """Base service class with common CRUD operations."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_by_id(self, model_class: Type[ModelType], id: int) -> Optional[ModelType]:
        """Get a record by ID."""
        return self.db.query(model_class).filter(model_class.id == id).first()
    
    def get_by_id_or_404(self, model_class: Type[ModelType], id: int) -> ModelType:
        """Get a record by ID or raise 404."""
        obj = self.get_by_id(model_class, id)
        if not obj:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"{model_class.__name__} not found"
            )
        return obj
    
    def create(self, model_class: Type[ModelType], **kwargs) -> ModelType:
        """Create a new record."""
        try:
            obj = model_class(**kwargs)
            self.db.add(obj)
            self.db.commit()
            self.db.refresh(obj)
            return obj
        except IntegrityError as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to create {model_class.__name__}: {str(e)}"
            )
    
    def update(self, obj: ModelType, **kwargs) -> ModelType:
        """Update an existing record."""
        try:
            obj.update(**kwargs)
            self.db.commit()
            self.db.refresh(obj)
            return obj
        except IntegrityError as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to update {obj.__class__.__name__}: {str(e)}"
            )
    
    def delete(self, obj: ModelType) -> None:
        """Delete a record."""
        self.db.delete(obj)
        self.db.commit()
    
    def commit(self) -> None:
        """Commit the current transaction."""
        self.db.commit()
    
    def rollback(self) -> None:
        """Rollback the current transaction."""
        self.db.rollback() 