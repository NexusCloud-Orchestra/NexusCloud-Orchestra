from functools import lru_cache

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from app.core.config import settings


@lru_cache
def _session_factory() -> async_sessionmaker[AsyncSession]:
    # Each Celery task runs in its own asyncio.run() loop, so connections must not outlive a task.
    engine = create_async_engine(settings.DATABASE_URL, poolclass=NullPool)
    return async_sessionmaker(engine, expire_on_commit=False)


def worker_session() -> AsyncSession:
    return _session_factory()()


def reset_worker_engine() -> None:
    """Drop the cached engine (tests change settings.DATABASE_URL)."""
    _session_factory.cache_clear()
