from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Dict, Any
from app.models.connection import Provider


class ConnectionCreate(BaseModel):
    provider: Provider
    display_name: str
    bucket_name: str
    region: str | None = None
    credentials: Dict[str, Any]


class ConnectionResponse(BaseModel):
    id: UUID
    user_id: UUID
    provider: Provider
    display_name: str
    bucket_name: str
    region: str | None = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
