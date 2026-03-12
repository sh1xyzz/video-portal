# backend/app/models/review.py
# Модель отзывов к курсам

from sqlalchemy import Column, Integer, String, Text, Float, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class Review(Base):
    __tablename__ = "reviews"

    id         = Column(Integer, primary_key=True, index=True)
    course_id  = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    user_id    = Column(Integer, nullable=False)          # без FK — совместимость
    user_name  = Column(String(255), nullable=False)
    user_avatar = Column(String(10), nullable=True)       # инициалы "IV"
    rating     = Column(Float, nullable=False, default=5.0)
    text       = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())