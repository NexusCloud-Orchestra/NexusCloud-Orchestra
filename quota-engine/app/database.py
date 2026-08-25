"""
Database configuration and session management.

This module sets up the SQLAlchemy async database engine, session makers, and the
declarative base for our ORM models. It reads configuration from the environment
using python-dotenv.
"""

import os
from typing import AsyncGenerator
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker, AsyncEngine
from sqlalchemy.orm import DeclarativeBase

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
# create_async_engine() initializes an async connection pool to the database using
# the specified async driver (asyncpg) and connection credentials. It doesn't connect
# to the database immediately; the connection is established only when a query is executed.
print("DATABASE_URL =", DATABASE_URL)
engine: AsyncEngine = create_async_engine(
    DATABASE_URL,
    # echo=True prints all generated SQL statements to standard out.
    # Very useful for debugging during development.
    echo=True,
)

# ==============================================================================
# Async Session Maker Configuration
# ==============================================================================
# AsyncSessionLocal is a factory for async database sessions. Each call creates
# an AsyncSession bound to our async engine.
#
# - autocommit=False: Prevents transactions from committing automatically. You must
#   explicitly call db.commit() to persist changes.
# - autoflush=False: Prevents SQLAlchemy from sending pending changes to the database
#   before querying. Gives developers precise control over transaction flushes.
# - expire_on_commit=False: Keeps loaded attributes accessible after commit without
#   issuing additional SELECT queries (important for async contexts).
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
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
# Async Database Session Lifecycle Function
# ==============================================================================
# This async generator yields an AsyncSession for use as a FastAPI dependency.
# It handles the full lifecycle of the session:
# 1. Open the async session.
# 2. Yield it to the caller (used as a FastAPI dependency via Depends).
# 3. Cleanly close it once the request cycle finishes, returning the connection to the pool.
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Async database session dependency helper.

    Yields:
        AsyncSession: An async database session object bound to AsyncSessionLocal.
    """
    async with AsyncSessionLocal() as session:
        yield session
