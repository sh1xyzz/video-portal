# backend/app/services/testimonial_service.py

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.testimonial import Testimonial


async def get_all(db: AsyncSession) -> list[Testimonial]:
    result = await db.execute(
        select(Testimonial)
        .where(Testimonial.is_published == True)
        .order_by(Testimonial.id.asc())
    )
    return list(result.scalars().all())


async def create(db: AsyncSession, data: dict) -> Testimonial:
    t = Testimonial(**data)
    db.add(t)
    await db.commit()
    await db.refresh(t)
    return t