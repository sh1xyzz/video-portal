# backend/app/graphql/queries.py
# ✅ UserGQLType — добавлено is_banned
# ✅ allUsers — возвращает is_banned
# ✅ CourseListType — owner_id уже есть
# ✅ Все поля маппятся через getattr (безопасно)

import strawberry
from typing import Optional
from strawberry.types import Info

from app.services.course_service        import get_all_courses
from app.services.course_detail_service import get_course_with_lessons, get_user_progress
from app.services.enrollment_service    import is_enrolled, get_user_enrollments


# ── Types ─────────────────────────────────────────────────────────────────────

@strawberry.type
class CourseListType:
    id:             int
    title:          str
    instructor:     str
    avatar:         Optional[str]
    rating:         float
    students:       int
    duration:       Optional[str]
    duration_hours: float
    level:          Optional[str]
    tag:            Optional[str]
    tag_color:      Optional[str]
    thumb:          Optional[str]
    price:          Optional[str]
    price_value:    float
    is_free:        bool
    coin_price:     int
    category:       Optional[str]
    subtitle:       Optional[str]
    owner_id:       Optional[int]


@strawberry.type
class LessonType:
    id:          int
    section:     str
    title:       str
    type:        str
    duration:    Optional[str]
    content_url: Optional[str]
    content:     Optional[str]
    is_free:     bool
    order:       int
    completed:   bool = False


@strawberry.type
class InstructorDetailType:
    name:   str
    avatar: Optional[str]


@strawberry.type
class CourseDetailType:
    id:                int
    title:             str
    subtitle:          Optional[str]
    description:       Optional[str]
    thumbnail:         Optional[str]
    price:             Optional[str]
    price_value:       float
    is_free:           bool
    coin_price:        int
    level:             Optional[str]
    duration:          Optional[str]
    duration_hours:    float
    rating:            float
    students_count:    int
    tag:               Optional[str]
    tag_color:         Optional[str]
    accent_color:      str
    category:          Optional[str]
    owner_id:          Optional[int]
    instructor:        InstructorDetailType
    lessons:           list[LessonType]
    total_lessons:     int
    completed_lessons: int
    progress_percent:  float
    is_enrolled:       bool


@strawberry.type
class TestimonialGQLType:
    id:     int
    name:   str
    role:   Optional[str]
    avatar: Optional[str]
    color:  Optional[str]
    rating: float
    text:   str


@strawberry.type
class ReviewGQLType:
    id:          int
    course_id:   int
    user_id:     int
    user_name:   str
    user_avatar: Optional[str]
    rating:      float
    text:        str
    created_at:  str


@strawberry.type
class EnrolledCourseType:
    id:                int
    title:             str
    instructor:        str
    thumb:             Optional[str]
    category:          Optional[str]
    level:             Optional[str]
    total_lessons:     int
    completed_lessons: int
    progress:          int
    enrolled_at:       str
    coins_spent:       int


@strawberry.type
class SubmissionGQLType:
    id:           int
    lesson_id:    int
    user_id:      int
    status:       str
    feedback:     Optional[str]
    content:      str
    submitted_at: str
    student_name: Optional[str]
    lesson_title: Optional[str]


@strawberry.type
class UserGQLType:
    id:         int
    name:       str
    email:      str
    role:       str
    avatar:     Optional[str]
    is_banned:  bool          # ✅ поле добавлено
    created_at: str


# ── Helpers ───────────────────────────────────────────────────────────────────

def _to_list_type(c) -> CourseListType:
    return CourseListType(
        id             = c.id,
        title          = c.title,
        instructor     = c.instructor,
        avatar         = c.avatar,
        rating         = c.rating,
        students       = c.students,
        duration       = c.duration,
        duration_hours = c.duration_hours or 0.0,
        level          = c.level,
        tag            = c.tag,
        tag_color      = c.tag_color,
        thumb          = c.thumb,
        price          = c.price,
        price_value    = c.price_value or 0.0,
        is_free        = c.is_free,
        coin_price     = c.coin_price or 0,
        category       = c.category,
        subtitle       = getattr(c, "subtitle", None),
        owner_id       = getattr(c, "owner_id", None),
    )


def _to_user_type(u) -> UserGQLType:
    return UserGQLType(
        id         = u.id,
        name       = u.name,
        email      = u.email,
        role       = u.role if isinstance(u.role, str) else u.role.value,
        avatar     = u.avatar,
        is_banned  = bool(getattr(u, "is_banned", False)),
        created_at = u.created_at.isoformat() if u.created_at else "",
    )


# ── Query ─────────────────────────────────────────────────────────────────────

@strawberry.type
class Query:

    @strawberry.field
    async def featured_courses(self, info: Info) -> list[CourseListType]:
        db = info.context["db"]
        return [_to_list_type(c) for c in await get_all_courses(db)]

    @strawberry.field
    async def all_courses(self, info: Info) -> list[CourseListType]:
        db = info.context["db"]
        return [_to_list_type(c) for c in await get_all_courses(db)]

    @strawberry.field
    async def course_detail(self, info: Info, id: int) -> Optional[CourseDetailType]:
        db   = info.context["db"]
        user = info.context.get("user")

        course = await get_course_with_lessons(db, id)
        if not course:
            return None

        progress_map: dict[int, bool] = {}
        enrolled = False
        if user:
            progress_map = await get_user_progress(db, user.id, id)
            enrolled     = await is_enrolled(db, user.id, id)

        sorted_lessons = sorted(course.lessons, key=lambda l: l.order)
        lesson_types   = [
            LessonType(
                id=l.id, section=l.section, title=l.title,
                type=l.type.value if hasattr(l.type, "value") else str(l.type),
                duration=l.duration, content_url=l.content_url, content=l.content,
                is_free=l.is_free, order=l.order,
                completed=progress_map.get(l.id, False),
            )
            for l in sorted_lessons
        ]

        total     = len(lesson_types)
        completed = sum(1 for l in lesson_types if l.completed)
        percent   = round((completed / total * 100) if total > 0 else 0.0, 1)

        return CourseDetailType(
            id=course.id, title=course.title,
            subtitle=getattr(course, "subtitle", None),
            description=getattr(course, "description", None),
            thumbnail=course.thumb,
            price=course.price, price_value=course.price_value or 0.0,
            is_free=course.is_free, coin_price=course.coin_price or 0,
            level=course.level, duration=course.duration,
            duration_hours=course.duration_hours or 0.0,
            rating=course.rating, students_count=course.students,
            tag=course.tag, tag_color=course.tag_color,
            accent_color=getattr(course, "accent_color", "#6c63ff") or "#6c63ff",
            category=getattr(course, "category", None),
            owner_id=getattr(course, "owner_id", None),
            instructor=InstructorDetailType(name=course.instructor, avatar=course.avatar),
            lessons=lesson_types,
            total_lessons=total, completed_lessons=completed, progress_percent=percent,
            is_enrolled=enrolled,
        )

    @strawberry.field
    async def my_courses(self, info: Info) -> list[EnrolledCourseType]:
        user = info.context.get("user")
        if not user:
            return []
        db   = info.context["db"]
        rows = await get_user_enrollments(db, user.id)
        return [
            EnrolledCourseType(
                id=r["id"], title=r["title"], instructor=r["instructor"],
                thumb=r["thumb"], category=r["category"], level=r["level"],
                total_lessons=r["total_lessons"],
                completed_lessons=r["completed_lessons"],
                progress=r["progress"], enrolled_at=r["enrolled_at"],
                coins_spent=r["coins_spent"],
            )
            for r in rows
        ]

    @strawberry.field
    async def my_teacher_courses(self, info: Info) -> list[CourseListType]:
        user = info.context.get("user")
        if not user or user.role not in ("teacher", "admin"):
            return []
        from sqlalchemy import select
        from app.models.course import Course
        db = info.context["db"]
        courses = (await db.execute(
            select(Course).where(
                Course.owner_id == user.id,
                Course.is_published == True,
            )
        )).scalars().all()
        return [_to_list_type(c) for c in courses]

    @strawberry.field
    async def course_submissions(
        self, info: Info, course_id: int, status: Optional[str] = None
    ) -> list[SubmissionGQLType]:
        user = info.context.get("user")
        if not user:
            raise ValueError("Authentication required")
        if user.role not in ("admin", "teacher", "assistant"):
            raise ValueError("Access denied")

        db = info.context["db"]
        from app.services.submission_service import get_course_submissions
        from app.models.user import User as UserModel
        from app.models.lesson import Lesson
        from sqlalchemy import select

        subs   = await get_course_submissions(db, course_id, status)
        result = []
        for s in subs:
            student = (await db.execute(
                select(UserModel).where(UserModel.id == s.user_id)
            )).scalar_one_or_none()
            lesson = (await db.execute(
                select(Lesson).where(Lesson.id == s.lesson_id)
            )).scalar_one_or_none()
            result.append(SubmissionGQLType(
                id=s.id, lesson_id=s.lesson_id, user_id=s.user_id,
                status=s.status.value, feedback=s.feedback, content=s.content,
                submitted_at=s.submitted_at.isoformat() if s.submitted_at else "",
                student_name=student.name if student else None,
                lesson_title=lesson.title if lesson else None,
            ))
        return result

    @strawberry.field
    async def all_users(self, info: Info) -> list[UserGQLType]:
        """Только admin. Возвращает is_banned."""
        user = info.context.get("user")
        if not user or user.role != "admin":
            raise ValueError("Admin access required")

        from sqlalchemy import select
        from app.models.user import User as UserModel
        db   = info.context["db"]
        rows = (await db.execute(
            select(UserModel).order_by(UserModel.id)
        )).scalars().all()
        return [_to_user_type(u) for u in rows]

    @strawberry.field
    async def course_reviews(self, info: Info, course_id: int) -> list[ReviewGQLType]:
        from app.services.review_service import get_course_reviews
        db      = info.context["db"]
        reviews = await get_course_reviews(db, course_id)
        return [
            ReviewGQLType(
                id=r.id, course_id=r.course_id, user_id=r.user_id,
                user_name=r.user_name, user_avatar=r.user_avatar,
                rating=r.rating, text=r.text,
                created_at=r.created_at.isoformat() if r.created_at else "",
            )
            for r in reviews
        ]

    @strawberry.field
    async def testimonials(self, info: Info) -> list[TestimonialGQLType]:
        from app.services.testimonial_service import get_all
        db   = info.context["db"]
        rows = await get_all(db)
        return [
            TestimonialGQLType(
                id=t.id, name=t.name, role=t.role,
                avatar=t.avatar, color=t.color,
                rating=t.rating, text=t.text,
            )
            for t in rows
        ]