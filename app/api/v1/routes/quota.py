from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.deps import current_user
from app.db.models import User
from app.db.session import get_db
from app.schemas import QuotaSummaryOut
from app.services.quota import quota_summary

router = APIRouter(prefix="/quota", tags=["quota"])


@router.get("/summary", response_model=QuotaSummaryOut)
async def summary(user: User = Depends(current_user), db: AsyncSession = Depends(get_db)):
    return await quota_summary(db, user)
