# backend/app/services/coins_service.py
# Вся логика начисления EduCoins

from datetime import datetime, date, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models.coins import UserCoins, CoinTransaction, UserStreak

# ── Суммы наград ──────────────────────────────────────────────────────────────

REWARD = {
    "lesson_complete":  5,
    "course_complete":  100,
    "daily_login":      10,
    "streak_3":         15,   # бонус за серию 3 дня
    "streak_7":         50,   # бонус за серию 7 дней
    "streak_30":        200,  # бонус за серию 30 дней
}

LABELS = {
    "lesson_complete":  "Урок пройден",
    "course_complete":  "Курс завершён 🎓",
    "daily_login":      "Ежедневный вход",
    "streak_3":         "Серия 3 дня подряд 🔥",
    "streak_7":         "Серия 7 дней подряд 🔥🔥",
    "streak_30":        "Серия 30 дней подряд 👑",
}

# ── Хелперы ───────────────────────────────────────────────────────────────────

async def _get_or_create_balance(db: AsyncSession, user_id: int) -> UserCoins:
    row = (await db.execute(
        select(UserCoins).where(UserCoins.user_id == user_id)
    )).scalar_one_or_none()
    if not row:
        row = UserCoins(user_id=user_id, balance=0, total_ever=0)
        db.add(row)
        await db.flush()
    return row


async def _add_coins(
    db: AsyncSession,
    user_id: int,
    reason: str,
    extra_label: str | None = None,
) -> int:
    """Начисляет монеты и записывает транзакцию. Возвращает новый баланс."""
    amount = REWARD.get(reason, 0)
    if amount <= 0:
        return 0

    balance_row = await _get_or_create_balance(db, user_id)
    balance_row.balance    += amount
    balance_row.total_ever += amount

    label = extra_label or LABELS.get(reason, reason)
    tx = CoinTransaction(user_id=user_id, amount=amount, reason=reason, label=label)
    db.add(tx)

    return balance_row.balance


# ── Публичные функции ─────────────────────────────────────────────────────────

async def award_lesson_complete(
    db: AsyncSession, user_id: int, lesson_title: str
) -> dict:
    new_balance = await _add_coins(
        db, user_id, "lesson_complete",
        extra_label=f"Урок пройден: {lesson_title}",
    )
    await db.commit()
    return {"awarded": REWARD["lesson_complete"], "balance": new_balance}


async def award_course_complete(
    db: AsyncSession, user_id: int, course_title: str
) -> dict:
    new_balance = await _add_coins(
        db, user_id, "course_complete",
        extra_label=f"Курс завершён: {course_title}",
    )
    await db.commit()
    return {"awarded": REWARD["course_complete"], "balance": new_balance}


async def award_daily_login(db: AsyncSession, user_id: int) -> dict:
    """
    Начисляет монеты за вход. Работает только один раз в сутки.
    Также обновляет серию и выдаёт бонус если серия достигла 3/7/30.
    """
    now   = datetime.now(timezone.utc)
    today = now.date()

    # Серия
    streak_row = (await db.execute(
        select(UserStreak).where(UserStreak.user_id == user_id)
    )).scalar_one_or_none()

    if not streak_row:
        streak_row = UserStreak(user_id=user_id, current_streak=0, longest_streak=0)
        db.add(streak_row)
        await db.flush()

    last = streak_row.last_login_date
    last_date = last.date() if last else None

    # Уже заходил сегодня — ничего не начислять
    if last_date == today:
        balance_row = await _get_or_create_balance(db, user_id)
        return {
            "awarded": 0,
            "already_claimed": True,
            "balance": balance_row.balance,
            "streak": streak_row.current_streak,
        }

    awarded = 0
    bonuses = []

    # Обновляем серию
    if last_date == today - timedelta(days=1):
        streak_row.current_streak += 1
    else:
        streak_row.current_streak = 1  # сброс серии

    streak_row.longest_streak  = max(streak_row.longest_streak, streak_row.current_streak)
    streak_row.last_login_date = now

    # Базовое начисление за вход
    awarded += REWARD["daily_login"]
    await _add_coins(db, user_id, "daily_login")

    # Бонус за серию
    streak = streak_row.current_streak
    for days, key in [(30, "streak_30"), (7, "streak_7"), (3, "streak_3")]:
        if streak % days == 0:
            awarded += REWARD[key]
            await _add_coins(db, user_id, key)
            bonuses.append(LABELS[key])
            break

    await db.commit()

    balance_row = await _get_or_create_balance(db, user_id)
    return {
        "awarded": awarded,
        "already_claimed": False,
        "balance": balance_row.balance,
        "streak": streak,
        "bonuses": bonuses,
    }


async def get_balance(db: AsyncSession, user_id: int) -> dict:
    balance_row = await _get_or_create_balance(db, user_id)
    streak_row  = (await db.execute(
        select(UserStreak).where(UserStreak.user_id == user_id)
    )).scalar_one_or_none()

    await db.commit()
    return {
        "balance":        balance_row.balance,
        "total_ever":     balance_row.total_ever,
        "current_streak": streak_row.current_streak if streak_row else 0,
        "longest_streak": streak_row.longest_streak if streak_row else 0,
    }


async def get_transactions(
    db: AsyncSession, user_id: int, limit: int = 20
) -> list[dict]:
    rows = (await db.execute(
        select(CoinTransaction)
        .where(CoinTransaction.user_id == user_id)
        .order_by(CoinTransaction.created_at.desc())
        .limit(limit)
    )).scalars().all()

    return [
        {
            "id":         r.id,
            "amount":     r.amount,
            "reason":     r.reason,
            "label":      r.label,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in rows
    ]


async def get_leaderboard(db: AsyncSession, limit: int = 10) -> list[dict]:
    """Топ пользователей по total_ever (всего заработанных монет)."""
    from app.models.user import User

    rows = (await db.execute(
        select(User.id, User.name, User.avatar, UserCoins.total_ever, UserCoins.balance)
        .join(UserCoins, User.id == UserCoins.user_id)
        .order_by(UserCoins.total_ever.desc())
        .limit(limit)
    )).all()

    return [
        {
            "rank":       i + 1,
            "user_id":    r.id,
            "name":       r.name,
            "avatar":     r.avatar,
            "total_ever": r.total_ever,
            "balance":    r.balance,
        }
        for i, r in enumerate(rows)
    ]