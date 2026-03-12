# backend/app/models/lesson.py
# ФИКС BUG-16: убрали FK на users (таблицы нет), LessonProgress хранит user_id как простое число

import enum
from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import relationship
from app.database import Base


class LessonType(str, enum.Enum):
    VIDEO        = "video"
    THEORY       = "theory"
    PRESENTATION = "presentation"
    TASK         = "task"


class Lesson(Base):
    __tablename__ = "lessons"

    id          = Column(Integer, primary_key=True, index=True)
    course_id   = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    section     = Column(String(255), nullable=False)
    title       = Column(String(255), nullable=False)
    type        = Column(SAEnum(LessonType, name="lessontype", create_type=True), nullable=False)
    duration    = Column(String(20),  nullable=True)
    content_url = Column(String(500), nullable=True)
    content     = Column(Text,        nullable=True)
    is_free     = Column(Boolean,     default=False)
    order       = Column(Integer,     nullable=False, default=0)

    # FIX BUG-13: back_populates совпадает с Course.lessons
    course   = relationship("Course", back_populates="lessons")
    progress = relationship("LessonProgress", back_populates="lesson", cascade="all, delete-orphan")


class LessonProgress(Base):
    """Прогресс пользователя по уроку.
    FIX BUG-16: user_id — просто Integer без FK на users (таблицы нет).
    Когда добавишь авторизацию — добавь FK обратно.
    """
    __tablename__ = "lesson_progress"

    id        = Column(Integer, primary_key=True, index=True)
    user_id   = Column(Integer, nullable=False, index=True)  # без FK — нет таблицы users
    lesson_id = Column(Integer, ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False)
    completed = Column(Boolean, default=False)

    lesson = relationship("Lesson", back_populates="progress")