# backend/app/models/lesson.py
# ✅ LessonProgress: user_id теперь с FK на users (таблица есть)
# ✅ TaskSubmission: студент сдаёт задание, ассистент/учитель проверяет

import enum
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Text, Boolean,
    ForeignKey, Enum as SAEnum, DateTime
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class LessonType(str, enum.Enum):
    VIDEO        = "video"
    THEORY       = "theory"
    PRESENTATION = "presentation"
    TASK         = "task"


class SubmissionStatus(str, enum.Enum):
    PENDING   = "pending"    # сдано, ждёт проверки
    APPROVED  = "approved"   # принято
    REJECTED  = "rejected"   # отклонено, нужно переделать


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

    course      = relationship("Course", back_populates="lessons")
    progress    = relationship("LessonProgress", back_populates="lesson", cascade="all, delete-orphan")
    submissions = relationship("TaskSubmission", back_populates="lesson", cascade="all, delete-orphan")


class LessonProgress(Base):
    """Прогресс пользователя по уроку."""
    __tablename__ = "lesson_progress"

    id        = Column(Integer, primary_key=True, index=True)
    # ✅ Теперь FK на users (таблица существует)
    user_id   = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    lesson_id = Column(Integer, ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False)
    completed = Column(Boolean, default=False)

    lesson = relationship("Lesson", back_populates="progress")


class TaskSubmission(Base):
    """
    Студент сдаёт задание типа 'task'.
    Ассистент или учитель меняет статус на approved/rejected.
    """
    __tablename__ = "task_submissions"

    id          = Column(Integer, primary_key=True, index=True)
    lesson_id   = Column(Integer, ForeignKey("lessons.id",  ondelete="CASCADE"), nullable=False, index=True)
    user_id     = Column(Integer, ForeignKey("users.id",    ondelete="CASCADE"), nullable=False, index=True)
    reviewer_id = Column(Integer, ForeignKey("users.id",    ondelete="SET NULL"), nullable=True)
    content     = Column(Text, nullable=False)            # текст ответа / ссылка на GitHub
    status      = Column(
        SAEnum(SubmissionStatus, name="submissionstatus", create_type=True),
        default=SubmissionStatus.PENDING,
        nullable=False,
    )
    feedback    = Column(Text, nullable=True)             # комментарий проверяющего
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())
    reviewed_at  = Column(DateTime(timezone=True), nullable=True)

    lesson   = relationship("Lesson", back_populates="submissions", foreign_keys=[lesson_id])
    student  = relationship("User", foreign_keys=[user_id])
    reviewer = relationship("User", foreign_keys=[reviewer_id])