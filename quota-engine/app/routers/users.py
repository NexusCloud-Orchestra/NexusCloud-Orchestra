"""
Users router — HTTP endpoints for the User resource.

This module defines the API surface: URL paths, HTTP methods,
request/response shapes, and error handling.
The actual database work is delegated to user_service.py.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError

from app.deps import get_db
from app.schemas.user import UserCreate, UserResponse
from app.services import user_service

# APIRouter groups all /users endpoints together.
# The prefix and tags are applied to every route defined in this file.
router = APIRouter(
    prefix="/users",
    tags=["Users"],
)


# ==============================================================================
# POST /users — Create a new user
# ==============================================================================
@router.post(
    "/",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new user",
)
async def create_user(
    data: UserCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new user with a unique email address.

    - **name**: The user's full name.
    - **email**: A valid, unique email address.

    Returns the created user including the auto-generated `id` and `created_at`.
    """
    try:
        user = await user_service.create_user(db, data)
    except IntegrityError:
        # A unique constraint violation means the email is already taken.
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"A user with the email '{data.email}' already exists.",
        )
    return user


# ==============================================================================
# GET /users — List all users
# ==============================================================================
@router.get(
    "/",
    response_model=list[UserResponse],
    summary="List all users",
)
async def list_users(db: AsyncSession = Depends(get_db)):
    """
    Return a list of all users, ordered newest first.
    """
    users = await user_service.get_all_users(db)
    return users


# ==============================================================================
# GET /users/{user_id} — Get one user
# ==============================================================================
@router.get(
    "/{user_id}",
    response_model=UserResponse,
    summary="Get a user by ID",
)
async def get_user(user_id: int, db: AsyncSession = Depends(get_db)):
    """
    Return a single user by their numeric ID.

    Returns **404** if no user with that ID exists.
    """
    user = await user_service.get_user_by_id(db, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} was not found.",
        )
    return user


# ==============================================================================
# DELETE /users/{user_id} — Delete a user
# ==============================================================================
@router.delete(
    "/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a user by ID",
)
async def delete_user(user_id: int, db: AsyncSession = Depends(get_db)):
    """
    Delete a user and all their associated data (files, quota) by ID.

    Returns **204 No Content** on success.
    Returns **404** if no user with that ID exists.
    """
    deleted = await user_service.delete_user(db, user_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} was not found.",
        )
    # 204 responses must have no body — FastAPI handles this automatically.
