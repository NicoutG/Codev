from pydantic import BaseModel, Field
from typing import Any, Optional


class IndicatorBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    indicator: Any  # JSON libre


class IndicatorCreate(IndicatorBase):
    pass


class IndicatorUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    indicator: Optional[Any] = None


class IndicatorResponse(IndicatorBase):
    id: int
    created_by: Optional[int] = None

    class Config:
        from_attributes = True
