"""
Pydantic schemas for the Quota resource.

These schemas define the shape of API request bodies and response payloads.
They are intentionally kept separate from the SQLAlchemy model so the API
contract is decoupled from the database structure.
"""

from datetime import datetime
from pydantic import BaseModel, ConfigDict, field_validator


# ==============================================================================
# Request Schemas (what the client sends IN)
# ==============================================================================

class QuotaCreate(BaseModel):
    """
    Schema for creating a new quota via POST /quota/{user_id}.

    Only the client-supplied field is listed here.
    used_storage and remaining_storage are calculated by the server.
    """
    total_storage: int  # Storage limit in bytes (e.g., 107374182400 = 100 GB)

    @field_validator("total_storage")
    @classmethod
    def total_storage_must_be_non_negative(cls, value: int) -> int:
        """Reject negative storage values at the schema level before hitting the DB."""
        if value < 0:
            raise ValueError("total_storage must be greater than or equal to 0.")
        return value


class QuotaUpdate(BaseModel):
    """
    Schema for updating an existing quota via PUT /quota/{user_id}.

    Only total_storage can be changed by the client.
    remaining_storage is always recalculated by the service.
    """
    total_storage: int

    @field_validator("total_storage")
    @classmethod
    def total_storage_must_be_non_negative(cls, value: int) -> int:
        if value < 0:
            raise ValueError("total_storage must be greater than or equal to 0.")
        return value


# ==============================================================================
# Response Schemas (what the server sends BACK)
# ==============================================================================

class QuotaResponse(BaseModel):
    """
    Schema for returning quota data in standard API responses.

    Mirrors the Quota ORM model fields exactly.
    """
    id: int
    user_id: int
    total_storage: int
    used_storage: int
    remaining_storage: int
    updated_at: datetime

    # from_attributes=True is required so Pydantic can read values from
    # SQLAlchemy ORM objects (which use attributes) instead of plain dicts.
    model_config = ConfigDict(from_attributes=True)


class QuotaSummary(BaseModel):
    """
    Schema for the GET /quota/{user_id}/summary endpoint.

    Adds a computed usage_percentage field that is calculated at runtime
    by the service — it does not exist as a column in the database.
    """
    user_id: int
    total_storage: int
    used_storage: int
    remaining_storage: int
    usage_percentage: float  # e.g., 30.0 means the user has used 30% of their quota.


class QuotaCachedSummary(BaseModel):
    """
    Response schema for GET /quota/{user_id}/summary when Redis caching is active.

    Mirrors QuotaSummary but uses the cache-payload field names
    (``used_bytes`` / ``free_bytes``) and adds ``polled_at`` so callers
    can tell how fresh the data is.

    Field mapping vs the DB model
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    - ``used_bytes``      → Quota.used_storage
    - ``free_bytes``      → Quota.remaining_storage
    - ``total_storage``   → Quota.total_storage  (unchanged)
    - ``usage_percentage`` → computed by quota_service
    - ``polled_at``       → UTC timestamp written when the DB was last queried
    """
    user_id: int
    total_storage: int
    used_bytes: int       # mirrors Quota.used_storage
    free_bytes: int       # mirrors Quota.remaining_storage
    usage_percentage: float
    polled_at: str        # ISO-8601 UTC string, e.g. "2026-08-27T12:00:00+00:00"
