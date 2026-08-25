"""
Quota Engine API Entrypoint.

This module initializes the FastAPI application, registers startup events for
database initialization, and defines basic endpoints.
"""

from contextlib import asynccontextmanager
from typing import Dict, AsyncGenerator, List
import os
import json
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

# Import database engine, Base class, and models.
# Importing models is critical so that they register their schemas on Base.metadata.
from app.database import Base, engine
import app.models  # noqa: F401

# Import routers.
from app.routers import users
from app.routers import quota
from app.routers import files


# ==============================================================================
# Lifespan Event Handler
# ==============================================================================
# Modern FastAPI applications use the lifespan event handler to manage startup and
# shutdown logic. Here, we ensure that the database tables are automatically created
# when the application starts up.
@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    print("Registered models:", Base.metadata.tables.keys())

    # AsyncEngine requires running DDL via run_sync inside an async connection.
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    print("Tables created successfully!")

    yield


# ==============================================================================
# FastAPI Application Initialization
# ==============================================================================
app = FastAPI(
    title="Quota Engine API",
    version="1.0.0",
    lifespan=lifespan,
)

# ==============================================================================
# CORS Middleware
# ==============================================================================
# Reads ALLOWED_ORIGINS from .env (a JSON array of strings).
# Falls back to the Vite dev server ports if the variable is not set.
_raw_origins = os.getenv("ALLOWED_ORIGINS", '["http://localhost:3000","http://127.0.0.1:3000"]')
try:
    _allowed_origins: List[str] = json.loads(_raw_origins)
except (json.JSONDecodeError, TypeError):
    _allowed_origins = ["http://localhost:3000", "http://127.0.0.1:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==============================================================================
# Register Routers
# ==============================================================================
app.include_router(users.router)
app.include_router(quota.router)
app.include_router(files.router)


# ==============================================================================
# Route Definitions
# ==============================================================================

@app.get("/", response_model=Dict[str, str])
def read_root() -> Dict[str, str]:
    """
    Root endpoint for the Quota Engine API.
    
    Returns a simple message indicating that the API is running.
    """
    return {"message": "Quota Engine API is running"}


@app.get("/health", response_model=Dict[str, str])
def health_check() -> Dict[str, str]:
    """
    Health check endpoint.
    
    Used by monitoring systems, load balancers, or orchestrators to verify
    that the service is running and responsive.
    """
    return {"status": "healthy"}
