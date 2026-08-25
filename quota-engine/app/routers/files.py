"""
Files router — HTTP endpoints for the File resource.

URL pattern: /files/{user_id} and /files/{user_id}/{file_id}
All DB and business logic is delegated to file_service.py.
This file only handles HTTP concerns: catching typed exceptions and
mapping them to the correct HTTP status codes.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.deps import get_db
from app.schemas.file import FileCreate, FileResponse
from app.services import file_service
from app.exceptions import (
    UserNotFoundError,
    QuotaNotFoundError,
    InsufficientStorageError,
)

router = APIRouter(
    prefix="/files",
    tags=["Files"],
)


# ==============================================================================
# POST /files/{user_id} — Register a new file
# ==============================================================================
@router.post(
    "/{user_id}",
    response_model=FileResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new file for a user",
)
async def create_file(
    user_id: int,
    data: FileCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    Record file metadata and deduct the file size from the user's quota.

    Validation order (enforced by the service):
    1. User must exist → **404**
    2. User must have a quota → **404**
    3. File size must fit in remaining storage → **400**

    - **filename**: Name of the file (must not be empty).
    - **size**: File size in bytes (must be ≥ 0).
    - **provider**: Storage backend name, e.g. `"backblaze"` or `"aws_s3"`.
    """
    try:
        file = await file_service.create_file(db, user_id, data)
    except UserNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except QuotaNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except InsufficientStorageError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    return file


# ==============================================================================
# GET /files/{user_id} — List all files for a user
# ==============================================================================
@router.get(
    "/{user_id}",
    response_model=list[FileResponse],
    summary="List all files belonging to a user",
)
async def list_files(user_id: int, db: AsyncSession = Depends(get_db)):
    """
    Return all files registered for a user, ordered newest first.

    Returns **404** if the user does not exist.
    Returns an empty list `[]` if the user exists but has no files yet.
    """
    if not await file_service.user_exists(db, user_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} does not exist.",
        )

    return await file_service.get_files_by_user(db, user_id)


# ==============================================================================
# GET /files/{user_id}/{file_id} — Get a single file
# ==============================================================================
@router.get(
    "/{user_id}/{file_id}",
    response_model=FileResponse,
    summary="Get a single file by ID",
)
async def get_file(user_id: int, file_id: int, db: AsyncSession = Depends(get_db)):
    """
    Return a single file by its ID.

    The file must belong to the specified user — you cannot retrieve another
    user's file by guessing a file ID.

    Returns **404** if the user does not exist, the file does not exist,
    or the file belongs to a different user.
    """
    if not await file_service.user_exists(db, user_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} does not exist.",
        )

    file = await file_service.get_file(db, user_id, file_id)
    if file is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"File {file_id} not found for user {user_id}.",
        )
    return file


# ==============================================================================
# DELETE /files/{user_id}/{file_id} — Delete a file
# ==============================================================================
@router.delete(
    "/{user_id}/{file_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a file and reclaim its quota",
)
async def delete_file(user_id: int, file_id: int, db: AsyncSession = Depends(get_db)):
    """
    Delete a file record and add its size back to the user's remaining storage.

    After deletion:
    ```
    used_storage      -= file.size   (clamped to 0)
    remaining_storage  = total_storage - used_storage
    ```

    Returns **204 No Content** on success.
    Returns **404** if the user does not exist or the file does not exist /
    belongs to a different user.
    """
    try:
        deleted = await file_service.delete_file(db, user_id, file_id)
    except UserNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"File {file_id} not found for user {user_id}.",
        )
    # 204 must return no body — FastAPI handles this automatically.
