from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import List, Dict, Any
from app.models.quota import TierType


class QuotaSnapshotResponse(BaseModel):
    connection_id: UUID
    used_bytes: int
    free_bytes: int
    limit_bytes: int
    tier_type: TierType
    expires_at: datetime | None = None
    polled_at: datetime | None = None

    model_config = {"from_attributes": True}


class QuotaConnectionDetail(BaseModel):
    connection_id: UUID
    display_name: str
    provider: str
    bucket_name: str
    used_bytes: int
    free_bytes: int
    limit_bytes: int
    tier_type: str


class QuotaSummaryResponse(BaseModel):
    total_used_bytes: int
    total_free_bytes: int
    total_limit_bytes: int
    by_connection: List[QuotaConnectionDetail]
