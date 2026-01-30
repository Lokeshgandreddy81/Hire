from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "Hire App"
    API_V1_STR: str = "/api/v1"
    MONGO_URL: str = "mongodb://localhost:27017"
    DB_NAME: str = "hire_app_db"
    ENVIRONMENT: str = "development"
    # SECRET_KEY must be set in production; no default allowed when ENVIRONMENT=production
    SECRET_KEY: Optional[str] = "YOUR_SUPER_SECRET_KEY_CHANGE_ME_IN_PROD_998877"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 120

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()

# Launch requirement: SECRET_KEY from env only in production
if settings.ENVIRONMENT == "production":
    if not settings.SECRET_KEY or settings.SECRET_KEY == "YOUR_SUPER_SECRET_KEY_CHANGE_ME_IN_PROD_998877":
        raise RuntimeError(
            "SECRET_KEY must be set in environment when ENVIRONMENT=production. "
            "Do not use default secret in production."
        )
