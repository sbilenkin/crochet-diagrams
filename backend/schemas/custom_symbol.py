from datetime import datetime
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class CustomSymbolCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    width: int = Field(gt=0)
    height: int = Field(gt=0)
    paths: list[str]
    anchors: list[dict[str, Any]]


class CustomSymbolUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    width: Optional[int] = Field(default=None, gt=0)
    height: Optional[int] = Field(default=None, gt=0)
    paths: Optional[list[str]] = None
    anchors: Optional[list[dict[str, Any]]] = None


class CustomSymbolResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    width: int
    height: int
    paths: list[str]
    anchors: list[dict[str, Any]]
    created_at: datetime
    updated_at: datetime
