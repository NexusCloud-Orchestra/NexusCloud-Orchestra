from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from sqlalchemy import select

from app.core.config import settings
import app.db.registry  # noqa: F401 — registers all models
from app.db.session import AsyncSessionLocal
from app.models.user import User
from app.core.security import hash_password
from app.api.v1 import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Seed demo user
    async with AsyncSessionLocal() as db:
        try:
            result = await db.execute(select(User).where(User.email == "demo@nexus.com"))
            demo_user = result.scalar_one_or_none()
            if not demo_user:
                demo_user = User(
                    first_name="Demo",
                    last_name="User",
                    email="demo@nexus.com",
                    password=hash_password("password123"),
                    plan="pro"
                )
                db.add(demo_user)
                await db.commit()
                print("\n[SEED] Demo account created: demo@nexus.com / password123\n")
        except Exception as e:
            print(f"\n[SEED] Error seeding demo account: {e}\n")
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.get("/health")
async def health():
    return {"status": "ok", "app": settings.APP_NAME}

