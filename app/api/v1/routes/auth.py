import asyncio
import logging
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import delete, func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.deps import audit, current_user
from app.core.security import digest_token, hash_password, parse_token, verify_password
from app.db.models import AccessRevocation, AuditLog, CloudConnection, FileRecord, PasswordReset, Quota, RefreshSession, User
from app.db.session import get_db
from app.schemas import AuditOut, ChangePasswordIn, DeleteAccountIn, EmailIn, LoginIn, PlanIn, RefreshIn, RegisterIn, ResetIn, TokenOut, UserOut
from app.services.auth import create_reset, create_tokens, revoke_sessions, send_reset_email
from app.services.catalog import PLANS
from app.services.quota import invalidate_quota

router = APIRouter(prefix="/auth", tags=["auth"])
logger = logging.getLogger(__name__)


@router.post("/register", response_model=UserOut, status_code=201)
async def register(body: RegisterIn, request: Request, db: AsyncSession = Depends(get_db)):
    email = body.email.lower()
    if await db.scalar(select(User.id).where(User.email == email)):
        raise HTTPException(409, "Email already registered")
    user = User(first_name=body.first_name.strip(), last_name=body.last_name.strip(), email=email, password_hash=hash_password(body.password))
    db.add(user)
    await db.flush()
    db.add(Quota(user_id=user.id, used_bytes=0))
    audit(db, request, user.id, "REGISTER")
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(409, "Email already registered")
    return user


@router.post("/login", response_model=TokenOut)
async def login(body: LoginIn, request: Request, db: AsyncSession = Depends(get_db)):
    user = await db.scalar(select(User).where(User.email == body.email.lower()))
    if user is None or not user.is_active or not verify_password(body.password, user.password_hash):
        raise HTTPException(401, "Invalid email or password")
    tokens = await create_tokens(db, user)
    audit(db, request, user.id, "LOGIN")
    await db.commit()
    return tokens


@router.post("/refresh", response_model=TokenOut)
async def refresh(body: RefreshIn, db: AsyncSession = Depends(get_db)):
    try:
        claims = parse_token(body.refresh_token, "refresh")
        user_id = uuid.UUID(claims["sub"])
    except (ValueError, KeyError):
        raise HTTPException(401, "Invalid or expired token")
    user = await db.get(User, user_id, with_for_update=True)
    session = await db.scalar(select(RefreshSession).where(RefreshSession.token_hash == digest_token(body.refresh_token)).with_for_update())
    if user is None or not user.is_active or user.token_version != claims["ver"] or session is None or session.revoked_at is not None:
        raise HTTPException(401, "Invalid or expired token")
    session.revoked_at = datetime.now(timezone.utc)
    tokens = await create_tokens(db, user)
    await db.commit()
    return tokens


@router.post("/logout", status_code=204)
async def logout(request: Request, user: User = Depends(current_user), db: AsyncSession = Depends(get_db)):
    token = request.headers["authorization"].split(" ", 1)[1]
    claims = parse_token(token, "access")
    db.add(AccessRevocation(
        user_id=user.id, jti_hash=digest_token(claims["jti"]),
        expires_at=datetime.fromtimestamp(claims["exp"], tz=timezone.utc),
    ))
    await revoke_sessions(db, user)
    audit(db, request, user.id, "LOGOUT")
    await db.commit()


@router.get("/me", response_model=UserOut)
async def me(user: User = Depends(current_user)):
    return user


@router.post("/forgot-password")
async def forgot_password(body: EmailIn, db: AsyncSession = Depends(get_db)):
    user = await db.scalar(select(User).where(User.email == body.email.lower(), User.is_active.is_(True)))
    if user and settings.SMTP_HOST:
        token = await create_reset(db, user)
        await db.commit()
        try:
            await asyncio.to_thread(send_reset_email, user.email, token)
        except Exception:
            logger.exception("Password reset delivery failed")
    return {"message": "If this email exists, a reset link will be sent."}


@router.post("/reset-password")
async def reset_password(body: ResetIn, request: Request, db: AsyncSession = Depends(get_db)):
    user = await db.scalar(select(User).where(User.email == body.email.lower()).with_for_update())
    reset = await db.scalar(select(PasswordReset).where(PasswordReset.token_hash == digest_token(body.token)).with_for_update())
    if not user or not reset or reset.user_id != user.id or reset.used_at is not None or reset.expires_at.replace(tzinfo=timezone.utc) <= datetime.now(timezone.utc):
        raise HTTPException(400, "Invalid or expired reset token")
    reset.used_at = datetime.now(timezone.utc)
    user.password_hash = hash_password(body.new_password)
    await revoke_sessions(db, user)
    audit(db, request, user.id, "PASSWORD_RESET")
    await db.commit()
    return {"message": "Password updated"}


@router.post("/change-password")
async def change_password(body: ChangePasswordIn, request: Request, user: User = Depends(current_user), db: AsyncSession = Depends(get_db)):
    if not verify_password(body.current_password, user.password_hash):
        raise HTTPException(400, "Current password is incorrect")
    user.password_hash = hash_password(body.new_password)
    await revoke_sessions(db, user)
    audit(db, request, user.id, "PASSWORD_CHANGE")
    await db.commit()
    return {"message": "Password updated. Sign in again."}


@router.post("/plan", response_model=UserOut)
async def set_plan(body: PlanIn, request: Request, user: User = Depends(current_user), db: AsyncSession = Depends(get_db)):
    user = await db.scalar(select(User).where(User.id == user.id).with_for_update())
    target = PLANS[body.plan]
    if body.plan not in ("free", user.plan):
        raise HTTPException(403, "Paid upgrades require a verified billing integration")
    count = await db.scalar(select(func.count()).select_from(CloudConnection).where(CloudConnection.user_id == user.id, CloudConnection.is_active.is_(True)))
    quota = await db.scalar(select(Quota).where(Quota.user_id == user.id))
    pending = await db.scalar(select(func.coalesce(func.sum(FileRecord.size_bytes), 0)).where(FileRecord.user_id == user.id, FileRecord.status == "pending"))
    if target.max_connections is not None and count > target.max_connections:
        raise HTTPException(409, "Disconnect clouds before downgrading")
    if target.max_bytes is not None and quota.used_bytes + pending > target.max_bytes:
        raise HTTPException(409, "Delete files before downgrading")
    user.plan = body.plan
    audit(db, request, user.id, "PLAN_CHANGE", body.plan)
    await db.commit()
    await invalidate_quota(user.id)
    return user


@router.get("/audit-logs", response_model=list[AuditOut])
async def audit_logs(user: User = Depends(current_user), db: AsyncSession = Depends(get_db)):
    return (await db.scalars(select(AuditLog).where(AuditLog.user_id == user.id).order_by(AuditLog.created_at.desc()).limit(100))).all()


@router.post("/delete-account", status_code=204)
async def delete_account(body: DeleteAccountIn, user: User = Depends(current_user), db: AsyncSession = Depends(get_db)):
    """Erase the account and all metadata (BRD 11.1). Cloud objects must be deleted first so none are orphaned."""
    user = await db.scalar(select(User).where(User.id == user.id).with_for_update())
    if not verify_password(body.password, user.password_hash):
        raise HTTPException(400, "Password is incorrect")
    remaining = await db.scalar(select(func.count()).select_from(FileRecord).where(
        FileRecord.user_id == user.id, FileRecord.status.in_(("active", "pending", "cleanup_failed"))
    ))
    if remaining:
        raise HTTPException(409, "Delete your files or wait for pending upload cleanup before deleting the account")
    # Explicit child deletes keep this portable to databases without enforced FK cascades.
    for model in (FileRecord, CloudConnection, AuditLog, Quota, RefreshSession, AccessRevocation, PasswordReset):
        await db.execute(delete(model).where(model.user_id == user.id))
    await db.delete(user)
    await db.commit()
    await invalidate_quota(user.id)
