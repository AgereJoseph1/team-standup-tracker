from functools import lru_cache
from pydantic import BaseSettings, AnyUrl


class Settings(BaseSettings):
    app_name: str = "Team Standup Tracker"
    environment: str = "development"
    secret_key: str = "changeme-secret-key"
    access_token_expire_minutes: int = 60 * 24
    algorithm: str = "HS256"

    database_url: AnyUrl | str = "sqlite+aiosqlite:///./standup.db"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache
def get_settings() -> Settings:
    return Settings()
