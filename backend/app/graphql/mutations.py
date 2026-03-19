# backend/app/graphql/mutations.py
# ✅ RBAC: teacher создаёт только свои курсы, admin всё
# ✅ BAN/UNBAN пользователей (только admin)
# ✅ DELETE курса (только admin или owner-teacher)
# ✅ Учитель видит только свои курсы в admin panel

import strawberry # type: ignore
from typing import Optional
from strawberry.types import Info # type: ignore

from app.services.course_service         import create_course, update_course
from app.services.course_detail_service  import mark_lesson_complete, create_lesson
from app.services.review_service         import create_or_update_review, delete_review as svc_delete_review
from app.services.enrollment_service     import enroll_student, unenroll_student
from app.services.submission_service     import submit_task, review_submission
from app.services.testimonial_service    import create as create_testimonial_row


# ── Guard helpers ─────────────────────────────────────────────────────────────

def _require_auth(info: Info):
    user = info.context.get("user")
    if not user:
        raise ValueError("Authentication required")
    return user

def _require_role(info: Info, *roles: str):
    """roles — строки: 'admin', 'teacher', 'assistant', 'student'"""
    user = _require_auth(info)
    if user.role not in roles:
        raise ValueError(f"Access denied. Required: {list(roles)}, your role: {user.role}")
    return user

def _check_course_access(user, course):
    """True если пользователь может редактировать курс"""
    if user.role == "admin":
        return True
    if user.role == "teacher" and course and course.owner_id == user.id:
        return True
    return False


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
    coin_price:     int           = 0
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
class SubmitTaskInput:
    lesson_id: int
    content:   str

@strawberry.input
class ReviewSubmissionInput:
    submission_id: int
    status:        str
    feedback:      Optional[str] = None

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
    coin_price: int

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
class EnrollResult:
    course_id:   int
    coins_spent: int
    message:     str

@strawberry.type
class SubmissionResult:
    id:           int
    lesson_id:    int
    user_id:      int
    status:       str
    feedback:     Optional[str] = None
    content:      str
    submitted_at: str

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

@strawberry.type
class UserRoleResult:
    user_id: int
    role:    str

@strawberry.type
class UserBanResult:
    user_id:   int
    is_banned: bool


# ── Mutations ─────────────────────────────────────────────────────────────────

@strawberry.type
class Mutation:

    # ── Enrollment ────────────────────────────────────────────────────────────

    @strawberry.mutation
    async def enroll_course(self, info: Info, course_id: int) -> EnrollResult:
        user = _require_auth(info)
        db   = info.context["db"]
        from app.services.enrollment_service import EnrollmentError
        try:
            enrollment = await enroll_student(db, user.id, course_id)
        except EnrollmentError as e:
            raise ValueError(str(e))
        return EnrollResult(
            course_id   = enrollment.course_id,
            coins_spent = enrollment.coins_spent,
            message     = f"Enrolled! Spent {enrollment.coins_spent} EduCoins.",
        )

    @strawberry.mutation
    async def unenroll_course(self, info: Info, course_id: int) -> bool:
        user = _require_auth(info)
        db   = info.context["db"]
        return await unenroll_student(db, user.id, course_id)

    # ── Course CRUD ───────────────────────────────────────────────────────────

    @strawberry.mutation
    async def create_course(self, info: Info, input: CourseInput) -> CourseMutationResult:
        """Учитель и admin могут создавать курсы. owner_id = текущий пользователь."""
        user = _require_role(info, "teacher", "admin")
        db   = info.context["db"]
        c = await create_course(db, {
            "title": input.title, "instructor": input.instructor,
            "avatar": input.avatar, "rating": input.rating,
            "students": input.students, "duration": input.duration,
            "duration_hours": input.duration_hours, "level": input.level,
            "tag": input.tag, "tag_color": input.tag_color,
            "thumb": input.thumb, "price": input.price,
            "price_value": input.price_value, "is_free": input.is_free,
            "coin_price": input.coin_price,
            "category": input.category, "subtitle": input.subtitle,
            "description": input.description, "accent_color": input.accent_color,
            "owner_id": user.id,
        })
        return CourseMutationResult(id=c.id, title=c.title, instructor=c.instructor, coin_price=c.coin_price or 0)

    @strawberry.mutation
    async def delete_course(self, info: Info, course_id: int) -> bool:
        """Admin удаляет любой курс. Teacher — только свой."""
        user = _require_role(info, "teacher", "admin")
        db   = info.context["db"]

        from sqlalchemy import select # type: ignore
        from app.models.course import Course
        course = (await db.execute(select(Course).where(Course.id == course_id))).scalar_one_or_none()
        if not course:
            raise ValueError("Course not found")
        if not _check_course_access(user, course):
            raise ValueError("You can only delete your own courses")

        await db.delete(course)
        await db.commit()
        return True

    # ── Lesson CRUD ───────────────────────────────────────────────────────────

    @strawberry.mutation
    async def create_lesson(self, info: Info, input: LessonInput) -> LessonMutationResult:
        user = _require_role(info, "teacher", "admin")
        db   = info.context["db"]

        from sqlalchemy import select
        from app.models.course import Course
        course = (await db.execute(select(Course).where(Course.id == input.course_id))).scalar_one_or_none()
        if not course:
            raise ValueError("Course not found")
        if not _check_course_access(user, course):
            raise ValueError("You can only add lessons to your own courses")

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
        user = _require_role(info, "teacher", "admin")
        db   = info.context["db"]

        from sqlalchemy import select
        from app.models.course import Course
        from app.models.lesson import Lesson, LessonType as LT

        lesson = (await db.execute(select(Lesson).where(Lesson.id == id))).scalar_one_or_none()
        if not lesson:
            raise ValueError(f"Lesson {id} not found")

        course = (await db.execute(select(Course).where(Course.id == lesson.course_id))).scalar_one_or_none()
        if not _check_course_access(user, course):
            raise ValueError("You can only edit lessons of your own courses")

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
        user = _require_role(info, "teacher", "admin")
        db   = info.context["db"]

        from sqlalchemy import select
        from app.models.course import Course
        from app.models.lesson import Lesson

        lesson = (await db.execute(select(Lesson).where(Lesson.id == id))).scalar_one_or_none()
        if not lesson:
            return False

        course = (await db.execute(select(Course).where(Course.id == lesson.course_id))).scalar_one_or_none()
        if not _check_course_access(user, course):
            raise ValueError("You can only delete lessons of your own courses")

        await db.delete(lesson)
        await db.commit()
        return True

    # ── Progress ──────────────────────────────────────────────────────────────

    @strawberry.mutation
    async def mark_lesson_complete(self, info: Info, lesson_id: int) -> MarkCompleteResult:
        user = _require_auth(info)
        db   = info.context["db"]
        await mark_lesson_complete(db, user.id, lesson_id)
        return MarkCompleteResult(lesson_id=lesson_id, completed=True)

    # ── Admin: user management ────────────────────────────────────────────────

    @strawberry.mutation
    async def set_user_role(self, info: Info, user_id: int, role: str) -> UserRoleResult:
        """Только admin меняет роли."""
        _require_role(info, "admin")
        db = info.context["db"]

        from sqlalchemy import select
        from app.models.user import User as UserModel

        valid = ["admin", "teacher", "assistant", "student"]
        if role not in valid:
            raise ValueError(f"Invalid role: {role}")

        target = (await db.execute(select(UserModel).where(UserModel.id == user_id))).scalar_one_or_none()
        if not target:
            raise ValueError("User not found")

        target.role = role
        await db.commit()
        return UserRoleResult(user_id=target.id, role=target.role)

    @strawberry.mutation
    async def ban_user(self, info: Info, user_id: int) -> UserBanResult:
        """Только admin банит пользователя."""
        _require_role(info, "admin")
        db = info.context["db"]

        from sqlalchemy import select
        from app.models.user import User as UserModel

        target = (await db.execute(select(UserModel).where(UserModel.id == user_id))).scalar_one_or_none()
        if not target:
            raise ValueError("User not found")
        if target.role == "admin":
            raise ValueError("Cannot ban another admin")

        target.is_banned = True
        await db.commit()
        return UserBanResult(user_id=target.id, is_banned=True)

    @strawberry.mutation
    async def unban_user(self, info: Info, user_id: int) -> UserBanResult:
        """Только admin разбанивает."""
        _require_role(info, "admin")
        db = info.context["db"]

        from sqlalchemy import select
        from app.models.user import User as UserModel

        target = (await db.execute(select(UserModel).where(UserModel.id == user_id))).scalar_one_or_none()
        if not target:
            raise ValueError("User not found")

        target.is_banned = False
        await db.commit()
        return UserBanResult(user_id=target.id, is_banned=False)

    @strawberry.mutation
    async def delete_user(self, info: Info, user_id: int) -> bool:
        """Только admin удаляет пользователя."""
        me = _require_role(info, "admin")
        if me.id == user_id:
            raise ValueError("Cannot delete yourself")
        db = info.context["db"]

        from sqlalchemy import select
        from app.models.user import User as UserModel

        target = (await db.execute(select(UserModel).where(UserModel.id == user_id))).scalar_one_or_none()
        if not target:
            raise ValueError("User not found")

        await db.delete(target)
        await db.commit()
        return True

    # ── Reviews ───────────────────────────────────────────────────────────────

    @strawberry.mutation
    async def add_review(self, info: Info, input: ReviewInput) -> ReviewResult:
        user   = _require_auth(info)
        db     = info.context["db"]
        avatar = (user.name or "?")[:2].upper()
        review = await create_or_update_review(
            db,
            course_id=input.course_id, user_id=user.id,
            user_name=user.name, user_avatar=avatar,
            rating=input.rating, text=input.text,
        )
        return ReviewResult(
            id=review.id, course_id=review.course_id, user_id=review.user_id,
            user_name=review.user_name, user_avatar=review.user_avatar,
            rating=review.rating, text=review.text,
            created_at=review.created_at.isoformat() if review.created_at else "",
        )

    @strawberry.mutation
    async def delete_review(self, info: Info, review_id: int) -> bool:
        user = _require_auth(info)
        db   = info.context["db"]
        return await svc_delete_review(db, review_id, user.id)

    # ── Tasks ─────────────────────────────────────────────────────────────────

    @strawberry.mutation
    async def submit_task(self, info: Info, input: SubmitTaskInput) -> SubmissionResult:
        user = _require_auth(info)
        db   = info.context["db"]
        sub  = await submit_task(db, user.id, input.lesson_id, input.content)
        return SubmissionResult(
            id=sub.id, lesson_id=sub.lesson_id, user_id=sub.user_id,
            status=sub.status.value, feedback=sub.feedback,
            content=sub.content,
            submitted_at=sub.submitted_at.isoformat() if sub.submitted_at else "",
        )

    @strawberry.mutation
    async def review_submission(self, info: Info, input: ReviewSubmissionInput) -> SubmissionResult:
        user = _require_role(info, "assistant", "teacher", "admin")
        db   = info.context["db"]
        sub  = await review_submission(db, input.submission_id, user.id, input.status, input.feedback)
        if not sub:
            raise ValueError("Submission not found")
        return SubmissionResult(
            id=sub.id, lesson_id=sub.lesson_id, user_id=sub.user_id,
            status=sub.status.value, feedback=sub.feedback,
            content=sub.content,
            submitted_at=sub.submitted_at.isoformat() if sub.submitted_at else "",
        )

    # ── Testimonials ──────────────────────────────────────────────────────────

    @strawberry.mutation
    async def create_testimonial(self, info: Info, input: TestimonialInput) -> TestimonialMutationResult:
        _require_role(info, "admin")
        db = info.context["db"]
        t  = await create_testimonial_row(db, {
            "name": input.name, "role": input.role,
            "avatar": input.avatar, "color": input.color,
            "rating": input.rating, "text": input.text,
        })
        return TestimonialMutationResult(id=t.id, name=t.name)