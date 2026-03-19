# backend/app/services/submission_service.py
# ✅ submit_task      — студент сдаёт задание
# ✅ review_submission — ассистент/учитель проверяет
# ✅ get_course_submissions — все задания курса для проверки

from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.lesson import TaskSubmission, SubmissionStatus, Lesson


async def submit_task(
    db:        AsyncSession,
    user_id:   int,
    lesson_id: int,
    content:   str,
) -> TaskSubmission:
    """Студент сдаёт задание. Повторная сдача — перезаписывает старую."""
    existing = (await db.execute(
        select(TaskSubmission).where(
            TaskSubmission.user_id   == user_id,
            TaskSubmission.lesson_id == lesson_id,
        )
    )).scalar_one_or_none()

    if existing:
        existing.content  = content
        existing.status   = SubmissionStatus.PENDING
        existing.feedback = None
        existing.submitted_at = datetime.now(timezone.utc)
        await db.commit()
        await db.refresh(existing)
        return existing

    sub = TaskSubmission(
        user_id   = user_id,
        lesson_id = lesson_id,
        content   = content,
        status    = SubmissionStatus.PENDING,
    )
    db.add(sub)
    await db.commit()
    await db.refresh(sub)
    return sub


async def review_submission(
    db:            AsyncSession,
    submission_id: int,
    reviewer_id:   int,
    status:        str,            # "approved" | "rejected"
    feedback:      str | None,
) -> TaskSubmission | None:
    """Ассистент или учитель меняет статус задания."""
    sub = (await db.execute(
        select(TaskSubmission).where(TaskSubmission.id == submission_id)
    )).scalar_one_or_none()

    if not sub:
        return None

    sub.status      = SubmissionStatus(status)
    sub.reviewer_id = reviewer_id
    sub.feedback    = feedback
    sub.reviewed_at = datetime.now(timezone.utc)

    # Если принято — отмечаем урок как пройденный
    if sub.status == SubmissionStatus.APPROVED:
        from app.services.course_detail_service import mark_lesson_complete
        await mark_lesson_complete(db, sub.user_id, sub.lesson_id)
    else:
        await db.commit()

    await db.refresh(sub)
    return sub


async def get_course_submissions(
    db:        AsyncSession,
    course_id: int,
    status:    str | None = None,   # фильтр по статусу
) -> list[TaskSubmission]:
    """Все задания курса (для ассистента/учителя)."""
    q = (
        select(TaskSubmission)
        .join(Lesson, Lesson.id == TaskSubmission.lesson_id)
        .where(Lesson.course_id == course_id)
        .order_by(TaskSubmission.submitted_at.desc())
    )
    if status:
        q = q.where(TaskSubmission.status == SubmissionStatus(status))

    return (await db.execute(q)).scalars().all()


async def get_user_submissions(
    db:      AsyncSession,
    user_id: int,
) -> list[TaskSubmission]:
    """Все задания студента."""
    return (await db.execute(
        select(TaskSubmission)
        .where(TaskSubmission.user_id == user_id)
        .order_by(TaskSubmission.submitted_at.desc())
    )).scalars().all()