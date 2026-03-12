# services/course_service.py — все операции с таблицей courses
#
# Сервис = прослойка между GraphQL и БД.
# graphql/ вызывает сервис → сервис пишет/читает БД.

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.course import Course


async def get_all_courses(db: AsyncSession) -> list[Course]:
    """Получить все опубликованные курсы, отсортированные по рейтингу."""
    result = await db.execute(
        select(Course)
        .where(Course.is_published == True)
        .order_by(Course.rating.desc())
    )
    return list(result.scalars().all())


async def create_course(db: AsyncSession, data: dict) -> Course:
    """Создать новый курс и сохранить в БД."""
    course = Course(**data)
    db.add(course)
    await db.commit()
    await db.refresh(course)  # перечитываем из БД чтобы получить id
    return course