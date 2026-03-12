# backend/app/services/course_detail_service.py
# ФИКС BUG-14, BUG-15: убрали selectinload(Course.instructor/category) —
# они строки, не relationship. Используем selectinload только для lessons.

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.models.course import Course
from app.models.lesson import Lesson, LessonProgress


async def get_course_with_lessons(
    db: AsyncSession,
    course_id: int,
) -> Course | None:
    """Курс со всеми уроками, отсортированными по order."""
    result = await db.execute(
        select(Course)
        .where(Course.id == course_id, Course.is_published == True)
        .options(
            selectinload(Course.lessons)  # FIX: только реальный relationship
        )
    )
    return result.scalar_one_or_none()


async def get_user_progress(
    db: AsyncSession,
    user_id: int,
    course_id: int,
) -> dict[int, bool]:
    """Словарь {lesson_id: completed} для данного юзера и курса."""
    lessons_result = await db.execute(
        select(Lesson.id).where(Lesson.course_id == course_id)
    )
    lesson_ids = [row[0] for row in lessons_result.all()]

    if not lesson_ids:
        return {}

    progress_result = await db.execute(
        select(LessonProgress).where(
            LessonProgress.user_id == user_id,
            LessonProgress.lesson_id.in_(lesson_ids),
        )
    )
    rows = progress_result.scalars().all()
    return {row.lesson_id: row.completed for row in rows}


async def mark_lesson_complete(
    db: AsyncSession,
    user_id: int,
    lesson_id: int,
) -> bool:
    existing = (await db.execute(
        select(LessonProgress).where(
            LessonProgress.user_id == user_id,
            LessonProgress.lesson_id == lesson_id,
        )
    )).scalar_one_or_none()

    if existing:
        existing.completed = True
    else:
        db.add(LessonProgress(
            user_id=user_id,
            lesson_id=lesson_id,
            completed=True,
        ))

    await db.commit()
    return True


async def create_lesson(
    db: AsyncSession,
    course_id: int,
    data: dict,
) -> Lesson:
    lesson = Lesson(course_id=course_id, **data)
    db.add(lesson)
    await db.commit()
    await db.refresh(lesson)
    return lesson