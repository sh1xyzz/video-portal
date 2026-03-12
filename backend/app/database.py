# database.py — создаёт соединение с PostgreSQL
#
# AsyncSession = сессия которая работает с async/await
# Base = родитель для всех моделей (таблиц)

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.config import settings

# Движок — знает как подключиться к БД
engine = create_async_engine(settings.database_url)

# Фабрика сессий — каждый запрос получает свою сессию
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

# От Base наследуются все модели
class Base(DeclarativeBase):
    pass