from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    allowed_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    http_timeout_seconds: float = 45.0
    treasury_current_year_ttl_seconds: int = 30 * 60
    treasury_past_year_ttl_seconds: int = 7 * 24 * 60 * 60
    mortgage_rates_ttl_seconds: int = 6 * 60 * 60
    history_weeks: int = 52
    warm_cache_on_startup: bool = True

    @property
    def origins(self) -> list[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
