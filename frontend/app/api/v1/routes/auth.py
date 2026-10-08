"""FastAPI router for NexusCloud authentication endpoints."""
# OAuth2 and FastAPI compatible endpoints implementation matching contracts:
# POST /api/v1/auth/login
# POST /api/v1/auth/refresh
# GET  /api/v1/auth/me
# POST /api/v1/auth/logout

from app.schemas.auth import Token, RefreshRequest, LogoutRequest, UserResponse
from app.services.auth import AuthService
from app.core.deps import AuthContext
