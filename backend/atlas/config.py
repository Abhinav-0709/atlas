from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Core
    APP_NAME: str = "Atlas"
    APP_ENV: str = "development"
    DEBUG: bool = True
    LOG_LEVEL: str = "INFO"

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://atlas:atlas_password@localhost:5432/atlas_db"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Worker & Leasing
    DEFAULT_LEASE_DURATION_SECONDS: int = 30
    HEARTBEAT_INTERVAL_SECONDS: int = 10
    LEASE_REAPER_INTERVAL_SECONDS: int = 15


settings = Settings()
