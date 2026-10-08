from pydantic import BaseModel, EmailStr
from typing import Optional
from uuid import UUID

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int = 900

class RefreshRequest(BaseModel):
    refresh_token: str

class LogoutRequest(BaseModel):
    refresh_token: str

class UserResponse(BaseModel):
    id: str
    email: EmailStr
    full_name: str
    is_active: bool

class ErrorDetail(BaseModel):
    detail: str
