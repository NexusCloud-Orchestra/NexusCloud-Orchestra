"""
Quota router — HTTP endpoints for the Quota resource.

URL pattern: /quota/{user_id}
All DB work is delegated to quota_service.py.
This file only handles HTTP concerns: parsing requests, returning responses, error codes.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError

from app.deps import get_db
from app.schemas.quota import QuotaCreate, QuotaUpdate, QuotaResponse, QuotaSummary
from app.services import quota_service

router = APIRouter(
    prefix="/quota",
    tags=["Quota"],
)


# ==============================================================================
# POST /quota/{user_id} — Create a quota for a user
# ==============================================================================
@router.post(
    "/{user_id}",
    response_model=QuotaResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a quota for a user",
)
async def create_quota(
    user_id: int,
    data: QuotaCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    Assign storage quota to a user.

    - The user must already exist (404 if not).
    - Each user can only have **one** quota (409 if one already exists).
    - `used_storage` is automatically set to **0**.
    - `remaining_storage` is automatically set equal to `total_storage`.
    - `total_storage` must be ≥ 0.
    """
    try:
        quota = await quota_service.create_quota(db, user_id, data)
    except ValueError as e:
        # ValueError means either: user not found, or quota already exists.
        # Inspect the message to pick the right HTTP status code.
        msg = str(e)
        if "does not exist" in msg:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=msg)
        else:
            # "already has a quota"
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=msg)
    except IntegrityError:
        # DB-level safety net (e.g., race condition on unique user_id constraint).
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"A quota for user {user_id} already exists.",
        )
    return quota


# ==============================================================================
# GET /quota/{user_id} — Get a user's quota
# ==============================================================================
@router.get(
    "/{user_id}",
    response_model=QuotaResponse,
    summary="Get a user's quota",
)
async def get_quota(user_id: int, db: AsyncSession = Depends(get_db)):
    """
    Return the quota assigned to a user.

    - Returns **404** if the user does not exist.
    - Returns **404** with a descriptive message if the user exists but has no quota yet.
    """
    # Check user existence first so we can give a meaningful 404 message.
    user_found = await quota_service.user_exists(db, user_id)
    if not user_found:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} does not exist.",
        )

    quota = await quota_service.get_quota(db, user_id)
    if quota is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User {user_id} exists but has no quota assigned yet. Use POST /quota/{user_id} to create one.",
        )

    return quota


# ==============================================================================
# GET /quota/{user_id}/summary — Get a dashboard-friendly quota summary
# ==============================================================================
@router.get(
    "/{user_id}/summary",
    response_model=QuotaSummary,
    summary="Get quota usage summary with percentage",
)
async def get_quota_summary(user_id: int, db: AsyncSession = Depends(get_db)):
    """
    Return quota usage including a computed `usage_percentage`.

    ```
    usage_percentage = (used_storage / total_storage) * 100
    ```

    - Returns **404** if the user does not exist.
    - Returns **404** if the user has no quota yet.
    - Safe against division by zero when `total_storage` is 0.
    """
    user_found = await quota_service.user_exists(db, user_id)
    if not user_found:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} does not exist.",
        )

    summary = await quota_service.get_quota_summary(db, user_id)
    if summary is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User {user_id} has no quota assigned yet.",
        )

    return summary


# ==============================================================================
# PUT /quota/{user_id} — Update total storage allocation
# ==============================================================================
@router.put(
    "/{user_id}",
    response_model=QuotaResponse,
    summary="Update a user's total storage allocation",
)
async def update_quota(
    user_id: int,
    data: QuotaUpdate,
    db: AsyncSession = Depends(get_db),
):
    """
    Change the `total_storage` limit for a user.

    The server will automatically recalculate `remaining_storage`:
    ```
    remaining_storage = total_storage - used_storage
    ```

    - Returns **404** if the user has no quota.
    - `remaining_storage` is clamped to 0 if the new `total_storage` is
      less than current `used_storage` (storage is over-allocated).
    """
    quota = await quota_service.update_quota(db, user_id, data)
    if quota is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No quota found for user {user_id}. Use POST /quota/{user_id} to create one first.",
        )
    return quota


# ==============================================================================
# DELETE /quota/{user_id} — Delete a user's quota
# ==============================================================================
@router.delete(
    "/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a user's quota",
)
async def delete_quota(user_id: int, db: AsyncSession = Depends(get_db)):
    """
    Remove the quota record for a user.

    - Returns **204 No Content** on success.
    - Returns **404** if no quota exists for this user.
    - Note: Deleting a user (via DELETE /users/{user_id}) also deletes their
      quota automatically due to the cascade setting in the User model.
    """
    deleted = await quota_service.delete_quota(db, user_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No quota found for user {user_id}.",
        )
    # 204 must return no body — FastAPI handles this automatically.
