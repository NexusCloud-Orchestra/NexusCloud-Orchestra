"""Seed a demo user for local development.

Usage (from the repo root, with the backend venv active):

    python scripts/seed_demo.py

Credentials (printed again after seeding):

    Email:    demo@nexuscloud.dev
    Password: DemoPass123

The script is idempotent: it creates the user once, and thereafter only
reports that the account already exists. It uses the app's real password
hasher and models, so the account works with the live API (including
LOCAL_STORAGE_ENABLED development uploads).

Do NOT enable this in production.
"""

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import select

from app.core.security import hash_password
from app.db.models import Quota, User
from app.db.session import SessionLocal

DEMO_EMAIL = "demo@nexuscloud.dev"
DEMO_PASSWORD = "DemoPass123"


async def main() -> None:
    async with SessionLocal() as db:
        existing = await db.scalar(select(User).where(User.email == DEMO_EMAIL))
        if existing is not None:
            print(f"Demo account already exists: {DEMO_EMAIL}")
            return

        user = User(
            first_name="Demo",
            last_name="User",
            email=DEMO_EMAIL,
            password_hash=hash_password(DEMO_PASSWORD),
            plan="free",
        )
        db.add(user)
        await db.flush()
        db.add(Quota(user_id=user.id, used_bytes=0))
        await db.commit()

    print("Demo account created.")
    print(f"  Email:    {DEMO_EMAIL}")
    print(f"  Password: {DEMO_PASSWORD}")


if __name__ == "__main__":
    asyncio.run(main())
