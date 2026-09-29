import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    APP_NAME: str = "REMALJ Carewell SIMS Backend"
    APP_ENV: str = "development"
    DEBUG: bool = True
    SECRET_KEY: str = "super_secret_jwt_key_rcis_carewell_2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480

    HOST: str = "0.0.0.0"
    PORT: int = 8000
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "https://portal.remaljcarewell.edu.gh",
        "https://rcis-backend.onrender.com",
        "*"
    ]

    DATABASE_URL: str = "sqlite+aiosqlite:///./rcis_sims.db"

    SMS_API_KEY: str = "67648ed5720ca875d42dc20f5726d94c9c1ea2b149a541784b5ba2194241b022"
    SMS_SENDER_ID: str = "RCIS"
    SMS_GATEWAY_URL: str = "https://api.smsonlinegh.com/v5/sms/send"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
