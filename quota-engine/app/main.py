"""
Quota Engine API Entrypoint.

This module initializes the FastAPI application, registers startup events for
database initialization, and defines basic endpoints.
"""

from contextlib import asynccontextmanager
from typing import Dict, AsyncGenerator
from fastapi import FastAPI

# Import database engine, Base class, and models.
# Importing models is critical so that they register their schemas on Base.metadata.
from app.database import Base, engine
import app.models  # noqa: F401


# ==============================================================================
# Lifespan Event Handler
# ==============================================================================
# Modern FastAPI applications use the lifespan event handler to manage startup and
# shutdown logic. Here, we ensure that the database tables are automatically created
# when the application starts up.
@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    print("Registered models:", Base.metadata.tables.keys())

    Base.metadata.create_all(bind=engine)

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
