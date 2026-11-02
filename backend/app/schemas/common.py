from typing import TypeVar, Generic, Sequence, Optional
from pydantic import BaseModel, Field

T = TypeVar("T")


class PaginationParams(BaseModel):
    """Standard query parameters for paginated endpoints."""

    page: int = Field(default=1, ge=1, description="1-indexed page number")
    page_size: int = Field(default=20, ge=1, le=100, description="Items per page")


class PaginatedResponse(BaseModel, Generic[T]):
    """Standard paginated container schema."""

    items: Sequence[T] = Field(..., description="List of items for the requested page")
    total_count: int = Field(..., description="Total number of items matching filter")
    page: int = Field(..., description="Current page number")
    page_size: int = Field(..., description="Items per page")
    total_pages: int = Field(..., description="Total number of available pages")


class ErrorResponse(BaseModel):
    """Standardized error envelope."""

    error: str = Field(..., description="Human-readable error summary")
    detail: Optional[str] = Field(None, description="Detailed error explanation")
    request_id: Optional[str] = Field(None, description="Correlation request ID")

