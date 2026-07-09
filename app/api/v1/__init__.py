from fastapi import APIRouter
from app.api.v1.routes.auth import router as auth_router
from app.api.v1.routes.connections import router as connections_router
from app.api.v1.routes.files import router as files_router
from app.api.v1.routes.quota import router as quota_router

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth_router)
api_router.include_router(connections_router)
api_router.include_router(files_router)
api_router.include_router(quota_router)
