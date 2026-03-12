# backend/app/models/testimonial.py
# Таблица testimonials в PostgreSQL — структура такая же как данные в T[]

from sqlalchemy import Column, Integer, String, Float, Boolean
from app.database import Base


class Testimonial(Base):
    __tablename__ = "testimonials"

    id           = Column(Integer, primary_key=True, index=True)
    name         = Column(String(255), nullable=False)    # "Ivan Sokolov"
    role         = Column(String(255), nullable=True)     # "Frontend Dev @ Yandex"
    avatar       = Column(String(10),  nullable=True)     # "IS"
    color        = Column(String(20),  nullable=True)     # "#6c63ff"
    rating       = Column(Float,       default=5.0)       # 1–5
    text         = Column(String(1000),nullable=False)    # сам отзыв
    is_published = Column(Boolean,     default=True)