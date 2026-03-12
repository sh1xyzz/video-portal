# backend/app/graphql/mutations.py
# ✅ Роли: каждая мутация защищена по роли
# ✅ enrollCourse    — студент покупает курс за EduCoins
# ✅ unenrollCourse  — отписка
# ✅ createCourse    — только teacher/admin. owner_id = текущий user
# ✅ updateCourse    — только owner или admin
# ✅ createLesson / updateLesson / deleteLesson — только can_edit_course
# ✅ submitTask      — только студент (записанный на курс)
# ✅ reviewSubmission — только assistant_or_above + can_view_submissions
# ✅ assignAssistant — только teacher (owner) или admin
# ✅ setUserRole     — только admin

import strawberry
from typing import Optional
from strawberry.types import Info

from app.services.course_service      import create_course, update_course
from app.services.course_detail_service import mark_lesson_complete, create_lesson
from app.services.review_service      import create_or_update_review, delete_review as svc_delete_review
from app.services.enrollment_service  import enroll_student, unenroll_student
from app.services.submission_service  import submit_task, review_submission
from app.services.testimonial_service import create as create_testimonial_row
from app.models.user                  import UserRole


# ── Guard helpers ─────────────────────────────────────────────────────────────

def _require_auth(info: Info):
    user = info.context.get("user")
    if not user:
        raise ValueError("Authentication required")
    return user

def _require_role(info: Info, *roles: UserRole):
    user = _require_auth(info)
    if user.role not in roles:
        raise ValueError(f"Access denied. Required role: {[r.value for r in roles]}")
    return user


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
    coin_price:     int           = 0         # ← цена в EduCoins
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
    content:   str   # текст ответа / ссылка на репозиторий


@strawberry.input
class ReviewSubmissionInput:
    submission_id: int
    status:        str          # "approved" | "rejected"
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
    id:         int
    lesson_id:  int
    user_id:    int
    status:     str
    feedback:   Optional[str] = None
    content:    str
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


# ── Mutations ─────────────────────────────────────────────────────────────────

@strawberry.type
class Mutation:

    # ── Enrollment ────────────────────────────────────────────────────────────

    @strawberry.mutation
    async def enroll_course(self, info: Info, course_id: int) -> EnrollResult:
        """
        Студент записывается на курс.
        Если coin_price > 0 — списывает EduCoins с баланса.
        Роль: любая авторизованная (student, assistant, teacher, admin).
        """
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
            message     = f"Enrolled successfully! Spent {enrollment.coins_spent} EduCoins.",
        )

    @strawberry.mutation
    async def unenroll_course(self, info: Info, course_id: int) -> bool:
        """Отписаться от курса. Монеты не возвращаются."""
        user = _require_auth(info)
        db   = info.context["db"]
        return await unenroll_student(db, user.id, course_id)

    # ── Courses ───────────────────────────────────────────────────────────────

    @strawberry.mutation
    async def create_course(self, info: Info, input: CourseInput) -> CourseMutationResult:
        """
        Создать курс.
        Роль: teacher, admin.
        owner_id автоматически = текущий пользователь.
        """
        user = _require_role(info, UserRole.TEACHER, UserRole.ADMIN)
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
            "owner_id": user.id,  # ← автоматически привязываем к создателю
        })
        return CourseMutationResult(
            id=c.id, title=c.title, instructor=c.instructor, coin_price=c.coin_price or 0
        )

    @strawberry.mutation
    async def update_course_price(
        self, info: Info, course_id: int, coin_price: int
    ) -> CourseMutationResult:
        """
        Изменить цену курса в EduCoins.
        Роль: owner (teacher) или admin.
        """
        user = _require_auth(info)
        db   = info.context["db"]

        from sqlalchemy import select
        from app.models.course import Course
        course = (await db.execute(
            select(Course).where(Course.id == course_id)
        )).scalar_one_or_none()

        if not course:
            raise ValueError("Course not found")
        if not user.can_edit_course(course):
            raise ValueError("You don't have permission to edit this course")

        course.coin_price = coin_price
        await db.commit()
        await db.refresh(course)
        return CourseMutationResult(
            id=course.id, title=course.title,
            instructor=course.instructor, coin_price=course.coin_price,
        )

    # ── Lessons ───────────────────────────────────────────────────────────────

    @strawberry.mutation
    async def create_lesson(self, info: Info, input: LessonInput) -> LessonMutationResult:
        """
        Создать урок.
        Роль: teacher (owner курса) или admin.
        """
        user = _require_auth(info)
        db   = info.context["db"]

        # Проверяем право на курс
        from sqlalchemy import select
        from app.models.course import Course
        course = (await db.execute(
            select(Course).where(Course.id == input.course_id)
        )).scalar_one_or_none()
        if not course:
            raise ValueError("Course not found")
        if not user.can_edit_course(course):
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
    async def update_lesson(
        self, info: Info, id: int, input: LessonInput
    ) -> Optional[LessonMutationResult]:
        """Обновить урок. Роль: teacher (owner) или admin."""
        user = _require_auth(info)
        db   = info.context["db"]

        from sqlalchemy import select
        from app.models.course import Course
        from app.models.lesson import Lesson, LessonType as LT

        lesson = (await db.execute(select(Lesson).where(Lesson.id == id))).scalar_one_or_none()
        if not lesson:
            raise ValueError(f"Lesson {id} not found")

        course = (await db.execute(
            select(Course).where(Course.id == lesson.course_id)
        )).scalar_one_or_none()
        if not user.can_edit_course(course):
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
        """Удалить урок. Роль: teacher (owner) или admin."""
        user = _require_auth(info)
        db   = info.context["db"]

        from sqlalchemy import select
        from app.models.course import Course
        from app.models.lesson import Lesson

        lesson = (await db.execute(select(Lesson).where(Lesson.id == id))).scalar_one_or_none()
        if not lesson:
            return False

        course = (await db.execute(
            select(Course).where(Course.id == lesson.course_id)
        )).scalar_one_or_none()
        if not user.can_edit_course(course):
            raise ValueError("You can only delete lessons of your own courses")

        await db.delete(lesson)
        await db.commit()
        return True

    # ── Lesson progress ───────────────────────────────────────────────────────

    @strawberry.mutation
    async def mark_lesson_complete(self, info: Info, lesson_id: int) -> MarkCompleteResult:
        """
        Отметить урок пройденным.
        Роль: любой авторизованный (студент должен быть записан — проверяется логикой).
        """
        user = _require_auth(info)
        db   = info.context["db"]
        await mark_lesson_complete(db, user.id, lesson_id)
        return MarkCompleteResult(lesson_id=lesson_id, completed=True)

    # ── Task submissions ──────────────────────────────────────────────────────

    @strawberry.mutation
    async def submit_task(self, info: Info, input: SubmitTaskInput) -> SubmissionResult:
        """
        Студент сдаёт задание типа 'task'.
        Роль: любой авторизованный.
        """
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
    async def review_submission(
        self, info: Info, input: ReviewSubmissionInput
    ) -> SubmissionResult:
        """
        Ассистент или учитель проверяет задание.
        Роль: assistant, teacher, admin.
        """
        user = _require_role(
            info, UserRole.ASSISTANT, UserRole.TEACHER, UserRole.ADMIN
        )
        db  = info.context["db"]
        sub = await review_submission(
            db, input.submission_id, user.id, input.status, input.feedback
        )
        if not sub:
            raise ValueError("Submission not found")
        return SubmissionResult(
            id=sub.id, lesson_id=sub.lesson_id, user_id=sub.user_id,
            status=sub.status.value, feedback=sub.feedback,
            content=sub.content,
            submitted_at=sub.submitted_at.isoformat() if sub.submitted_at else "",
        )

    # ── Assign assistant ──────────────────────────────────────────────────────

    @strawberry.mutation
    async def assign_assistant(
        self, info: Info, course_id: int, assistant_user_id: int
    ) -> bool:
        """
        Назначить ассистента на курс.
        Роль: admin, или teacher (только свои курсы).
        """
        user = _require_auth(info)
        db   = info.context["db"]

        from sqlalchemy import select
        from app.models.course import Course
        from app.models.course_assignment import CourseAssignment
        from app.models.user import User as UserModel

        course = (await db.execute(
            select(Course).where(Course.id == course_id)
        )).scalar_one_or_none()
        if not course:
            raise ValueError("Course not found")
        if not user.can_edit_course(course):
            raise ValueError("You can only assign assistants to your own courses")

        # Проверяем что назначаемый — ассистент
        target = (await db.execute(
            select(UserModel).where(UserModel.id == assistant_user_id)
        )).scalar_one_or_none()
        if not target or target.role != UserRole.ASSISTANT:
            raise ValueError("Target user is not an assistant")

        # Создаём назначение (ignore duplicate)
        existing = (await db.execute(
            select(CourseAssignment).where(
                CourseAssignment.course_id == course_id,
                CourseAssignment.user_id   == assistant_user_id,
            )
        )).scalar_one_or_none()
        if not existing:
            db.add(CourseAssignment(course_id=course_id, user_id=assistant_user_id))
            await db.commit()
        return True

    # ── Admin: set role ───────────────────────────────────────────────────────

    @strawberry.mutation
    async def set_user_role(
        self, info: Info, user_id: int, role: str
    ) -> UserRoleResult:
        """
        Изменить роль пользователя.
        Роль: только admin.
        """
        _require_role(info, UserRole.ADMIN)
        db = info.context["db"]

        from sqlalchemy import select
        from app.models.user import User as UserModel

        target = (await db.execute(
            select(UserModel).where(UserModel.id == user_id)
        )).scalar_one_or_none()
        if not target:
            raise ValueError("User not found")

        try:
            target.role = UserRole(role)
        except ValueError:
            raise ValueError(f"Invalid role: {role}. Valid: {[r.value for r in UserRole]}")

        await db.commit()
        return UserRoleResult(user_id=target.id, role=target.role.value)

    # ── Reviews ───────────────────────────────────────────────────────────────

    @strawberry.mutation
    async def add_review(self, info: Info, input: ReviewInput) -> ReviewResult:
        """Добавить/обновить отзыв. Роль: любой авторизованный."""
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

    # ── Testimonials ──────────────────────────────────────────────────────────

    @strawberry.mutation
    async def create_testimonial(self, info: Info, input: TestimonialInput) -> TestimonialMutationResult:
        """Добавить отзыв-testimonial. Роль: admin."""
        _require_role(info, UserRole.ADMIN)
        db = info.context["db"]
        t  = await create_testimonial_row(db, {
            "name": input.name, "role": input.role,
            "avatar": input.avatar, "color": input.color,
            "rating": input.rating, "text": input.text,
        })
        return TestimonialMutationResult(id=t.id, name=t.name)