from __future__ import annotations

import re

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.credential import Credential
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
    original_filename: str | None = None,
    ai_engine: AIEngine,
) -> tuple[Resume, dict, list[Credential]]:
    user = db.execute(select(User).where(User.id == user_id)).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    file_path = save_resume_pdf(pdf_bytes=pdf_bytes)
    raw_text = extract_text_from_pdf_bytes(pdf_bytes)

    try:
        claims = ai_engine.parse_resume(raw_text)
    except Exception:
        claims = basic_resume_parse(raw_text)

    claims = normalize_resume_claims(claims or {})

    resume = Resume(
        user_id=user_id,
        file_path=file_path,
        original_filename=original_filename,
        raw_text=raw_text or None,
        parsed_claims=claims,
        fraud_score=None,
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)

    credentials = create_credentials_from_claims(
        db,
        user_id=user_id,
        resume_id=resume.id,
        claims=claims,
    )

    return resume, claims, credentials


def normalize_resume_claims(claims: dict) -> dict:
    return {
        "name": claims.get("name") or "Candidate",
        "degree": claims.get("degree") or "Not detected",
        "gpa": claims.get("gpa"),
        "skills": claims.get("skills") if isinstance(claims.get("skills"), list) else [],
        "experience": claims.get("experience") if isinstance(claims.get("experience"), list) else [],
        "certifications": claims.get("certifications") if isinstance(claims.get("certifications"), list) else [],
    }


def basic_resume_parse(raw_text: str) -> dict:
    lines = [line.strip() for line in (raw_text or "").splitlines() if line.strip()]
    gpa_match = re.search(r"\bGPA\b\s*[:\-]?\s*([0-4](?:\.\d{1,2})?)", raw_text or "", re.IGNORECASE)
    degree_match = re.search(
        r"\b(Bachelor|Master|PhD|BSc|BA|BS|MSc|MA|MBA)[^\n,;]*",
        raw_text or "",
        re.IGNORECASE,
    )
    known_skills = [
        "Python",
        "TypeScript",
        "JavaScript",
        "React",
        "Next.js",
        "FastAPI",
        "SQL",
        "PostgreSQL",
        "Docker",
        "AWS",
        "Machine Learning",
    ]

    return {
        "name": lines[0] if lines else "Candidate",
        "degree": degree_match.group(0).strip() if degree_match else "Not detected",
        "gpa": float(gpa_match.group(1)) if gpa_match else None,
        "skills": [skill for skill in known_skills if re.search(rf"\b{re.escape(skill)}\b", raw_text or "", re.IGNORECASE)],
        "experience": [],
        "certifications": [],
    }


def create_credentials_from_claims(
    db: Session,
    *,
    user_id: int,
    resume_id: int,
    claims: dict,
) -> list[Credential]:
    credentials: list[Credential] = []

    if claims.get("gpa") is not None:
        credentials.append(
            Credential(
                user_id=user_id,
                resume_id=resume_id,
                claim_type="GPA",
                claim_value="private:gpa",
                verification_status="pending",
            )
        )

    if claims.get("degree") and claims.get("degree") != "Not detected":
        credentials.append(
            Credential(
                user_id=user_id,
                resume_id=resume_id,
                claim_type="DEGREE",
                claim_value="private:degree",
                verification_status="pending",
            )
        )

    if claims.get("experience"):
        credentials.append(
            Credential(
                user_id=user_id,
                resume_id=resume_id,
                claim_type="EXPERIENCE",
                claim_value="private:experience",
                verification_status="pending",
            )
        )

    if claims.get("certifications"):
        credentials.append(
            Credential(
                user_id=user_id,
                resume_id=resume_id,
                claim_type="CERTIFICATION",
                claim_value="private:certification",
                verification_status="pending",
            )
        )

    if not credentials:
        return []

    db.add_all(credentials)
    db.commit()
    for credential in credentials:
        db.refresh(credential)

    return credentials
