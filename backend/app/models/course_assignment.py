# backend/app/models/course_assignment.py
# ✅ Назначение ассистента на конкретный курс
# Ассистент может проверять задания только назначенных курсов

from datetime import datetime
from sqlalchemy import Column, Integer, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class CourseAssignment(Base):
    """
    Связь: assistant → course.
    Только admin/teacher (owner) могут создавать эти записи.
    """
    __tablename__ = "course_assignments"

    id         = Column(Integer, primary_key=True, index=True)
    course_id  = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    user_id    = Column(Integer, ForeignKey("users.id",   ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("course_id", "user_id", name="uq_assignment"),
    )

    course = relationship("Course")
    user   = relationship("User")