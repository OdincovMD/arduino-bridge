from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_prefix="APP_", extra="ignore")

    app_name: str = "Arduino Bridge API"
    debug: bool = False
    api_v1_prefix: str = "/api/v1"
    database_url: str = "postgresql+asyncpg://postgres:postgres@db:5432/arduino_bridge"
    jwt_secret_key: str = "change-me"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24
    default_admin_email: str = "admin@example.com"
    default_admin_password: str = "admin12345"
    default_device_slug: str = "greenhouse-01"
    default_device_name: str = "Greenhouse Controller"
    default_device_token: str = "CHANGEME123456"
    protocol_version: str = "v1"
    cors_origins: list[str] = Field(default_factory=lambda: ["*"])


@lru_cache
def get_settings() -> Settings:
    return Settings()
