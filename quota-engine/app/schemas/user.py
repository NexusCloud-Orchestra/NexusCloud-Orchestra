"""
Pydantic schemas for the User resource.

Schemas define the shape of request bodies and response payloads.
They are separate from SQLAlchemy models so that the API contract
is independent of the database structure.
"""

from datetime import datetime
from pydantic import BaseModel, EmailStr, ConfigDict


# ==============================================================================
# Request Schema
# ==============================================================================

class UserCreate(BaseModel):
    """
    Schema for creating a new user.

    This is the shape of the JSON body the client sends to POST /users.
    FastAPI validates the incoming request against this automatically.
    """
    name: str
    email: EmailStr  # Validates that the value is a properly formatted email address.


# ==============================================================================
# Response Schema
# ==============================================================================

class UserResponse(BaseModel):
    """
    Schema for returning user data in API responses.

    This controls exactly what fields are sent back to the client.
    We never expose internal database details beyond what is listed here.
    """
    id: int
    name: str
    email: str
    created_at: datetime

    # from_attributes=True tells Pydantic to read field values from
    # SQLAlchemy ORM object attributes instead of dictionary keys.
    # Without this, Pydantic would fail to serialize ORM objects.
    model_config = ConfigDict(from_attributes=True)
