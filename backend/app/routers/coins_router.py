# backend/app/routers/coins_router.py
# GET  /coins/me            → баланс + серия
# GET  /coins/transactions  → история (последние 20)
# GET  /coins/leaderboard   → топ-10
# POST /coins/daily-login   → начислить за вход

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import AsyncSessionLocal
from app.auth.auth import get_current_user_required
from app.services.coins_service import (
    get_balance, get_transactions, get_leaderboard, award_daily_login
)

router = APIRouter(prefix="/coins", tags=["coins"])


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session


@router.get("/me")
async def my_balance(
    user_id: int = Depends(get_current_user_required),
    db: AsyncSession = Depends(get_db),
):
    return await get_balance(db, user_id)


@router.get("/transactions")
async def my_transactions(
    user_id: int = Depends(get_current_user_required),
    db: AsyncSession = Depends(get_db),
):
    return await get_transactions(db, user_id, limit=30)


@router.get("/leaderboard")
async def leaderboard(
    user_id: int = Depends(get_current_user_required),
    db: AsyncSession = Depends(get_db),
):
    return await get_leaderboard(db, limit=10)


@router.post("/daily-login")
async def daily_login(
    user_id: int = Depends(get_current_user_required),
    db: AsyncSession = Depends(get_db),
):
    return await award_daily_login(db, user_id)