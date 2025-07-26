"""Ingredient-related Pydantic schemas."""

from typing import List
from pydantic import Field

from .base import BaseSchema


class Ingredient(BaseSchema):
    """Schema for ingredient data."""
    
    name: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="Ingredient name"
    )
    quantity: str = Field(
        ...,
        min_length=1,
        max_length=50,
        description="Ingredient quantity"
    )
    unit: str = Field(
        ...,
        min_length=1,
        max_length=20,
        description="Unit of measurement"
    )


class IngredientAnalysisResponse(BaseSchema):
    """Schema for ingredient analysis response."""
    
    success: bool = Field(
        ...,
        description="Whether the analysis was successful"
    )
    ingredients: List[Ingredient] = Field(
        ...,
        description="List of detected ingredients"
    )
    message: str = Field(
        ...,
        description="Response message"
    ) 