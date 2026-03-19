# backend/app/models/course.py
# ✅ owner_id → FK на users.id (кто создал курс)
# ✅ coin_price → сколько EduCoins стоит запись
# ✅ owner relationship → User

from sqlalchemy import Column, Integer, String, Float, Boolean, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class Course(Base):
    __tablename__ = "courses"

    id           = Column(Integer, primary_key=True, index=True)
    title        = Column(String(255), nullable=False)
    instructor   = Column(String(255), nullable=False)   # отображаемое имя инструктора
    avatar       = Column(String(10),  nullable=True)
    rating       = Column(Float,       default=0.0)
    students     = Column(Integer,     default=0)
    duration     = Column(String(20),  nullable=True)
    duration_hours = Column(Float,     default=0.0)
    level        = Column(String(50),  nullable=True)
    tag          = Column(String(50),  nullable=True)
    tag_color    = Column(String(20),  nullable=True)
    thumb        = Column(String(500), nullable=True)
    price        = Column(String(20),  nullable=True)    # "$49" для показа
    price_value  = Column(Float,       default=0.0)
    is_free      = Column(Boolean,     default=False)
    is_published = Column(Boolean,     default=True)
    category     = Column(String(100), nullable=True)
    description  = Column(Text,        nullable=True)
    subtitle     = Column(String(500), nullable=True)
    accent_color = Column(String(20),  nullable=True, default="#6c63ff")

    # ── Новые поля ─────────────────────────────────────────────────────────
    # Владелец курса (teacher/admin кто создал). NULL = старые курсы без владельца.
    owner_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    # Цена в EduCoins. 0 = бесплатно (is_free=True курсы)
    coin_price = Column(Integer, default=0, nullable=False)

    # ── Relationships ──────────────────────────────────────────────────────
    owner = relationship(
        "User",
        back_populates="owned_courses",
        foreign_keys=[owner_id],
    )
    lessons = relationship(
        "Lesson",
        back_populates="course",
        cascade="all, delete-orphan",
        order_by="Lesson.order",
    )
    enrollments = relationship(
        "Enrollment",
        back_populates="course",
        cascade="all, delete-orphan",
    )