from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid
import logging

from app.core.deps import get_db, get_current_user
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.models.user import User
from app.models.audit import AuditLog, AuditAction
from app.schemas.user import (
    UserRegister,
    UserLogin,
    TokenResponse,
    UserResponse,
    ForgotPasswordRequest,
    ResetPasswordRequest,
)
from app.core.redis import redis_client

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["Auth"])


# ── Register ──────────────────────────────────────────────────────
@router.post("/register", response_model=UserResponse, status_code=201)
async def register(payload: UserRegister, db: AsyncSession = Depends(get_db)):
    # check duplicate email
    result = await db.execute(select(User).where(User.email == payload.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        first_name=payload.first_name,
        last_name=payload.last_name,
        email=payload.email,
        password=hash_password(payload.password),
    )
    db.add(user)
    await db.flush()   # get the user.id before commit

    # audit log
    db.add(AuditLog(user_id=user.id, action=AuditAction.REGISTER))
    await db.commit()
    return user


# ── Login ─────────────────────────────────────────────────────────
@router.post("/login", response_model=TokenResponse)
async def login(payload: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(payload.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account inactive")

    # audit log
    db.add(AuditLog(user_id=user.id, action=AuditAction.LOGIN))

    return TokenResponse(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
    )


# ── Refresh ───────────────────────────────────────────────────────
@router.post("/refresh", response_model=TokenResponse)
async def refresh(refresh_token: str, db: AsyncSession = Depends(get_db)):
    payload = decode_token(refresh_token)

    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    result = await db.execute(
        select(User).where(User.id == uuid.UUID(payload["sub"]))
    )
    user = result.scalar_one_or_none()

    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found")

    return TokenResponse(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
    )


# ── Me ────────────────────────────────────────────────────────────
@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)):
    return current_user


# ── Forgot Password ───────────────────────────────────────────────
@router.post("/forgot-password")
async def forgot_password(payload: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()

    # Generate token regardless to prevent timing attacks, but only store it if user exists
    reset_token = str(uuid.uuid4())
    if user:
        # Save token with email in Redis for 15 minutes (900 seconds)
        await redis_client.set(f"reset_token:{reset_token}", payload.email, ex=900)
        # Log to server console so the developer can retrieve it locally
        print(f"\n[PASSWORD RESET] For user {payload.email}, reset token is: {reset_token}")
        print(f"[PASSWORD RESET] Reset Link: http://localhost:3000/reset-password?token={reset_token}&email={payload.email}\n")
        logger.info(f"Generated password reset token for {payload.email}")

    return {"detail": "If the email address is registered, a password reset link has been generated and printed to the server logs."}


# ── Reset Password ────────────────────────────────────────────────
@router.post("/reset-password")
async def reset_password(payload: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    # Retrieve email from token
    stored_email = await redis_client.get(f"reset_token:{payload.token}")
    if not stored_email or stored_email != payload.email:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=400, detail="User not found")

    # Update password and clear token
    user.password = hash_password(payload.new_password)
    await redis_client.delete(f"reset_token:{payload.token}")

    # Log audit event
    db.add(AuditLog(user_id=user.id, action=AuditAction.CREDENTIAL_ACCESS, meta={"type": "password_reset"}))
    await db.commit()

    return {"detail": "Password has been reset successfully."}


# ── Audit Logs ───────────────────────────────────────────────────
@router.get("/audit-logs")
async def get_audit_logs(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve audit log activity trail for the current user."""
    result = await db.execute(
        select(AuditLog)
        .where(AuditLog.user_id == current_user.id)
        .order_by(AuditLog.created_at.desc())
        .limit(50)
    )
    return result.scalars().all()
