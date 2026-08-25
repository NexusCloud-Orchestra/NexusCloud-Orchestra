"""
FastAPI Dependencies Module.

This module houses reusable dependencies for FastAPI route controllers.
All routes should import get_db from here rather than directly from database.py.
"""

# Re-export the async get_db dependency from database.py.
# This keeps deps.py as the single import point for route dependencies.
from app.database import get_db  # noqa: F401
