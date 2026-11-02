import logging
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from app.config import get_settings

logger = logging.getLogger("portos-db")
settings = get_settings()

db_url = settings.database_url or "sqlite:///./portos.db"

# Check if PostgreSQL connection can be established; if not or if using SQLite, use SQLite
engine = None

if db_url.startswith("postgresql"):
    try:
        test_engine = create_engine(db_url, pool_pre_ping=True, connect_args={"connect_timeout": 2})
        with test_engine.connect():
            pass
        engine = test_engine
        logger.info("Connected to PostgreSQL database: %s", db_url.split("@")[-1])
    except Exception as e:
        logger.warning(
            "PostgreSQL is not reachable (%s). Falling back to local SQLite database 'portos.db' for development/demo.",
            e,
        )
        db_url = "sqlite:///./portos.db"

if engine is None:
    connect_args = {"check_same_thread": False} if db_url.startswith("sqlite") else {}
    engine = create_engine(
        db_url,
        connect_args=connect_args,
        pool_pre_ping=True,
    )

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


def get_db() -> Generator[Session, None, None]:
    """Dependency for providing transactional database sessions."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
