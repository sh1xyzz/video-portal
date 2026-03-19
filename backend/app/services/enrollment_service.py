# backend/app/services/enrollment_service.py

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.enrollment import Enrollment
from app.models.course     import Course
from app.models.coins      import UserCoins, CoinTransaction


class EnrollmentError(Exception):
    pass


async def is_enrolled(db: AsyncSession, user_id: int, course_id: int) -> bool:
    row = (await db.execute(
        select(Enrollment).where(
            Enrollment.user_id   == user_id,
            Enrollment.course_id == course_id,
            Enrollment.is_active == True,
        )
    )).scalar_one_or_none()
    return row is not None


async def enroll_student(
    db: AsyncSession,
    user_id:   int,
    course_id: int,
) -> Enrollment:
    # Курс существует?
    course = (await db.execute(
        select(Course).where(Course.id == course_id, Course.is_published == True)
    )).scalar_one_or_none()
    if not course:
        raise EnrollmentError("Course not found")

    # Уже записан (активна)?
    if await is_enrolled(db, user_id, course_id):
        raise EnrollmentError("Already enrolled")

    coins_to_spend = course.coin_price or 0

    if coins_to_spend > 0:
        balance_row = (await db.execute(
            select(UserCoins).where(UserCoins.user_id == user_id)
        )).scalar_one_or_none()

        current_balance = balance_row.balance if balance_row else 0
        if current_balance < coins_to_spend:
            raise EnrollmentError(
                f"Not enough EduCoins. Need {coins_to_spend}, have {current_balance}"
            )

        balance_row.balance -= coins_to_spend
        db.add(CoinTransaction(
            user_id = user_id,
            amount  = -coins_to_spend,
            reason  = "course_purchase",
            label   = f"Курс куплен: {course.title}",
        ))

    # ✅ Проверяем есть ли неактивная запись — переактивируем вместо INSERT
    existing_inactive = (await db.execute(
        select(Enrollment).where(
            Enrollment.user_id   == user_id,
            Enrollment.course_id == course_id,
            Enrollment.is_active == False,
        )
    )).scalar_one_or_none()

    if existing_inactive:
        existing_inactive.is_active   = True
        existing_inactive.coins_spent = coins_to_spend
        enrollment = existing_inactive
    else:
        enrollment = Enrollment(
            user_id     = user_id,
            course_id   = course_id,
            coins_spent = coins_to_spend,
            is_active   = True,
        )
        db.add(enrollment)

    course.students = (course.students or 0) + 1

    await db.commit()
    await db.refresh(enrollment)
    return enrollment


async def unenroll_student(
    db: AsyncSession,
    user_id:   int,
    course_id: int,
) -> bool:
    row = (await db.execute(
        select(Enrollment).where(
            Enrollment.user_id   == user_id,
            Enrollment.course_id == course_id,
        )
    )).scalar_one_or_none()

    if not row:
        return False

    row.is_active = False

    course = (await db.execute(
        select(Course).where(Course.id == course_id)
    )).scalar_one_or_none()
    if course and course.students > 0:
        course.students -= 1

    await db.commit()
    return True


async def get_user_enrollments(
    db: AsyncSession,
    user_id: int,
) -> list[dict]:
    from app.models.lesson import Lesson, LessonProgress
    from sqlalchemy import func

    rows = (await db.execute(
        select(Enrollment, Course)
        .join(Course, Course.id == Enrollment.course_id)
        .where(
            Enrollment.user_id   == user_id,
            Enrollment.is_active == True,
        )
        .order_by(Enrollment.enrolled_at.desc())
    )).all()

    result = []
    for enrollment, course in rows:
        total = (await db.execute(
            select(func.count()).where(Lesson.course_id == course.id)
        )).scalar() or 0

        done = (await db.execute(
            select(func.count())
            .select_from(LessonProgress)
            .join(Lesson, Lesson.id == LessonProgress.lesson_id)
            .where(
                Lesson.course_id       == course.id,
                LessonProgress.user_id == user_id,
                LessonProgress.completed == True,
            )
        )).scalar() or 0

        result.append({
            "id":                course.id,
            "title":             course.title,
            "instructor":        course.instructor,
            "thumb":             course.thumb,
            "category":          course.category,
            "level":             course.level,
            "total_lessons":     total,
            "completed_lessons": done,
            "progress":          round(done / total * 100) if total > 0 else 0,
            "enrolled_at":       enrollment.enrolled_at.isoformat(),
            "coins_spent":       enrollment.coins_spent,
        })

    return result