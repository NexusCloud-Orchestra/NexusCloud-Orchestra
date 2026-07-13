"""
FastAPI Dependencies Module.

This module houses reusable dependencies for FastAPI route controllers.
"""

from typing import Generator
from sqlalchemy.orm import Session
from app.database import SessionLocal

def get_db() -> Generator[Session, None, None]:
    """
    Dependency to get a SQLAlchemy database session.
    
    Yields:
        Session: An active database session.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
