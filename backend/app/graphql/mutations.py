# backend/app/graphql/mutations.py
# ✅ markLessonComplete → возвращает MarkCompleteResult { lessonId completed }
# ✅ addReview / deleteReview
# ✅ updateLesson — конвертирует type через LT()
# ✅ createCourse / createLesson / deleteLesson

import strawberry
from typing import Optional
from strawberry.types import Info

from app.services.course_service import create_course
from app.services.testimonial_service import create as create_testimonial_row
from app.services.course_detail_service import mark_lesson_complete, create_lesson
from app.services.review_service import create_or_update_review, delete_review as svc_delete_review


# ── Inputs ────────────────────────────────────────────────────────────────────

@strawberry.input
class CourseInput:
    title:          str
    instructor:     str
    avatar:         Optional[str] = None
    rating:         float         = 0.0
    students:       int           = 0
    duration:       Optional[str] = None
    duration_hours: float         = 0.0
    level:          Optional[str] = None
    tag:            Optional[str] = None
    tag_color:      Optional[str] = None
    thumb:          Optional[str] = None
    price:          Optional[str] = None
    price_value:    float         = 0.0
    is_free:        bool          = False
    category:       Optional[str] = None
    subtitle:       Optional[str] = None
    description:    Optional[str] = None
    accent_color:   Optional[str] = "#6c63ff"


@strawberry.input
class LessonInput:
    course_id:   int
    section:     str
    title:       str
    type:        str
    duration:    Optional[str] = None
    content_url: Optional[str] = None
    content:     Optional[str] = None
    is_free:     bool          = False
    order:       int           = 0


@strawberry.input
class ReviewInput:
    course_id: int
    rating:    float
    text:      str


@strawberry.input
class TestimonialInput:
    name:   str
    text:   str
    role:   Optional[str] = None
    avatar: Optional[str] = None
    color:  Optional[str] = "#6c63ff"
    rating: float         = 5.0


# ── Return types ──────────────────────────────────────────────────────────────

@strawberry.type
class CourseMutationResult:
    id:         int
    title:      str
    instructor: str


@strawberry.type
class LessonMutationResult:
    id:          int
    title:       str
    section:     str
    type:        str
    order:       int
    content_url: Optional[str] = None
    content:     Optional[str] = None


@strawberry.type
class MarkCompleteResult:
    lesson_id: int
    completed: bool


@strawberry.type
class ReviewResult:
    id:          int
    course_id:   int
    user_id:     int
    user_name:   str
    user_avatar: Optional[str]
    rating:      float
    text:        str
    created_at:  str


@strawberry.type
class TestimonialMutationResult:
    id:   int
    name: str


# ── Mutations ─────────────────────────────────────────────────────────────────

@strawberry.type
class Mutation:

    @strawberry.mutation
    async def create_course(self, info: Info, input: CourseInput) -> CourseMutationResult:
        db = info.context["db"]
        c  = await create_course(db, {
            "title": input.title, "instructor": input.instructor,
            "avatar": input.avatar, "rating": input.rating,
            "students": input.students, "duration": input.duration,
            "duration_hours": input.duration_hours, "level": input.level,
            "tag": input.tag, "tag_color": input.tag_color,
            "thumb": input.thumb, "price": input.price,
            "price_value": input.price_value, "is_free": input.is_free,
            "category": input.category, "subtitle": input.subtitle,
            "description": input.description, "accent_color": input.accent_color,
        })
        return CourseMutationResult(id=c.id, title=c.title, instructor=c.instructor)

    @strawberry.mutation
    async def create_lesson(self, info: Info, input: LessonInput) -> LessonMutationResult:
        db = info.context["db"]
        from app.models.lesson import LessonType as LT
        lesson = await create_lesson(db, input.course_id, {
            "section": input.section, "title": input.title,
            "type": LT(input.type), "duration": input.duration,
            "content_url": input.content_url, "content": input.content,
            "is_free": input.is_free, "order": input.order,
        })
        return LessonMutationResult(
            id=lesson.id, title=lesson.title, section=lesson.section,
            type=lesson.type.value, order=lesson.order,
            content_url=lesson.content_url, content=lesson.content,
        )

    @strawberry.mutation
    async def update_lesson(self, info: Info, id: int, input: LessonInput) -> Optional[LessonMutationResult]:
        db   = info.context["db"]
        user = info.context.get("user")
        if not user:
            raise Exception("Not authenticated")

        from app.models.lesson import Lesson, LessonType as LT
        from sqlalchemy import select

        result = await db.execute(select(Lesson).where(Lesson.id == id))
        lesson = result.scalar_one_or_none()
        if not lesson:
            raise Exception(f"Lesson {id} not found")

        lesson.section     = input.section
        lesson.title       = input.title
        lesson.type        = LT(input.type)
        lesson.duration    = input.duration
        lesson.content_url = input.content_url
        lesson.content     = input.content
        lesson.is_free     = input.is_free
        lesson.order       = input.order

        await db.commit()
        await db.refresh(lesson)
        return LessonMutationResult(
            id=lesson.id, title=lesson.title, section=lesson.section,
            type=lesson.type.value, order=lesson.order,
            content_url=lesson.content_url, content=lesson.content,
        )

    @strawberry.mutation
    async def delete_lesson(self, info: Info, id: int) -> bool:
        db   = info.context["db"]
        user = info.context.get("user")
        if not user:
            raise Exception("Not authenticated")

        from app.models.lesson import Lesson
        from sqlalchemy import select

        result = await db.execute(select(Lesson).where(Lesson.id == id))
        lesson = result.scalar_one_or_none()
        if not lesson:
            return False
        await db.delete(lesson)
        await db.commit()
        return True

    @strawberry.mutation
    async def mark_lesson_complete(self, info: Info, lesson_id: int) -> MarkCompleteResult:
        """
        Отметить урок как пройденный.
        Требует JWT в заголовке: Authorization: Bearer <token>
        Возвращает { lessonId, completed }
        """
        user = info.context.get("user")
        if not user:
            raise ValueError("Authentication required")
        db = info.context["db"]
        await mark_lesson_complete(db, user.id, lesson_id)
        return MarkCompleteResult(lesson_id=lesson_id, completed=True)

    @strawberry.mutation
    async def add_review(self, info: Info, input: ReviewInput) -> ReviewResult:
        """
        Создать или обновить свой отзыв к курсу.
        Один отзыв на курс на пользователя (повторный — перезапишет старый).
        """
        user = info.context.get("user")
        if not user:
            raise ValueError("Authentication required")
        db     = info.context["db"]
        avatar = (user.name or "?")[:2].upper()

        review = await create_or_update_review(
            db,
            course_id   = input.course_id,
            user_id     = user.id,
            user_name   = user.name,
            user_avatar = avatar,
            rating      = input.rating,
            text        = input.text,
        )
        return ReviewResult(
            id          = review.id,
            course_id   = review.course_id,
            user_id     = review.user_id,
            user_name   = review.user_name,
            user_avatar = review.user_avatar,
            rating      = review.rating,
            text        = review.text,
            created_at  = review.created_at.isoformat() if review.created_at else "",
        )

    @strawberry.mutation
    async def delete_review(self, info: Info, review_id: int) -> bool:
        user = info.context.get("user")
        if not user:
            raise ValueError("Authentication required")
        db = info.context["db"]
        return await svc_delete_review(db, review_id, user.id)

    @strawberry.mutation
    async def create_testimonial(self, info: Info, input: TestimonialInput) -> TestimonialMutationResult:
        db = info.context["db"]
        t  = await create_testimonial_row(db, {
            "name": input.name, "role": input.role,
            "avatar": input.avatar, "color": input.color,
            "rating": input.rating, "text": input.text,
        })
        return TestimonialMutationResult(id=t.id, name=t.name)