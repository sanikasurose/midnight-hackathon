from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.core.config import settings
from app.core.database import get_db
from app.schemas.resume import ResumeClaimsResponse, ResumeUploadResponse, ResumeClaims
from app.services.ai_engine import AIEngine
from app.services.file_storage import validate_file_size, validate_pdf_upload
from app.services.resume_service import create_resume_from_upload
from app.models.resume import Resume

router = APIRouter()


@router.post("/upload", response_model=ResumeUploadResponse)
async def upload_resume(
    user_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> ResumeUploadResponse:
    validate_pdf_upload(filename=file.filename, content_type=file.content_type)

    pdf_bytes = await file.read()
    validate_file_size(file_bytes=pdf_bytes, max_size_mb=int(settings.MAX_RESUME_SIZE_MB))

    ai_engine = AIEngine(settings.ANTHROPIC_API_KEY)
    resume, claims = create_resume_from_upload(
        db,
        user_id=user_id,
        pdf_bytes=pdf_bytes,
        original_filename=file.filename,
        ai_engine=ai_engine,
    )
    return ResumeUploadResponse(resume_id=resume.id, claims=claims)


@router.get("/{resume_id}/claims", response_model=ResumeClaimsResponse)
def get_claims(resume_id: int, db: Session = Depends(get_db)) -> ResumeClaimsResponse:
    resume = db.execute(select(Resume).where(Resume.id == resume_id)).scalar_one_or_none()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    return ResumeClaimsResponse(resume_id=resume_id, claims=resume.parsed_claims or {})
