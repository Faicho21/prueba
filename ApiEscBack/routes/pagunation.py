# routes/pagination_types.py
from __future__ import annotations
from typing import Optional, Literal, Dict, Any
from pydantic import BaseModel, ConfigDict

class SortSpec(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    field: Optional[str] = None
    dir: Optional[Literal['asc', 'desc']] = None

class PaginatedRequest(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    page: int = 1
    page_size: int = 20
    search: Optional[str] = None
    sort: Optional[SortSpec] = None
    filters: Optional[Dict[str, Any]] = None
