"""
Quota service — all database operations for the Quota resource.

Keeping DB logic here rather than in the router means:
- Routes stay thin and readable.
- Business rules (remaining_storage calculation, duplicate check) are in one place.
- Logic can be reused later (e.g., file upload service will call update_used_storage).

All functions receive an AsyncSession and return ORM objects or primitives.
"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError

from app.models import Quota, User
from app.schemas.quota import QuotaCreate, QuotaUpdate, QuotaSummary


# ==============================================================================
# Internal helpers (not exposed outside this module)
# ==============================================================================

async def _get_user(db: AsyncSession, user_id: int) -> User | None:
    """
    Fetch a User by primary key.
    Used internally to verify a user exists before operating on their quota.
    """
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def _get_quota(db: AsyncSession, user_id: int) -> Quota | None:
    """
    Fetch a Quota by user_id (not by quota primary key).
    Each user has at most one quota, so user_id is the natural lookup key.
    """
    result = await db.execute(select(Quota).where(Quota.user_id == user_id))
    return result.scalar_one_or_none()


# ==============================================================================
# Public service functions (called by the router)
# ==============================================================================

async def create_quota(db: AsyncSession, user_id: int, data: QuotaCreate) -> Quota:
    """
    Create a quota for the given user.

    Business rules enforced here:
    1. The user must exist (raises ValueError if not).
    2. The user must not already have a quota (raises ValueError if one exists).
    3. used_storage is always 0 on creation.
    4. remaining_storage = total_storage - used_storage = total_storage.

    Raises:
        ValueError: If the user doesn't exist or already has a quota.
        IntegrityError: Re-raised if a DB-level unique constraint fires
                        (safety net for race conditions).
    """
    # Rule 1: Verify user exists.
    user = await _get_user(db, user_id)
    if user is None:
        raise ValueError(f"User with ID {user_id} does not exist.")

    # Rule 2: Check for existing quota.
    existing = await _get_quota(db, user_id)
    if existing is not None:
        raise ValueError(f"User {user_id} already has a quota. Use PUT to update it.")

    # Rule 3 & 4: Set computed fields.
    quota = Quota(
        user_id=user_id,
        total_storage=data.total_storage,
        used_storage=0,
        remaining_storage=data.total_storage,  # initially all storage is free
    )
    db.add(quota)

    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise  # Router will catch and return 409.

    await db.refresh(quota)
    return quota


async def get_quota(db: AsyncSession, user_id: int) -> Quota | None:
    """
    Return the quota for a user, or None if no quota exists.
    The router is responsible for checking whether the user exists first.
    """
    return await _get_quota(db, user_id)


async def get_quota_summary(db: AsyncSession, user_id: int) -> QuotaSummary | None:
    """
    Build the QuotaSummary for a user.

    usage_percentage calculation:
        (used_storage / total_storage) * 100

    Edge case: If total_storage is 0, percentage is 0.0 to avoid ZeroDivisionError.

    Returns None if no quota exists for the user.
    """
    quota = await _get_quota(db, user_id)
    if quota is None:
        return None

    # Safe division: avoid ZeroDivisionError when total_storage is 0.
    if quota.total_storage > 0:
        usage_percentage = round((quota.used_storage / quota.total_storage) * 100, 2)
    else:
        usage_percentage = 0.0

    return QuotaSummary(
        user_id=quota.user_id,
        total_storage=quota.total_storage,
        used_storage=quota.used_storage,
        remaining_storage=quota.remaining_storage,
        usage_percentage=usage_percentage,
    )


async def update_quota(db: AsyncSession, user_id: int, data: QuotaUpdate) -> Quota | None:
    """
    Update the total_storage of an existing quota and recalculate remaining_storage.

    Business rule:
        remaining_storage = total_storage - used_storage

    This must never go negative. If the new total_storage is less than
    what is already used, we clamp remaining_storage to 0 and the router
    should surface a warning (but we still allow the update).

    Returns None if the quota does not exist.
    """
    quota = await _get_quota(db, user_id)
    if quota is None:
        return None

    # Apply the new allocation.
    quota.total_storage = data.total_storage

    # Recalculate remaining storage.
    # max(..., 0) ensures remaining_storage never goes below zero,
    # which would be an invalid state.
    quota.remaining_storage = max(data.total_storage - quota.used_storage, 0)

    await db.commit()
    await db.refresh(quota)
    return quota


async def delete_quota(db: AsyncSession, user_id: int) -> bool:
    """
    Delete the quota for a user.

    Returns True if a quota was found and deleted, False if none existed.
    The router converts False into a 404 response.
    """
    quota = await _get_quota(db, user_id)
    if quota is None:
        return False

    await db.delete(quota)
    await db.commit()
    return True


async def user_exists(db: AsyncSession, user_id: int) -> bool:
    """
    Convenience check used by the router before any quota operation.
    Returns True if a user with the given ID exists.
    """
    return await _get_user(db, user_id) is not None


# ==============================================================================
# Quota mutation helpers -- called by file_service
# ==============================================================================
# All quota arithmetic lives in THIS module so the invariant
# (remaining = total - used) is enforced in exactly one place.
#
# IMPORTANT: Neither helper commits the session.
# file_service calls these helpers and then does a single db.commit()
# so the File insert + Quota update are always one atomic transaction.

async def apply_quota_add(db: AsyncSession, user_id: int, size: int) -> Quota:
    """
    Increase used_storage by `size` bytes and recalculate remaining_storage.

    Called by file_service before inserting a new File row.

    Raises ValueError if:
    - No quota exists for the user.
    - used_storage + size would exceed total_storage (not enough space).

    Does NOT commit -- the caller commits.
    """
    quota = await _get_quota(db, user_id)
    if quota is None:
        raise ValueError(
            f"User {user_id} has no quota. Create one first via POST /quota/{user_id}."
        )

    # Capacity check -- reject if the file would overflow the user limit.
    if quota.used_storage + size > quota.total_storage:
        available = quota.total_storage - quota.used_storage
        raise ValueError(
            f"Not enough storage. "
            f"File size: {size} bytes, "
            f"Available: {available} bytes."
        )

    # Mutate the quota object in the current session (not yet committed).
    quota.used_storage += size
    quota.remaining_storage = quota.total_storage - quota.used_storage
    return quota


async def apply_quota_subtract(db: AsyncSession, user_id: int, size: int) -> "Quota | None":
    """
    Decrease used_storage by `size` bytes and recalculate remaining_storage.

    Called by file_service before deleting a File row.

    Safety: used_storage is clamped to 0 via max(..., 0) so it can
    never go negative even if there is a pre-existing data inconsistency.

    Returns None if no quota exists (file still deleted; quota untouched).
    Does NOT commit -- the caller commits.
    """
    quota = await _get_quota(db, user_id)
    if quota is None:
        return None  # No quota to update -- caller can still delete the file.

    # Clamp to 0 so used_storage never goes negative.
    quota.used_storage = max(quota.used_storage - size, 0)
    quota.remaining_storage = quota.total_storage - quota.used_storage
    return quota
