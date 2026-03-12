# backend/app/models/user.py

import enum
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class UserRole(str, enum.Enum):
    ADMIN     = "admin"
    TEACHER   = "teacher"
    ASSISTANT = "assistant"
    STUDENT   = "student"


class User(Base):
    __tablename__ = "users"

    id:              Mapped[int]        = mapped_column(primary_key=True, index=True)
    email:           Mapped[str]        = mapped_column(String(255), unique=True, index=True, nullable=False)
    name:            Mapped[str]        = mapped_column(String(255), nullable=False)
    hashed_password: Mapped[str]        = mapped_column(String(255), nullable=False)
    avatar:          Mapped[str | None] = mapped_column(String(500), nullable=True)
    bio:             Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_active:       Mapped[bool]       = mapped_column(Boolean, default=True)

    # ✅ Просто VARCHAR — никаких SAEnum, никакого кэша
    role: Mapped[str] = mapped_column(
        String(20),
        default="student",
        nullable=False,
        server_default="student",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

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

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email} role={self.role}>"

    @property
    def is_admin(self) -> bool:
        return self.role == UserRole.ADMIN

    @property
    def is_teacher_or_admin(self) -> bool:
        return self.role in (UserRole.ADMIN, UserRole.TEACHER)

    @property
    def is_assistant_or_above(self) -> bool:
        return self.role in (UserRole.ADMIN, UserRole.TEACHER, UserRole.ASSISTANT)

    def can_edit_course(self, course: "Course") -> bool:
        if self.role == UserRole.ADMIN:
            return True
        if self.role == UserRole.TEACHER:
            return course.owner_id == self.id
        return False

    def can_view_submissions(self, course: "Course") -> bool:
        if self.role in (UserRole.ADMIN, UserRole.TEACHER):
            return True
        if self.role == UserRole.ASSISTANT:
            return any(
                a.course_id == course.id
                for a in getattr(self, "course_assignments", [])
            )
        return False