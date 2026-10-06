import uuid
from datetime import datetime, timezone

from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import digest_token, parse_token
from app.db.models import AccessRevocation, User
from app.db.session import get_db

bearer = HTTPBearer(auto_error=False)


async def current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: AsyncSession = Depends(get_db),
) -> User:
    if credentials is None:
        raise HTTPException(401, "Authentication required")
    try:
        claims = parse_token(credentials.credentials, "access")
        user_id = uuid.UUID(claims["sub"])
    except (ValueError, KeyError):
        raise HTTPException(401, "Invalid or expired token")
    user = await db.get(User, user_id)
    if user is None or not user.is_active or user.token_version != claims.get("ver"):
        raise HTTPException(401, "Invalid or expired token")
    revoked = await db.scalar(select(AccessRevocation.id).where(AccessRevocation.jti_hash == digest_token(claims["jti"])))
    if revoked:
        raise HTTPException(401, "Invalid or expired token")
    return user


def audit(db: AsyncSession, request: Request, user_id: uuid.UUID, action: str, resource_id: str | None = None):
    from app.db.models import AuditLog
    db.add(AuditLog(
        user_id=user_id, action=action, resource_id=resource_id,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent", "")[:512],
    ))
