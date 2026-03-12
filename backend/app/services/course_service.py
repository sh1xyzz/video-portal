# backend/app/services/course_service.py
# ✅ get_all_courses
# ✅ create_course — принимает owner_id
# ✅ update_course — обновляет поля курса
# ✅ get_teacher_courses — курсы конкретного учителя

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.course import Course


async def get_all_courses(db: AsyncSession) -> list[Course]:
    """Все опубликованные курсы, по рейтингу."""
    result = await db.execute(
        select(Course)
        .where(Course.is_published == True)
        .order_by(Course.rating.desc())
    )
    return list(result.scalars().all())


async def create_course(db: AsyncSession, data: dict) -> Course:
    """Создать курс. data может содержать owner_id и coin_price."""
    course = Course(**data)
    db.add(course)
    await db.commit()
    await db.refresh(course)
    return course


async def update_course(db: AsyncSession, course_id: int, data: dict) -> Course | None:
    """Обновить поля курса. Возвращает None если курс не найден."""
    course = (await db.execute(
        select(Course).where(Course.id == course_id)
    )).scalar_one_or_none()

    if not course:
        return None

    for key, value in data.items():
        if hasattr(course, key) and value is not None:
            setattr(course, key, value)

    await db.commit()
    await db.refresh(course)
    return course


async def get_teacher_courses(db: AsyncSession, owner_id: int) -> list[Course]:
    """Курсы конкретного teacher/admin."""
    result = await db.execute(
        select(Course)
        .where(Course.owner_id == owner_id, Course.is_published == True)
        .order_by(Course.id.desc())
    )
    return list(result.scalars().all())