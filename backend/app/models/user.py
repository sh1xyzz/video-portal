# backend/app/models/user.py

import enum
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, Integer, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class UserRole(str, enum.Enum):
    ADMIN     = "admin"
    TEACHER   = "teacher"
    ASSISTANT = "assistant"
    STUDENT   = "student"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    name: Mapped[str] = mapped_column(String(100), nullable=False)

    email: Mapped[str] = mapped_column(
        String(255), unique=True, index=True, nullable=False
    )

    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)

    role: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="student",
        server_default="student",
    )

    avatar: Mapped[str | None] = mapped_column(String(500), nullable=True)

    is_banned: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # ── Relationships ─────────────────────────────────────────────────────────

    owned_courses: Mapped[list["Course"]] = relationship(
        "Course",
        back_populates="owner",
        foreign_keys="Course.owner_id",
        lazy="selectin",
    )

    enrollments: Mapped[list["Enrollment"]] = relationship(
        "Enrollment",
        back_populates="user",
        lazy="selectin",
    )

    # ── Helpers ───────────────────────────────────────────────────────────────

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email} role={self.role}>"

    @property
    def is_admin(self) -> bool:
        return self.role == "admin"

    @property
    def is_teacher_or_admin(self) -> bool:
        return self.role in ("admin", "teacher")

    @property
    def is_assistant_or_above(self) -> bool:
        return self.role in ("admin", "teacher", "assistant")

    def can_edit_course(self, course) -> bool:
        if self.role == "admin":
            return True
        if self.role == "teacher" and course and course.owner_id == self.id:
            return True
        return False

    def can_view_submissions(self, course) -> bool:
        if self.role in ("admin", "teacher"):
            return True
        if self.role == "assistant":
            return any(
                a.course_id == course.id
                for a in getattr(self, "course_assignments", [])
            )
        return False