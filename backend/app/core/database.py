# pyrefly: ignore [missing-import]
from sqlalchemy import create_engine
from sqlalchemy import text
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app import models  # noqa: F401
from app.models.base import Base

connect_args = {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True, connect_args=connect_args)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
    if "postgresql" not in settings.DATABASE_URL:
        return

    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE resumes ADD COLUMN IF NOT EXISTS original_filename VARCHAR"))
        conn.execute(text("ALTER TABLE credentials ADD COLUMN IF NOT EXISTS user_id INTEGER"))
        conn.execute(text("ALTER TABLE applications ADD COLUMN IF NOT EXISTS credential_id INTEGER"))
        conn.execute(
            text(
                """
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'applications' AND column_name = 'proof_id'
  ) THEN
    EXECUTE 'ALTER TABLE applications ALTER COLUMN proof_id DROP NOT NULL';
  END IF;
END $$;
"""
            )
        )


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
