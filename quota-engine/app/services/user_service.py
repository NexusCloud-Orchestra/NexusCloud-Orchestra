"""
User service — database operations for the User resource.

Keeping database logic here (instead of inside the router) means:
- Routes stay thin and readable.
- Business logic is easy to test independently.
- The same logic can be reused by multiple routes or future services.

All functions receive an AsyncSession and return SQLAlchemy model instances.
"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError

from app.models import User
from app.schemas.user import UserCreate


async def create_user(db: AsyncSession, data: UserCreate) -> User:
    """
    Insert a new user row into the database.

    Steps:
    1. Build a User ORM object from the incoming data.
    2. Add it to the session (marks it as pending INSERT).
    3. Commit the transaction (executes the INSERT).
    4. Refresh the object to load server-generated values (e.g., id, created_at).

    Raises:
        IntegrityError: If a user with the same email already exists.
    """
    new_user = User(name=data.name, email=data.email)
    db.add(new_user)

    try:
        await db.commit()
    except IntegrityError:
        # Roll back the failed transaction so the session stays usable.
        await db.rollback()
        raise  # Re-raise so the router can catch it and return HTTP 409.

    # Refresh loads the auto-generated fields (id, created_at) from the database.
    await db.refresh(new_user)
    return new_user


async def get_user_by_id(db: AsyncSession, user_id: int) -> User | None:
    """
    Fetch a single user by their primary key.

    Returns the User object if found, or None if no row matches.
    The router is responsible for converting None into a 404 response.
    """
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def get_all_users(db: AsyncSession) -> list[User]:
    """
    Fetch all users from the database, ordered by creation time (newest first).
    """
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    return list(result.scalars().all())


async def delete_user(db: AsyncSession, user_id: int) -> bool:
    """
    Delete a user by their primary key.

    Returns True if a user was found and deleted, False if the user did not exist.
    The router converts False into a 404 response.
    """
    user = await get_user_by_id(db, user_id)

    if user is None:
        return False

    await db.delete(user)
    await db.commit()
    return True
