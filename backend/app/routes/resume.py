from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.schemas.resume import ResumeClaimsResponse, ResumeUploadResponse
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

    ai_engine = AIEngine(settings.ANTHROPIC_API_KEY)
    resume, claims = create_resume_from_upload(db, user_id=user_id, pdf_bytes=pdf_bytes, ai_engine=ai_engine)
    return ResumeUploadResponse(resume_id=resume.id, claims=claims)


@router.get("/{resume_id}/claims", response_model=ResumeClaimsResponse)
def get_claims(resume_id: int) -> ResumeClaimsResponse:
    # TODO: load claims for a resume
    return ResumeClaimsResponse(resume_id=resume_id, claims={})
