# backend/app/models/__init__.py
# ⚠️  Все модели должны быть здесь — иначе Base.metadata.create_all их не видит

from app.models.user import User
from app.models.course import Course
from app.models.lesson import Lesson, LessonProgress
from app.models.review import Review

__all__ = ["User", "Course", "Lesson", "LessonProgress", "Review"]