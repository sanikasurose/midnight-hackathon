from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.resume import Resume
from app.models.user import User
from app.services.ai_engine import AIEngine
from app.services.file_storage import save_resume_pdf_for_user
from app.services.pdf_text_extractor import extract_text_from_pdf_bytes


def create_resume_from_upload(
    db: Session,
    *,
    user_id: int,
    pdf_bytes: bytes,
    original_filename: str,
    ai_engine: AIEngine,
) -> tuple[Resume, dict]:
    user = db.execute(select(User).where(User.id == user_id)).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    file_path = save_resume_pdf_for_user(user_id=user_id, pdf_bytes=pdf_bytes, original_filename=original_filename)
    raw_text = extract_text_from_pdf_bytes(pdf_bytes)

    try:
        claims = ai_engine.parse_resume(raw_text)
    except NotImplementedError:
        # Phase 1+ will implement Claude integration.
        claims = {"degree": None, "gpa": None, "skills": []}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI parsing service error",
        ) from e

    resume = Resume(
        user_id=user_id,
        file_path=file_path,
        original_filename=original_filename,
        raw_text=raw_text or None,
        parsed_claims=claims or {},
        fraud_score=None,
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)

    return resume, (claims or {})
