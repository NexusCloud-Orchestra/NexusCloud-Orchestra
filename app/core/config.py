from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    APP_NAME: str = "NexusCloud"
    ENVIRONMENT: str = "development"
    DEBUG: bool = False
    DATABASE_URL: str = "postgresql+asyncpg://nexuscloud:nexuscloud@localhost:5432/nexuscloud"
    REDIS_URL: str = "redis://localhost:6379/0"
    SECRET_KEY: str = ""
    ENCRYPTION_KEY: str = ""
    PUBLIC_API_URL: str = "http://localhost:7575"
    CORS_ORIGINS: str = "http://localhost:5173"
    LOCAL_STORAGE_ENABLED: bool = False
    LOCAL_STORAGE_PATH: str = "storage"
    RESET_TOKEN_TTL_MINUTES: int = 30
    ACCESS_TOKEN_TTL_MINUTES: int = 30
    REFRESH_TOKEN_TTL_DAYS: int = 7
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = ""
    FRONTEND_URL: str = "http://localhost:5173"

    @property
    def production(self) -> bool:
        return self.ENVIRONMENT == "production"

    def assert_safe(self) -> None:
        if self.production:
            if len(self.SECRET_KEY) < 32 or len(self.ENCRYPTION_KEY) < 32:
                raise ValueError("Production requires strong SECRET_KEY and ENCRYPTION_KEY")
            if self.SECRET_KEY == self.ENCRYPTION_KEY or "replace_with" in self.SECRET_KEY or "replace_with" in self.ENCRYPTION_KEY:
                raise ValueError("Production secrets must be independent and non-placeholder")
            if self.LOCAL_STORAGE_ENABLED or self.DEBUG:
                raise ValueError("Local storage and debug must be disabled in production")
            if not self.PUBLIC_API_URL.startswith("https://"):
                raise ValueError("Production PUBLIC_API_URL must use HTTPS")
            if not self.FRONTEND_URL.startswith("https://"):
                raise ValueError("Production FRONTEND_URL must use HTTPS")
            if "*" in self.CORS_ORIGINS or any(
                not origin.strip().startswith("https://") for origin in self.CORS_ORIGINS.split(",")
            ):
                raise ValueError("Production CORS origins must be explicit HTTPS origins")
            if not self.SMTP_HOST or not self.SMTP_FROM:
                raise ValueError("Production password recovery requires SMTP_HOST and SMTP_FROM")
        if not self.SECRET_KEY or not self.ENCRYPTION_KEY:
            raise ValueError("SECRET_KEY and ENCRYPTION_KEY must be configured")


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
