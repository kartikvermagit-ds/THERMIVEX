import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "PYRAVEX Industrial Fire Intelligence"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./pyravex.db")
    NASA_FIRMS_MAP_KEY: str = os.getenv("NASA_FIRMS_MAP_KEY", "DEMO_KEY")
    CORS_ORIGINS: list[str] = ["*"]
    DATA_DIR: str = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
    ENABLE_DEMO_DATA: bool = os.getenv("ENABLE_DEMO_DATA", "true").lower() in ("true", "1", "yes")
    MAX_UPLOAD_SIZE_BYTES: int = 10 * 1024 * 1024  # 10 MB limit
    CLUSTER_RUN_STALE_MINUTES: int = int(os.getenv("CLUSTER_RUN_STALE_MINUTES", "30"))

    model_config = SettingsConfigDict(case_sensitive=True)

settings = Settings()
