import os
from functools import lru_cache
from typing import List, Optional
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "backend/.env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # Core environment
    ENVIRONMENT: str = Field(default="development")
    HOST: str = Field(default="127.0.0.1")
    PORT: int = Field(default=8000)
    DEBUG: bool = Field(default=False)
    TESTING: bool = Field(default=False)

    # Database
    DATABASE_URL: str = Field(default="sqlite:///./mahasetu.db")
    AUTO_RUN_MIGRATIONS: bool = Field(default=True)

    # Security & JWT
    JWT_SECRET: Optional[str] = Field(default=None)
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=1440)
    CORS_ALLOWED_ORIGINS: str = Field(
        default="http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://localhost:5174,http://127.0.0.1:5174"
    )

    # Operational Modes & Flags
    DEMO_MODE: bool = Field(default=True)
    ALLOW_DEMO_EXPOSURE: bool = Field(default=False)
    ENABLE_INNOVATION_LAB: bool = Field(default=False)

    # External integrations & queues
    REDIS_URL: str = Field(default="redis://localhost:6379/0")
    FIREBASE_SERVICE_ACCOUNT_PATH: Optional[str] = None
    FIREBASE_PROJECT_ID: Optional[str] = None
    FIREBASE_STORAGE_BUCKET: Optional[str] = None

    TWILIO_ACCOUNT_SID: Optional[str] = None
    TWILIO_AUTH_TOKEN: Optional[str] = None
    TWILIO_PHONE_NUMBER: Optional[str] = None

    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = Field(default="gemini-2.5-flash")

    # Observability
    SENTRY_DSN: Optional[str] = None

    @field_validator("ENVIRONMENT")
    @classmethod
    def normalize_env(cls, v: str) -> str:
        return v.lower().strip()

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT in ("production", "prod")

    @property
    def cors_origins_list(self) -> List[str]:
        return [orig.strip() for orig in self.CORS_ALLOWED_ORIGINS.split(",") if orig.strip()]

    def validate_production_readiness(self) -> None:
        """Fail-fast validation for production environments."""
        if self.is_production:
            if not self.JWT_SECRET or len(self.JWT_SECRET) < 32:
                raise RuntimeError(
                    "FATAL: In production, JWT_SECRET must be set and contain at least 32 cryptographically strong characters."
                )
            if self.DEMO_MODE:
                raise RuntimeError(
                    "FATAL: DEMO_MODE=true is strictly prohibited in production! "
                    "Set DEMO_MODE=false and provide production credentials."
                )
            if self.DATABASE_URL.startswith("sqlite"):
                raise RuntimeError(
                    "FATAL: SQLite is prohibited in production! Configure a PostgreSQL DATABASE_URL."
                )

@lru_cache()
def get_settings() -> Settings:
    settings = Settings()
    # If environment variable JWT_SECRET is set via os.environ, ensure it is picked up
    if not settings.JWT_SECRET and os.getenv("JWT_SECRET"):
        settings.JWT_SECRET = os.getenv("JWT_SECRET")
    settings.validate_production_readiness()
    return settings

settings = get_settings()
