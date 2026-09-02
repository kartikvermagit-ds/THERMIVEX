import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "THERMIVEX Industrial Fire Intelligence"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./thermivex.db")
    NASA_FIRMS_MAP_KEY: str = os.getenv("NASA_FIRMS_MAP_KEY", "DEMO_KEY")
    CORS_ORIGINS: list[str] = ["*"]
    DATA_DIR: str = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")

    class Config:
        case_sensitive = True

settings = Settings()
