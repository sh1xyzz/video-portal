# Читает переменные из .env файла
# pydantic-settings сам находит .env и подставляет значения

from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str

    class Config:
        env_file = ".env"

settings = Settings()