import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    PROJECT_NAME: str = "AI-Based Multilingual Mass Communication Platform"
    API_V1_STR: str = "/api/v1"
    
    # JWT Authentication Settings
    JWT_SECRET_KEY: str = "7d4a2e58c9b13f06a84d72e915cbfa3068e214d59a7f3e820b6154c8d9e23f01"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # Database configuration
    DATABASE_URL: str = "mysql+pymysql://root:root@localhost:3306/mass_comm_db"
    USE_SQLITE_FALLBACK: bool = True
    SQLITE_URL: str = f"sqlite:///{BASE_DIR / 'mass_comm_dev.db'}"

    # Free AI Provider options: 'gemini' | 'groq'
    AI_PROVIDER: str = "gemini"
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-3.6-flash"
    
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.3-70b-versatile"

    # Step 2: Translation Service Settings (Bhashini / IndicTrans2)
    TRANSLATION_PROVIDER: str = "auto"  # 'auto', 'bhashini', 'indictrans2', 'gemini', 'groq'
    BHASHINI_USER_ID: str = ""
    BHASHINI_API_KEY: str = ""
    BHASHINI_INFERENCE_API_KEY: str = ""
    BHASHINI_PIPELINE_ID: str = ""
    HUGGINGFACE_API_KEY: str = ""

    # Step 5: LanguageTool Grammar Check
    # Default: free public API. Override with local Docker: http://localhost:8010/v2/check
    LANGUAGETOOL_URL: str = "https://api.languagetool.org/v2/check"

    # Step 6: Dispatch Channels (Email SMTP & Twilio SMS/WhatsApp)
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = ""
    SMTP_FROM_NAME: str = "ConnectAI Mass Communications"

    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_PHONE_NUMBER: str = "+17372508034"
    TWILIO_WHATSAPP_NUMBER: str = "+17372508034"

    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )



settings = Settings()
