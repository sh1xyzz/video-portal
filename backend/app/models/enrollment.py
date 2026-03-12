# backend/app/models/enrollment.py
# ✅ Запись студента на курс за EduCoins
# ✅ coins_spent — сколько монет потрачено при записи
# ✅ is_active — можно отозвать

from datetime import datetime
from sqlalchemy import Column, Integer, Boolean, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Enrollment(Base):
    """
    Факт записи пользователя на курс.
    Создаётся при покупке курса за EduCoins (или бесплатно если coin_price = 0).
    """
    __tablename__ = "enrollments"

    id          = Column(Integer, primary_key=True, index=True)
    user_id     = Column(Integer, ForeignKey("users.id",   ondelete="CASCADE"), nullable=False, index=True)
    course_id   = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    coins_spent = Column(Integer, default=0, nullable=False)   # сколько EduCoins списано
    is_active   = Column(Boolean, default=True, nullable=False)
    enrolled_at = Column(DateTime(timezone=True), server_default=func.now())

    # Один пользователь — одна запись на курс
    __table_args__ = (
        UniqueConstraint("user_id", "course_id", name="uq_user_course"),
    )

    user   = relationship("User",   back_populates="enrollments")
    course = relationship("Course", back_populates="enrollments")