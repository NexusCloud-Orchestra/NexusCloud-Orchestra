"""
Pydantic schemas for the File resource.

These define what the client sends in (FileCreate) and
what the API sends back (FileResponse).
"""

from datetime import datetime
from pydantic import BaseModel, ConfigDict, field_validator


# ==============================================================================
# Request Schema
# ==============================================================================

class FileCreate(BaseModel):
    """
    Schema for registering a new file via POST /files/{user_id}.

    This records file *metadata* only — no actual file bytes are uploaded here.
    """
    filename: str
    size: int       # File size in bytes (e.g., 10737418240 = 10 GB)
    provider: str   # Storage provider name (e.g., "backblaze", "aws_s3")

    @field_validator("filename")
    @classmethod
    def filename_must_not_be_empty(cls, value: str) -> str:
        """Reject blank filenames before they reach the database."""
        if not value.strip():
            raise ValueError("filename cannot be empty.")
        return value.strip()

    @field_validator("size")
    @classmethod
    def size_must_be_non_negative(cls, value: int) -> int:
        """File size cannot be negative."""
        if value < 0:
            raise ValueError("size must be greater than or equal to 0.")
        return value

    @field_validator("provider")
    @classmethod
    def provider_must_not_be_empty(cls, value: str) -> str:
        """Reject blank provider names."""
        if not value.strip():
            raise ValueError("provider cannot be empty.")
        return value.strip()


# ==============================================================================
# Response Schema
# ==============================================================================

class FileResponse(BaseModel):
    """
    Schema for returning file data in API responses.

    Maps directly to the File ORM model columns.
    """
    id: int
    user_id: int
    filename: str
    size: int
    provider: str
    uploaded_at: datetime

    # Required so Pydantic can read values from SQLAlchemy ORM objects.
    model_config = ConfigDict(from_attributes=True)
