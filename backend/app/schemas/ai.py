"""
AI proxy schemas.
"""
from pydantic import BaseModel, Field
from typing import Optional


class AIRequest(BaseModel):
    """Request to AI proxy."""
    message: str = Field(..., min_length=1, max_length=10000)
    conversation_id: Optional[str] = None


class AIResponse(BaseModel):
    """Response from AI proxy."""
    success: bool
    message: Optional[str] = None
    response: Optional[str] = None
    error: Optional[str] = None
