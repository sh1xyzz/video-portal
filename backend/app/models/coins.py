# backend/app/models/coins.py

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.sql import func
from app.database import Base


class UserCoins(Base):
    """Баланс монет пользователя."""
    __tablename__ = "user_coins"

    id         = Column(Integer, primary_key=True)
    user_id    = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    balance    = Column(Integer, default=0, nullable=False)
    total_ever = Column(Integer, default=0, nullable=False)   # всего заработано за всё время
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())


class CoinTransaction(Base):
    """История начислений/списаний монет."""
    __tablename__ = "coin_transactions"

    id         = Column(Integer, primary_key=True)
    user_id    = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    amount     = Column(Integer, nullable=False)              # +5, +100, -30 и т.д.
    reason     = Column(String(100), nullable=False)          # "lesson_complete", "course_complete" ...
    label      = Column(String(255), nullable=True)           # человекочитаемое: "Урок: Intro to React"
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class UserStreak(Base):
    """Серия ежедневных входов пользователя."""
    __tablename__ = "user_streaks"

    id              = Column(Integer, primary_key=True)
    user_id         = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    current_streak  = Column(Integer, default=0)
    longest_streak  = Column(Integer, default=0)
    last_login_date = Column(DateTime(timezone=True), nullable=True)