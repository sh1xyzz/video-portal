# backend/app/models/__init__.py
# ✅ Регистрирует все модели для SQLAlchemy metadata
# Порядок важен: User → Course → Enrollment → ...

from app.models.user            import User, UserRole
from app.models.course          import Course
from app.models.lesson          import Lesson, LessonProgress, LessonType
from app.models.enrollment      import Enrollment
from app.models.course_assignment import CourseAssignment
from app.models.review          import Review
from app.models.testimonial     import Testimonial
from app.models.coins           import UserCoins, CoinTransaction, UserStreak

__all__ = [
    "User", "UserRole",
    "Course",
    "Lesson", "LessonProgress", "LessonType",
    "Enrollment",
    "CourseAssignment",
    "Review",
    "Testimonial",
    "UserCoins", "CoinTransaction", "UserStreak",
]