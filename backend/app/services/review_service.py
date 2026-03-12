# backend/app/services/review_service.py
# Сервис для работы с отзывами к курсам

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.review import Review


async def get_course_reviews(db: AsyncSession, course_id: int) -> list[Review]:
    """Все отзывы к курсу, от новых к старым."""
    result = await db.execute(
        select(Review)
        .where(Review.course_id == course_id)
        .order_by(Review.created_at.desc())
    )
    return result.scalars().all()


async def get_user_review(
    db: AsyncSession, course_id: int, user_id: int
) -> Review | None:
    """Отзыв конкретного пользователя к курсу (один на курс)."""
    result = await db.execute(
        select(Review).where(
            Review.course_id == course_id,
            Review.user_id == user_id,
        )
    )
    return result.scalar_one_or_none()


async def create_or_update_review(
    db: AsyncSession,
    course_id:   int,
    user_id:     int,
    user_name:   str,
    user_avatar: str,
    rating:      float,
    text:        str,
) -> Review:
    """Создать новый отзыв или обновить существующий."""
    existing = await get_user_review(db, course_id, user_id)

    if existing:
        existing.rating = rating
        existing.text   = text
        await db.commit()
        await db.refresh(existing)
        return existing

    review = Review(
        course_id   = course_id,
        user_id     = user_id,
        user_name   = user_name,
        user_avatar = user_avatar,
        rating      = rating,
        text        = text,
    )
    db.add(review)
    await db.commit()
    await db.refresh(review)
    return review


async def delete_review(db: AsyncSession, review_id: int, user_id: int) -> bool:
    result = await db.execute(
        select(Review).where(
            Review.id == review_id,
            Review.user_id == user_id,
        )
    )
    review = result.scalar_one_or_none()
    if not review:
        return False
    await db.delete(review)
    await db.commit()
    return True