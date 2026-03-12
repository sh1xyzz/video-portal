# backend/app/graphql/queries.py

import strawberry
from typing import Optional
from strawberry.types import Info

from app.services.course_service import get_all_courses
from app.services.course_detail_service import get_course_with_lessons, get_user_progress


# ── Типы ─────────────────────────────────────────────────────────────────────

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
    category:       Optional[str]
    subtitle:       Optional[str]


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
    level:             Optional[str]
    duration:          Optional[str]
    duration_hours:    float
    rating:            float
    students_count:    int
    tag:               Optional[str]
    tag_color:         Optional[str]
    accent_color:      str
    category:          Optional[str]
    instructor:        InstructorDetailType
    lessons:           list[LessonType]
    total_lessons:     int
    completed_lessons: int
    progress_percent:  float


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


# ── Хелпер ───────────────────────────────────────────────────────────────────

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
        category       = c.category,
        subtitle       = getattr(c, "subtitle", None),
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
        if user:
            progress_map = await get_user_progress(db, user.id, id)

        sorted_lessons = sorted(course.lessons, key=lambda l: l.order)

        lesson_types = [
            LessonType(
                id          = l.id,
                section     = l.section,
                title       = l.title,
                type        = l.type.value if hasattr(l.type, "value") else str(l.type),
                duration    = l.duration,
                content_url = l.content_url,
                content     = l.content,
                is_free     = l.is_free,
                order       = l.order,
                completed   = progress_map.get(l.id, False),
            )
            for l in sorted_lessons
        ]

        total     = len(lesson_types)
        completed = sum(1 for l in lesson_types if l.completed)
        percent   = round((completed / total * 100) if total > 0 else 0.0, 1)

        return CourseDetailType(
            id                = course.id,
            title             = course.title,
            subtitle          = getattr(course, "subtitle", None),
            description       = getattr(course, "description", None),
            thumbnail         = course.thumb,
            price             = course.price,
            price_value       = course.price_value or 0.0,
            is_free           = course.is_free,
            level             = course.level,
            duration          = course.duration,
            duration_hours    = course.duration_hours or 0.0,
            rating            = course.rating,
            students_count    = course.students,
            tag               = course.tag,
            tag_color         = course.tag_color,
            accent_color      = getattr(course, "accent_color", "#6c63ff") or "#6c63ff",
            category          = getattr(course, "category", None),
            instructor        = InstructorDetailType(
                name   = course.instructor,
                avatar = course.avatar,
            ),
            lessons           = lesson_types,
            total_lessons     = total,
            completed_lessons = completed,
            progress_percent  = percent,
        )

    @strawberry.field
    async def course_reviews(self, info: Info, course_id: int) -> list[ReviewGQLType]:
        """
        Все отзывы к курсу.

        query {
          courseReviews(courseId: 1) {
            id userId userName rating text createdAt
          }
        }
        """
        from app.services.review_service import get_course_reviews
        db      = info.context["db"]
        reviews = await get_course_reviews(db, course_id)
        return [
            ReviewGQLType(
                id          = r.id,
                course_id   = r.course_id,
                user_id     = r.user_id,
                user_name   = r.user_name,
                user_avatar = r.user_avatar,
                rating      = r.rating,
                text        = r.text,
                created_at  = r.created_at.isoformat() if r.created_at else "",
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