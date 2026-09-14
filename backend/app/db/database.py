import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

logger = logging.getLogger("uvicorn")

Base = declarative_base()

def get_engine():
    """Attempt connecting to configured MySQL; fallback to SQLite if needed."""
    try:
        connect_args = {"connect_timeout": 3} if "pymysql" in settings.DATABASE_URL else {}
        engine = create_engine(
            settings.DATABASE_URL,
            connect_args=connect_args,
            pool_recycle=3600,
            pool_pre_ping=True
        )
        with engine.connect() as conn:
            pass
        logger.info(f"Connected successfully to primary database ({settings.DATABASE_URL.split('@')[-1] if '@' in settings.DATABASE_URL else 'DB'})")
        return engine
    except Exception as exc:
        if settings.USE_SQLITE_FALLBACK:
            logger.warning(f"Could not connect to primary database ({exc}). Using SQLite fallback: {settings.SQLITE_URL}")
            fallback_engine = create_engine(
                settings.SQLITE_URL,
                connect_args={"check_same_thread": False}
            )
            return fallback_engine
        raise exc

engine = get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
