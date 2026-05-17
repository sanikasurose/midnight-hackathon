from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.resume import Resume
from app.models.user import User
from app.services.ai_engine import AIEngine
from app.services.file_storage import save_resume_pdf
from app.services.pdf_text_extractor import extract_text_from_pdf_bytes


def create_resume_from_upload(
    db: Session,
    *,
    user_id: int,
    pdf_bytes: bytes,
    ai_engine: AIEngine,
) -> tuple[Resume, dict]:
    user = db.execute(select(User).where(User.id == user_id)).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    file_path = save_resume_pdf(pdf_bytes=pdf_bytes)
    raw_text = extract_text_from_pdf_bytes(pdf_bytes)
    print(raw_text)

    from app.services.ai_engine import (
        AIAuthenticationError,
        AIRateLimitError,
        AIValidationError,
        AIConnectionError,
    )

    try:
        claims = ai_engine.parse_resume(raw_text)
    except AIAuthenticationError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="AI Service Authentication Failed",
        ) from e
    except AIRateLimitError as e:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="AI Service rate limit exceeded, please try again later",
        ) from e
    except AIValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI Service returned invalid schema data",
        ) from e
    except AIConnectionError as e:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="AI Service connection timed out",
        ) from e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI parsing service error",
        ) from e

    resume = Resume(
        user_id=user_id,
        file_path=file_path,
        raw_text=raw_text or None,
        parsed_claims=claims or {},
        fraud_score=None,
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)

    return resume, (claims or {})
