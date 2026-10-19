import secrets
import smtplib
import uuid
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage
from urllib.parse import urlencode

from fastapi import Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import digest_token, hash_password, issue_token
from app.db.models import PasswordReset, RefreshSession, User
from app.schemas import TokenOut


REFRESH_COOKIE = "nc_refresh"
REFRESH_COOKIE_PATH = "/api/v1/auth"


async def create_tokens(db: AsyncSession, user: User, family_id: uuid.UUID | None = None) -> tuple[TokenOut, str]:
    """Issue an access token and a refresh token; a new login starts a new refresh family."""
    access, _, _ = issue_token(user.id, user.token_version, "access", timedelta(minutes=settings.ACCESS_TOKEN_TTL_MINUTES))
    refresh, _, expires = issue_token(user.id, user.token_version, "refresh", timedelta(days=settings.REFRESH_TOKEN_TTL_DAYS))
    db.add(RefreshSession(
        user_id=user.id, family_id=family_id or uuid.uuid4(), token_hash=digest_token(refresh), expires_at=expires,
    ))
    return TokenOut(access_token=access, expires_in=settings.ACCESS_TOKEN_TTL_MINUTES * 60), refresh


async def revoke_sessions(db: AsyncSession, user: User, reason: str) -> None:
    sessions = (await db.scalars(select(RefreshSession).where(RefreshSession.user_id == user.id, RefreshSession.revoked_at.is_(None)))).all()
    for session in sessions:
        session.revoked_at = datetime.now(timezone.utc)
        session.revoked_reason = reason
    user.token_version += 1


def set_refresh_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        REFRESH_COOKIE, token, max_age=settings.REFRESH_TOKEN_TTL_DAYS * 86400, path=REFRESH_COOKIE_PATH,
        domain=settings.COOKIE_DOMAIN, secure=settings.cookie_secure, httponly=True, samesite="strict",
    )


def clear_refresh_cookie(response: Response) -> None:
    response.delete_cookie(
        REFRESH_COOKIE, path=REFRESH_COOKIE_PATH, domain=settings.COOKIE_DOMAIN,
        secure=settings.cookie_secure, httponly=True, samesite="strict",
    )


async def create_reset(db: AsyncSession, user: User) -> str:
    token = secrets.token_urlsafe(32)
    db.add(PasswordReset(
        user_id=user.id, token_hash=digest_token(token),
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=settings.RESET_TOKEN_TTL_MINUTES)
    ))
    return token


def send_reset_email(email: str, token: str) -> None:
    if not settings.SMTP_HOST:
        # Development has no configured mail transport. Never expose the token through the API.
        return
    message = EmailMessage()
    message["Subject"] = "Reset your NexusCloud password"
    message["From"] = settings.SMTP_FROM
    message["To"] = email
    query = urlencode({"token": token, "email": email})
    message.set_content(
        f"Open {settings.FRONTEND_URL.rstrip('/')}/reset-password?{query} "
        f"within {settings.RESET_TOKEN_TTL_MINUTES} minutes."
    )
    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as smtp:
        smtp.starttls()
        if settings.SMTP_USERNAME:
            smtp.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
        smtp.send_message(message)
