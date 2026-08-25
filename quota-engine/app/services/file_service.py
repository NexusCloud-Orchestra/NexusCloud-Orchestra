"""
File service — all database operations for the File resource.

Business logic lives here, not in the router.
The key responsibility of this service is to keep Files and Quota in sync:
- Creating a file → quota.used_storage increases.
- Deleting a file → quota.used_storage decreases.

Both changes are committed in a single transaction so the two tables
are never left in an inconsistent state.

Raises typed exceptions (from app.exceptions) so routers can catch them
precisely without fragile string matching.
"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import File, User, Quota
from app.schemas.file import FileCreate
from app.exceptions import (
    UserNotFoundError,
    QuotaNotFoundError,
    InsufficientStorageError,
)


# ==============================================================================
# Internal helpers
# ==============================================================================

async def _get_user(db: AsyncSession, user_id: int) -> User | None:
    """Fetch a user by primary key."""
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def _get_quota(db: AsyncSession, user_id: int) -> Quota | None:
    """Fetch the quota for a given user_id."""
    result = await db.execute(select(Quota).where(Quota.user_id == user_id))
    return result.scalar_one_or_none()


async def _get_file_for_user(db: AsyncSession, user_id: int, file_id: int) -> File | None:
    """
    Fetch a file by file_id, scoped to user_id.

    Filtering on BOTH columns ensures a user cannot retrieve or delete
    another user's file by guessing file IDs.
    """
    result = await db.execute(
        select(File).where(File.id == file_id, File.user_id == user_id)
    )
    return result.scalar_one_or_none()


# ==============================================================================
# Public service functions
# ==============================================================================

async def create_file(db: AsyncSession, user_id: int, data: FileCreate) -> File:
    """
    Register a new file and update the user's quota atomically.

    Validation order (must be respected exactly):
    1. User must exist           → UserNotFoundError
    2. User must have a quota    → QuotaNotFoundError
    3. Enough remaining storage  → InsufficientStorageError

    If all checks pass:
    4. Stage File INSERT.
    5. Mutate quota.used_storage and quota.remaining_storage in-memory.
    6. Single db.commit() — file INSERT + quota UPDATE are atomic.
    7. Refresh and return the new File.
    """
    # ── Step 1: User must exist ──────────────────────────────────────────────
    user = await _get_user(db, user_id)
    if user is None:
        raise UserNotFoundError(f"User with ID {user_id} does not exist.")

    # ── Step 2: User must have a quota ───────────────────────────────────────
    quota = await _get_quota(db, user_id)
    if quota is None:
        raise QuotaNotFoundError(
            f"Quota for user with ID {user_id} does not exist. "
            f"Create one first via POST /quota/{user_id}."
        )

    # ── Step 3: Enough remaining storage ─────────────────────────────────────
    if quota.used_storage + data.size > quota.total_storage:
        available = quota.total_storage - quota.used_storage
        raise InsufficientStorageError(
            f"Not enough storage. "
            f"File size: {data.size} bytes, "
            f"Available: {available} bytes."
        )

    # ── Step 4: Build the File record ────────────────────────────────────────
    new_file = File(
        user_id=user_id,
        filename=data.filename,
        size=data.size,
        provider=data.provider,
    )
    db.add(new_file)

    # ── Step 5: Update quota in-memory (no commit yet) ───────────────────────
    quota.used_storage += data.size
    quota.remaining_storage = quota.total_storage - quota.used_storage

    # ── Step 6: Single atomic commit ─────────────────────────────────────────
    # Both the File INSERT and the Quota UPDATE land in one transaction.
    # If the commit fails, the AsyncSession context manager in get_db()
    # automatically rolls back, leaving both tables unchanged.
    await db.commit()

    # ── Step 7: Refresh to load server-generated fields (id, uploaded_at) ────
    await db.refresh(new_file)
    return new_file


async def get_files_by_user(db: AsyncSession, user_id: int) -> list[File]:
    """
    Return all files belonging to a user, ordered newest first.

    The caller (router) verifies the user exists before calling this.
    Returns an empty list if the user has no files.
    """
    result = await db.execute(
        select(File)
        .where(File.user_id == user_id)
        .order_by(File.uploaded_at.desc())
    )
    return list(result.scalars().all())


async def get_file(db: AsyncSession, user_id: int, file_id: int) -> File | None:
    """
    Return a single file by file_id, scoped to user_id.

    Returns None if the file doesn't exist or belongs to a different user.
    The caller (router) turns None into a 404.
    """
    return await _get_file_for_user(db, user_id, file_id)


async def delete_file(db: AsyncSession, user_id: int, file_id: int) -> bool:
    """
    Delete a file and update the user's quota atomically.

    Validation order:
    1. User must exist          → UserNotFoundError
    2. File must exist and      → returns False (router → 404)
       belong to user_id
    3. Update quota if one exists (quota missing → file still deleted safely).
    4. Delete the File row.
    5. Single db.commit() — quota UPDATE + file DELETE are atomic.

    Returns True if the file was found and deleted.
    """
    # ── Step 1: User must exist ──────────────────────────────────────────────
    user = await _get_user(db, user_id)
    if user is None:
        raise UserNotFoundError(f"User with ID {user_id} does not exist.")

    # ── Step 2: File must exist and belong to this user ──────────────────────
    file = await _get_file_for_user(db, user_id, file_id)
    if file is None:
        return False  # Router converts this to 404.

    # ── Step 3: Update quota if one exists ───────────────────────────────────
    # If the user somehow has no quota (e.g., it was deleted manually),
    # we still delete the file to avoid orphaned records.
    quota = await _get_quota(db, user_id)
    if quota is not None:
        # Clamp to 0 so used_storage never goes negative.
        quota.used_storage = max(quota.used_storage - file.size, 0)
        quota.remaining_storage = quota.total_storage - quota.used_storage

    # ── Step 4: Stage the file for DELETE ────────────────────────────────────
    await db.delete(file)

    # ── Step 5: Single atomic commit ─────────────────────────────────────────
    await db.commit()
    return True


async def user_exists(db: AsyncSession, user_id: int) -> bool:
    """Check whether a user exists. Used by the router for GET/DELETE guards."""
    return await _get_user(db, user_id) is not None
