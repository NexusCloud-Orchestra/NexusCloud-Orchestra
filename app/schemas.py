import re
from datetime import datetime
from typing import Any, Literal
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator


class RegisterIn(BaseModel):
    first_name: str = Field(min_length=1, max_length=50)
    last_name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)

    @field_validator("password")
    @classmethod
    def valid_password(cls, value: str) -> str:
        if len(value.encode("utf-8")) > 72:
            raise ValueError("Password must be at most 72 UTF-8 bytes")
        return value


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class EmailIn(BaseModel):
    email: EmailStr


class ResetIn(EmailIn):
    token: str
    new_password: str = Field(min_length=8, max_length=128)

    @field_validator("new_password")
    @classmethod
    def valid_password(cls, value: str) -> str:
        return RegisterIn.valid_password(value)


class ChangePasswordIn(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=128)

    @field_validator("new_password")
    @classmethod
    def valid_password(cls, value: str) -> str:
        return RegisterIn.valid_password(value)


class RefreshIn(BaseModel):
    refresh_token: str


class PlanIn(BaseModel):
    plan: Literal["free", "starter", "pro", "team"]


class UserOut(BaseModel):
    model_config = {"from_attributes": True}
    id: UUID
    first_name: str
    last_name: str
    email: EmailStr
    plan: str
    created_at: datetime


class TokenOut(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class ConnectionIn(BaseModel):
    provider: Literal["aws", "azure", "gcp", "r2", "b2", "oracle", "ibm"]
    display_name: str = Field(min_length=1, max_length=100)
    bucket_name: str = Field(min_length=1, max_length=255)
    region: str | None = Field(default=None, max_length=100)
    credentials: dict[str, Any] = Field(min_length=1)

    @field_validator("region")
    @classmethod
    def safe_region(cls, value: str | None) -> str | None:
        if value is not None and not re.fullmatch(r"[a-z0-9-]{1,100}", value):
            raise ValueError("Invalid region")
        return value

    @field_validator("bucket_name")
    @classmethod
    def safe_bucket(cls, value: str) -> str:
        if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9._-]{0,254}", value):
            raise ValueError("Invalid bucket or container name")
        return value

    @field_validator("credentials")
    @classmethod
    def validate_credential_values(cls, value: dict[str, Any]) -> dict[str, str]:
        if any(not isinstance(v, str) or not v or len(v) > 8192 for v in value.values()):
            raise ValueError("Credentials must contain nonempty strings")
        if len(value) > 20:
            raise ValueError("Too many credential fields")
        if "endpoint_url" in value:
            raise ValueError("Custom storage endpoints are not supported")
        return value


class ConnectionOut(BaseModel):
    model_config = {"from_attributes": True}
    id: UUID
    provider: str
    display_name: str
    bucket_name: str
    region: str | None
    is_active: bool
    created_at: datetime


class UploadIn(BaseModel):
    original_name: str = Field(min_length=1, max_length=255)
    size_bytes: int = Field(gt=0, le=5 * 1024**3)
    mime_type: str = Field(min_length=3, max_length=255)

    @field_validator("original_name")
    @classmethod
    def safe_name(cls, value: str) -> str:
        if "/" in value or "\\" in value or any(ord(c) < 32 for c in value):
            raise ValueError("Filename may not contain paths or control characters")
        return value


class UploadOut(BaseModel):
    file_id: UUID
    provider: str
    bucket_name: str
    upload_url: str
    expires_at: datetime
    required_headers: dict[str, str] = {}
    connection_id: UUID


class FileOut(BaseModel):
    model_config = {"from_attributes": True}
    id: UUID
    original_name: str
    size_bytes: int
    mime_type: str
    status: str
    uploaded_at: datetime | None
    connection_id: UUID | None
    provider: str
    storage_mode: Literal["single", "striped"] = "single"


class StripeChunkIn(BaseModel):
    size_bytes: int = Field(gt=0, le=16 * 1024**2)
    sha256: str = Field(pattern=r"^[0-9a-f]{64}$")


class StripedUploadIn(UploadIn):
    chunks: list[StripeChunkIn] = Field(min_length=2, max_length=320)

    @model_validator(mode="after")
    def valid_chunks(self):
        chunk_bytes = 16 * 1024**2
        expected = (self.size_bytes + chunk_bytes - 1) // chunk_bytes
        if len(self.chunks) != expected:
            raise ValueError("Chunk count does not match file size")
        for index, chunk in enumerate(self.chunks):
            required = min(chunk_bytes, self.size_bytes - index * chunk_bytes)
            if chunk.size_bytes != required:
                raise ValueError(f"Chunk {index} has the wrong size")
        return self


class StripedChunkOut(BaseModel):
    index: int
    chunk_id: UUID
    connection_id: UUID
    provider: str
    size_bytes: int
    sha256: str


class StripedUploadOut(BaseModel):
    file_id: UUID
    index_version: int
    index_hash: str
    expires_at: datetime
    chunks: list[StripedChunkOut]


class StripedManifestOut(BaseModel):
    file_id: UUID
    index_version: int
    original_name: str
    mime_type: str
    size_bytes: int
    index_hash: str
    chunks: list[StripedChunkOut]


class SignedChunkOut(BaseModel):
    url: str
    required_headers: dict[str, str] = {}
    expires_in_seconds: int


class AuditOut(BaseModel):
    model_config = {"from_attributes": True}
    id: UUID
    action: str
    resource_id: str | None
    ip_address: str | None
    user_agent: str | None
    created_at: datetime


class DeleteAccountIn(BaseModel):
    password: str = Field(min_length=1, max_length=128)


class RoutePreviewIn(BaseModel):
    size_bytes: int = Field(gt=0, le=5 * 1024**3)


class RouteWeights(BaseModel):
    capacity: float
    egress: float
    permanence: float
    fit: float


class RouteComponents(RouteWeights):
    """Weighted contribution of each factor; the four values sum to the candidate score."""


class RouteCandidateOut(BaseModel):
    connection_id: UUID
    provider: str
    display_name: str
    free_bytes: int
    eligible: bool
    score: float | None
    components: RouteComponents | None


class RoutePreviewOut(BaseModel):
    size_bytes: int
    selected_connection_id: UUID | None
    blocked_reason: Literal["no_connections", "plan_limit", "no_single_cloud", "insufficient_quota"] | None
    message: str | None
    weights: RouteWeights
    candidates: list[RouteCandidateOut]


class QuotaConnectionOut(BaseModel):
    connection_id: UUID
    provider: str
    display_name: str
    used_bytes: int
    reserved_bytes: int
    limit_bytes: int
    free_bytes: int


class QuotaSummaryOut(BaseModel):
    total_used_bytes: int
    total_free_bytes: int
    total_limit_bytes: int
    usage_percentage: float
    total_reserved_bytes: int = 0
    plan: str | None = None
    plan_limit_bytes: int | None = None
    by_connection: list[QuotaConnectionOut]
