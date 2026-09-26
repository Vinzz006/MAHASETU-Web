import math
from typing import Generic, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    items: list[T] = Field(..., description="Page of items")
    total: int = Field(..., description="Total count of items matching filter")
    page: int = Field(1, description="Current page number (1-indexed)")
    page_size: int = Field(20, description="Items per page")
    total_pages: int = Field(1, description="Total pages available")

    @classmethod
    def create(cls, items: list[T], total: int, page: int, page_size: int):
        total_pages = max(1, math.ceil(total / max(1, page_size)))
        return cls(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )
