from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from app.models.file_record import FileStatus


class FileUploadRequest(BaseModel):
    original_name: str
    size_bytes: int
    mime_type: str | None = None


class FileUploadResponse(BaseModel):
    file_id: UUID
    connection_id: UUID
    provider: str
    bucket_name: str
    upload_url: str


class FileResponse(BaseModel):
    id: UUID
    user_id: UUID
    connection_id: UUID
    provider: str
    connection_name: str
    object_key: str
    original_name: str
    size_bytes: int
    mime_type: str | None = None
    status: FileStatus
    created_at: datetime

    model_config = {"from_attributes": True}
