"""
Database configuration and session management.

This module sets up the SQLAlchemy database engine, session makers, and the declarative
base for our ORM models. It reads configuration from the environment using python-dotenv.
"""

import os
from typing import Generator
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker, Session

# Load environment variables from the .env file.
# In a local development environment, this loads variables from the .env file.
# In production, variables are typically defined directly in the environment.
load_dotenv()

# Retrieve the Database URL from environment variables.
# Expecting a URL format like: postgresql+psycopg://postgres:password@localhost:5432/quota_engine
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set. Please check your .env file.")

# ==============================================================================
# Database Engine Initialization
# ==============================================================================
# create_engine() initializes the connection pool to the database using the specified
# driver and connection credentials. It doesn't connect to the database immediately;
# the connection is established only when a query is executed.
print("DATABASE_URL =", DATABASE_URL)
engine = create_engine(
    DATABASE_URL,
    # echo=True prints all generated SQL statements to standard out.
    # Very useful for debugging during development.
    echo=True,
)

# ==============================================================================
# Session Maker Configuration
# ==============================================================================
# SessionLocal is a factory for database sessions. Each call to SessionLocal()
# instantiates a database session.
#
# - autocommit=False: Prevents transactions from committing automatically. You must
#   explicitly call db.commit() to persist changes.
# - autoflush=False: Prevents SQLAlchemy from sending pending changes to the database
#   before querying. Gives developers precise control over transaction flushes.
# - bind=engine: Associates the sessions created by this factory with our engine.
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

# ==============================================================================
# Declarative Base Class
# ==============================================================================
# In SQLAlchemy 2.x, the standard way to define the mapping base class is subclassing
# DeclarativeBase. This acts as a registry for models and provides Python type-hinting support.
class Base(DeclarativeBase):
    """
    Declarative Base class for all ORM models.
    All models (User, File, Quota) will inherit from this base class.
    """
    pass


# ==============================================================================
# Database Session Lifecycle Function
# ==============================================================================
# This utility function yields a database session. It handles the lifecycle of a session:
# 1. Open the session.
# 2. Yield it to the caller (used as a FastAPI dependency).
# 3. Cleanly close it once the request cycle finishes, returning the connection to the pool.
def get_db() -> Generator[Session, None, None]:
    """
    Database session dependency helper.
    
    Yields:
        Session: A database session object bound to SessionLocal.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
