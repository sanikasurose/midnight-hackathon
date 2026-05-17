from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models.resume import Resume
from app.schemas.resume import ResumeClaimsResponse, ResumeCredential, ResumeListItem, ResumeUploadResponse
from app.services.ai_engine import AIEngine
from app.services.resume_service import create_resume_from_upload

router = APIRouter()


@router.post("/upload", response_model=ResumeUploadResponse)
async def upload_resume(
    user_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> ResumeUploadResponse:
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="PDF only")
    if file.content_type not in (None, "", "application/pdf", "application/octet-stream"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="PDF only")

    pdf_bytes = await file.read()
    max_bytes = int(settings.MAX_RESUME_SIZE_MB) * 1024 * 1024
    if len(pdf_bytes) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large (max {settings.MAX_RESUME_SIZE_MB} MB)",
        )

    ai_engine = AIEngine(settings.GEMINI_API_KEY)
    resume, claims, credentials = create_resume_from_upload(
        db,
        user_id=user_id,
        pdf_bytes=pdf_bytes,
        original_filename=file.filename,
        ai_engine=ai_engine,
    )
    return ResumeUploadResponse(
        resume_id=resume.id,
        claims=claims,
        credentials=[serialize_credential(credential) for credential in credentials],
    )


@router.get("/user/{user_id}", response_model=list[ResumeListItem])
def list_user_resumes(user_id: int, db: Session = Depends(get_db)) -> list[ResumeListItem]:
    resumes = (
        db.execute(
            select(Resume)
            .where(Resume.user_id == user_id)
            .order_by(Resume.created_at.desc(), Resume.id.desc())
        )
        .scalars()
        .all()
    )

    return [
        ResumeListItem(
            resume_id=resume.id,
            original_filename=resume.original_filename,
            created_at=resume.created_at.isoformat() if resume.created_at else "",
            claims=resume.parsed_claims or {},
            credentials=[serialize_credential(credential) for credential in resume.credentials],
        )
        for resume in resumes
    ]


@router.get("/{resume_id}/claims", response_model=ResumeClaimsResponse)
def get_claims(resume_id: int, db: Session = Depends(get_db)) -> ResumeClaimsResponse:
    resume = db.execute(select(Resume).where(Resume.id == resume_id)).scalar_one_or_none()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    return ResumeClaimsResponse(resume_id=resume_id, claims=resume.parsed_claims or {})


def serialize_credential(credential) -> ResumeCredential:
    return ResumeCredential(
        id=credential.id,
        claim_type=credential.claim_type,
        label=get_credential_label(credential.claim_type),
        verification_status=credential.verification_status,
    )


def get_credential_label(claim_type: str) -> str:
    labels = {
        "GPA": "GPA threshold proof",
        "DEGREE": "Education claim",
        "EXPERIENCE": "Experience claim",
        "CERTIFICATION": "Certification claim",
    }
    return labels.get(claim_type, claim_type.title())
