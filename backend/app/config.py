import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DB_PASSWORD: str = "changeme123"
    # PostgreSQL async URL is the default for production & docker-compose
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql+asyncpg://Infera:changeme123@db:5432/Infera"
    )
    # Dev-only fallback path when running locally without Docker
    DATABASE_URL_SQLITE: str = "sqlite+aiosqlite:///./infera.db"
    ALLOW_AUTO_PROVISION_AGENTS: bool = False
    
    SECRET_KEY: str = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    MODEL_RETRAIN_INTERVAL_MINUTES: int = 30
    ANOMALY_CONTAMINATION_RATE: float = 0.05
    
    TOKEN_SPIKE_THRESHOLD: float = 3.0
    LATENCY_SPIKE_THRESHOLD: float = 3.0
    LOOP_COUNT_THRESHOLD: int = 10
    FAILURE_CASCADE_WINDOW: int = 5
    
    SIMULATOR_TICK_INTERVAL_SEC: float = 2.0
    COST_PER_1K_TOKENS: float = 0.002
    
    API_V1_STR: str = "/api/v1"
    
    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
