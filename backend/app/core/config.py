import logging
from typing import List
from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# =============================================================================
# CONFIGURATION & LOGGING
# =============================================================================
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ConfigLoader")

class Settings(BaseSettings):
    # --- Project Info ---
    PROJECT_NAME: str = "Hire App API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # --- Environment & Security ---
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    # SECURITY: No default. Must be set in environment.
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15  # Short-lived (15 mins)
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30    # Long-lived (30 Days)

    # --- Database ---
    MONGO_URL: str = "mongodb://localhost:27017"
    DB_NAME: str = "hire_app_db"
    REDIS_URL: str = "redis://localhost:6379/0"

    # --- CORS ---
    BACKEND_CORS_ORIGINS: List[str] = ["*"]

    # --- Pydantic Config ---
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

    @model_validator(mode="after")
    def validate_security(self):
        """
        SECURITY GATEKEEPER.
        1. Reject startup if SECRET_KEY is missing or weak.
        2. Force DEBUG=False in production.
        """
        # Rule 1: SECRET_KEY must exist and be strong
        if not self.SECRET_KEY or len(self.SECRET_KEY) < 32:
            error_msg = (
                "🚨 CRITICAL SECURITY FAILURE 🚨\n"
                "SECRET_KEY is missing or too weak (min 32 chars).\n"
                "Set a strong SECRET_KEY in your .env file.\n"
                "Example: SECRET_KEY=your-very-long-random-string-here-64-chars"
            )
            logger.critical(error_msg)
            raise ValueError(error_msg)

        # Rule 2: Production lockdown
        if self.ENVIRONMENT.lower() == "production":
            self.DEBUG = False
            
            if self.BACKEND_CORS_ORIGINS == ["*"]:
                logger.warning(
                    "⚠️ SECURITY WARNING: CORS is set to '*' in Production. "
                    "Set BACKEND_CORS_ORIGINS to your specific frontend domains."
                )
        
        return self

# =============================================================================
# INSTANTIATION
# =============================================================================
try:
    settings = Settings()
    logger.info(f"✅ Config Loaded. Env: {settings.ENVIRONMENT} | Debug: {settings.DEBUG}")
except Exception as e:
    logger.critical(f"❌ Config Load Failed: {e}")
    raise e