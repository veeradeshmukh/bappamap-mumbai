from typing import Any

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", ".env.local", "../.env.local"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    PROJECT_NAME: str = "BappaMap Mumbai API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:bappapassword@localhost:5432/bappamap"
    SYNC_DATABASE_URL: str = "postgresql+psycopg2://postgres:bappapassword@localhost:5432/bappamap"

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_async_db_connection(cls, v: Any) -> str:
        if isinstance(v, str):
            if v.startswith("postgres://"):
                return v.replace("postgres://", "postgresql+asyncpg://", 1)
            if v.startswith("postgresql://") and "+asyncpg" not in v:
                return v.replace("postgresql://", "postgresql+asyncpg://", 1)
        return str(v)

    # Security & Admin Authentication
    ADMIN_PASSWORD: str = "bappa-admin-secret-2027"
    SECRET_KEY: str = "bappamap_default_session_secret_dev_key_2027"
    ADMIN_COOKIE_NAME: str = "bappa_admin_session"
    SESSION_MAX_AGE_SECONDS: int = 86400  # 24 hours

    # Cloudflare Turnstile
    TURNSTILE_SECRET_KEY: str = "1x0000000000000000000000000000000AA"
    TURNSTILE_SITE_KEY: str = "1x00000000000000000000AA"

    # DPDP Act Privacy Salt & Rate Limiting
    RATE_LIMIT_SALT: str = "bappamap_dev_salt_local"
    RATE_LIMIT_MAX_REQUESTS: int = 5
    RATE_LIMIT_WINDOW_SECONDS: int = 600  # 10 minutes

    # Geographic Bounds Invariant (South Mumbai Core)
    MIN_LAT: float = 18.8900
    MAX_LAT: float = 19.0150
    MIN_LNG: float = 72.7800
    MAX_LNG: float = 72.8700

    # CORS
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://bappamap.in"
    ]

    # Cloudflare R2 / Object Storage
    R2_ENDPOINT_URL: str | None = None
    R2_ACCESS_KEY_ID: str | None = None
    R2_SECRET_ACCESS_KEY: str | None = None
    R2_QUARANTINE_BUCKET: str = "bappamap-quarantine"
    R2_PUBLIC_BUCKET: str = "bappamap-public"
    R2_PUBLIC_DOMAIN: str = "https://photos.bappamap.in"
    LOCAL_STORAGE_DIR: str = "uploads"


settings = Settings()
