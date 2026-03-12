# backend/app/models/course.py
# ФИКС BUG-13: добавлен lessons relationship с back_populates

from sqlalchemy import Column, Integer, String, Float, Boolean, Text
from sqlalchemy.orm import relationship
from app.database import Base


class Course(Base):
    __tablename__ = "courses"

    id           = Column(Integer, primary_key=True, index=True)
    title        = Column(String(255), nullable=False)
    instructor   = Column(String(255), nullable=False)   # строка, не FK
    avatar       = Column(String(10),  nullable=True)
    rating       = Column(Float,       default=0.0)
    students     = Column(Integer,     default=0)
    duration     = Column(String(20),  nullable=True)    # "42h" — для показа
    duration_hours = Column(Float,     default=0.0)      # 42.0  — для вычислений
    level        = Column(String(50),  nullable=True)
    tag          = Column(String(50),  nullable=True)
    tag_color    = Column(String(20),  nullable=True)
    thumb        = Column(String(500), nullable=True)
    price        = Column(String(20),  nullable=True)    # "$49" — для показа
    price_value  = Column(Float,       default=0.0)      # 49.0  — для сортировки
    is_free      = Column(Boolean,     default=False)
    is_published = Column(Boolean,     default=True)
    category     = Column(String(100), nullable=True)
    description  = Column(Text,        nullable=True)
    subtitle     = Column(String(500), nullable=True)
    accent_color = Column(String(20),  nullable=True, default="#6c63ff")

    # FIX BUG-13: back_populates должен совпадать с Lesson.course
    lessons = relationship(
        "Lesson",
        back_populates="course",
        cascade="all, delete-orphan",
        order_by="Lesson.order",
    )