import json
import logging
import time
import uuid
from datetime import datetime, timezone
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, Response
from sqlalchemy import select, text

from app.api.v1.routes import auth, connections, files, quota, striped
from app.core.config import settings
from app.core.ratelimit import limiter
from app.core.security import parse_token
from app.db.models import FileRecord
from app.db.session import SessionLocal, engine
from app.services.catalog import PLANS, PROVIDERS


class JSONFormatter(logging.Formatter):
    def format(self, record):
        payload = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        for key in ("request_id", "user_id", "method", "path", "status", "duration_ms"):
            if hasattr(record, key):
                payload[key] = getattr(record, key)
        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)
        return json.dumps(payload, ensure_ascii=False)


logging.basicConfig(level=logging.INFO, handlers=[logging.StreamHandler()], force=True)
for _handler in logging.getLogger().handlers:
    _handler.setFormatter(JSONFormatter())
# Uvicorn's default access log includes query strings; local signed URLs carry bearer secrets.
logging.getLogger("uvicorn.access").disabled = True
logger = logging.getLogger("nexuscloud")


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings.assert_safe()
    yield
    await engine.dispose()


app = FastAPI(title=settings.APP_NAME, version="1.0.0", lifespan=lifespan)


def _secure_response(response: Response, request_id: str) -> Response:
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Cache-Control"] = "no-store"
    if settings.production:
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response


@app.middleware("http")
async def guardrails(request: Request, call_next):
    request_id = request.headers.get("x-request-id")
    if not request_id or len(request_id) > 80 or any(ord(c) < 33 or ord(c) > 126 for c in request_id):
        request_id = str(uuid.uuid4())
    request.state.request_id = request_id
    if request.url.path.startswith("/api/v1/") and "/local-objects/" not in request.url.path:
        if request.method in ("POST", "PUT"):
            length = request.headers.get("content-length")
            if length is None:
                return _secure_response(JSONResponse({"error": {"code": "length_required", "message": "Content-Length is required", "request_id": request_id}}, status_code=411), request_id)
            if not length.isdigit() or int(length) > 65536:
                response = JSONResponse({"error": {"code": "request_too_large", "message": "Request body exceeds 64 KiB", "request_id": request_id}}, status_code=413)
                return _secure_response(response, request_id)
        if request.url.path in (
            "/api/v1/auth/register", "/api/v1/auth/login", "/api/v1/auth/refresh",
            "/api/v1/auth/forgot-password", "/api/v1/auth/reset-password",
            "/api/v1/auth/change-password", "/api/v1/auth/delete-account",
        ):
            try:
                await limiter.check(f"auth:{request.client.host if request.client else 'unknown'}", 10)
            except HTTPException as exc:
                response = JSONResponse({"error": {"code": "rate_limited", "message": exc.detail, "request_id": request_id}}, status_code=429)
                response.headers["Retry-After"] = "60"
                return _secure_response(response, request_id)
    started = time.perf_counter()
    response = await call_next(request)
    _secure_response(response, request_id)
    logger.info("request completed", extra={
        "request_id": request_id, "user_id": getattr(request.state, "user_id", None), "method": request.method,
        "path": request.url.path, "status": response.status_code,
        "duration_ms": round((time.perf_counter() - started) * 1000, 1),
    })
    return response


app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.CORS_ORIGINS.split(",") if origin.strip()],
    allow_credentials=False, allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type", "x-ms-blob-type", "X-Request-ID"],
    expose_headers=["X-Request-ID"],
)


@app.exception_handler(HTTPException)
async def http_error(request: Request, exc: HTTPException):
    codes = {400: "bad_request", 401: "unauthorized", 403: "forbidden", 404: "not_found", 409: "conflict", 422: "validation_error", 429: "rate_limited", 502: "provider_error"}
    return JSONResponse({"error": {"code": codes.get(exc.status_code, "error"), "message": exc.detail, "request_id": getattr(request.state, "request_id", None)}}, status_code=exc.status_code)


@app.exception_handler(RequestValidationError)
async def validation_error(request: Request, exc: RequestValidationError):
    details = [{"field": ".".join(str(x) for x in error["loc"]), "message": error["msg"]} for error in exc.errors()]
    return JSONResponse({"error": {"code": "validation_error", "message": "Invalid request", "details": details, "request_id": getattr(request.state, "request_id", None)}}, status_code=422)


@app.exception_handler(Exception)
async def server_error(request: Request, exc: Exception):
    logger.exception("Unhandled request error")
    return JSONResponse({"error": {"code": "internal_error", "message": "Internal server error", "request_id": getattr(request.state, "request_id", None)}}, status_code=500)


app.include_router(auth.router, prefix="/api/v1")
app.include_router(connections.router, prefix="/api/v1")
app.include_router(files.router, prefix="/api/v1")
app.include_router(striped.router, prefix="/api/v1")
app.include_router(quota.router, prefix="/api/v1")


@app.get("/")
async def root():
    return {"name": settings.APP_NAME, "api": "/api/v1", "docs": "/docs"}


@app.get("/health")
async def health():
    try:
        async with SessionLocal() as db:
            await db.execute(text("SELECT 1"))
        return {"status": "ok"}
    except Exception:
        raise HTTPException(503, "Database unavailable")


@app.get("/redis-health")
async def redis_health():
    from app.services.quota import redis_client
    client = redis_client()
    try:
        await client.ping()
        return {"status": "ok"}
    except Exception:
        raise HTTPException(503, "Redis unavailable")
    finally:
        await client.aclose()


@app.get("/api/v1/providers")
async def providers():
    return [
        {"name": spec.name, "free_bytes": spec.free_bytes, "inverse_egress": spec.inverse_egress, "permanent": spec.permanent}
        for spec in PROVIDERS.values()
    ]


@app.get("/api/v1/plans")
async def plans():
    return [{"name": spec.name, "max_connections": spec.max_connections, "max_bytes": spec.max_bytes, "seats": spec.seats} for spec in PLANS.values()]


def _local_file(file_id: uuid.UUID) -> Path:
    return Path(settings.LOCAL_STORAGE_PATH) / f"{file_id}.bin"


async def _check_local(file_id: uuid.UUID, token: str, kind: str) -> FileRecord:
    if not settings.LOCAL_STORAGE_ENABLED or settings.production:
        raise HTTPException(404, "Not found")
    try:
        claims = parse_token(token, f"local-{kind}")
    except ValueError:
        raise HTTPException(403, "Invalid storage URL")
    if claims["sub"] != str(file_id):
        raise HTTPException(403, "Invalid storage URL")
    async with SessionLocal() as db:
        file = await db.get(FileRecord, file_id)
        if file is None or file.status != ("pending" if kind == "upload" else "active"):
            raise HTTPException(404, "File not found")
        return file


@app.put("/api/v1/local-objects/{file_id}")
async def local_upload(file_id: uuid.UUID, request: Request, token: str):
    file = await _check_local(file_id, token, "upload")
    if request.headers.get("content-type") and request.headers.get("content-type") != file.mime_type:
        raise HTTPException(400, "Content type does not match upload request")
    path = _local_file(file_id)
    path.parent.mkdir(parents=True, exist_ok=True)
    written = 0
    try:
        with path.open("wb") as output:
            async for chunk in request.stream():
                written += len(chunk)
                if written > file.size_bytes:
                    raise HTTPException(413, "Upload exceeds declared size")
                output.write(chunk)
    except Exception:
        path.unlink(missing_ok=True)
        raise
    return Response(status_code=200)


@app.get("/api/v1/local-objects/{file_id}")
async def local_download(file_id: uuid.UUID, token: str):
    file = await _check_local(file_id, token, "download")
    path = _local_file(file_id)
    if not path.is_file():
        raise HTTPException(404, "File not found")
    return FileResponse(path, media_type=file.mime_type, filename=file.original_name)
