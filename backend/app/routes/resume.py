from fastapi import APIRouter, File, UploadFile

from app.schemas.resume import ResumeClaimsResponse, ResumeUploadResponse

router = APIRouter()


@router.post("/upload", response_model=ResumeUploadResponse)
async def upload_resume(file: UploadFile = File(...)) -> ResumeUploadResponse:
    # TODO: store file, parse with AI, persist Resume + parsed_claims
    return ResumeUploadResponse(resume_id=0, claims={})


@router.get("/{resume_id}/claims", response_model=ResumeClaimsResponse)
def get_claims(resume_id: int) -> ResumeClaimsResponse:
    # TODO: load claims for a resume
    return ResumeClaimsResponse(resume_id=resume_id, claims={})

