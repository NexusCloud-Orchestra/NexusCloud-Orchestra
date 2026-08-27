"""
FastAPI Dependencies Module.

This module houses reusable dependencies for FastAPI route controllers.
All routes should import get_db from here rather than directly from database.py.
"""

from typing import Generator

# Re-export the async get_db dependency from database.py.
# This keeps deps.py as the single import point for route dependencies.
from app.database import get_db  # noqa: F401

# ---------------------------------------------------------------------------
# Redis dependency
# ---------------------------------------------------------------------------
# Yields the module-level redis_client singleton.  Routes that need Redis
# inject it via Depends(get_redis), keeping the dependency graph explicit
# and easy to override in tests.

from app.services.redis_client import redis_client as _redis_client


def get_redis() -> Generator:
    """
    FastAPI dependency that yields the Redis client singleton.

    Usage in a route::

        from app.deps import get_redis

        @router.get("/some-route")
        def my_route(redis = Depends(get_redis)):
            ...
    """
    yield _redis_client
