from datetime import datetime
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ProjectCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: Optional[str] = None


class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    description: Optional[str] = None


class ProjectSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    description: Optional[str] = None
    thumbnail: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class ProjectFull(ProjectSummary):
    canvas_json: dict[str, Any]


class CanvasSave(BaseModel):
    canvas_json: dict[str, Any]
    thumbnail: Optional[str] = None
