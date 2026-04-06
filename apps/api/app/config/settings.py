from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "AlgoScope API"
    environment: str = "development"
    api_prefix: str = "/api/v1"
    sandbox_image: str = "algoscope-sandbox-runner:latest"
    sandbox_default_timeout_ms: int = 5000
    sandbox_default_memory_mb: int = 256
    sandbox_default_cpu_cap: float = 1.0
    sandbox_disable_network: bool = True
    cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:3001"])


@lru_cache
def get_settings() -> Settings:
    return Settings()
