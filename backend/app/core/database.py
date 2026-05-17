from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app import models  # noqa: F401
from app.models.base import Base

engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
    # Hackathon-friendly schema drift guard: add new columns if DB was created earlier.
    # Avoids forcing developers to drop volumes during rapid iteration.
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE applications ADD COLUMN IF NOT EXISTS credential_id INTEGER"))
        # Legacy Phase 0 column was `proof_id` (NOT NULL). Drop NOT NULL if it still exists to avoid 500s on insert.
        conn.execute(
            text(
                """
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'applications' AND column_name = 'proof_id'
  ) THEN
    EXECUTE 'ALTER TABLE applications ALTER COLUMN proof_id DROP NOT NULL';
  END IF;
END $$;
"""
            )
        )
        conn.execute(
            text(
                "CREATE UNIQUE INDEX IF NOT EXISTS uq_applications_job_candidate_idx "
                "ON applications (job_id, candidate_id)"
            )
        )


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
