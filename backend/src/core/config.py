from pydantic_settings import BaseSettings
from typing import List, Optional
import os

class Settings(BaseSettings):
    APP_NAME: str = "SGC-Trazabilidad"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    SECRET_KEY: str = "dev-secret-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:3001"
    ALLOWED_HOSTS: str = "localhost"
    
    DATABASE_URL: str = "postgresql://sgc_user:Sgc2024Secure@localhost:5432/sgc_trazabilidad"
    DATABASE_POOL_SIZE: int = 20
    DATABASE_MAX_OVERFLOW: int = 40
    
    REDIS_URL: str = "redis://localhost:6379/0"
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"
    
    MODEL_PATH: str = "./models"
    EMBEDDING_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"
    RAG_CHUNK_SIZE: int = 500
    RAG_CHUNK_OVERLAP: int = 100
    
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "logs/app.log"
    
    class Config:
        env_file = ".env"
        case_sensitive = True
    
    @property
    def allowed_origins_list(self) -> List[str]:
        return [x.strip() for x in self.ALLOWED_ORIGINS.split(",") if x.strip()]

settings = Settings()

def get_database_url() -> str:
    """Retorna SQLite por defecto para despliegues sin PostgreSQL (Render free)."""
    env_url = os.getenv("DATABASE_URL")
    if env_url and not env_url.startswith("postgresql://sgc_user:Sgc2024Secure@localhost"):
        return env_url
    sqlite_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "sgc.db")
    os.makedirs(os.path.dirname(sqlite_path), exist_ok=True)
    return f"sqlite:///{sqlite_path}"

DATABASE_URL = get_database_url()
