from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Hire App"
    API_V1_STR: str = "/api/v1"
    MONGO_URL: str = "mongodb://localhost:27017"
    DB_NAME: str = "hire_app_db"
    SECRET_KEY: str = "YOUR_SUPER_SECRET_KEY_CHANGE_ME_IN_PROD_998877"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 120  # Longer for dev
    
    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
