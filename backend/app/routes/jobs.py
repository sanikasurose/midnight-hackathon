from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.schemas.jobs import (
    JobListItem,
    JobCreateRequest,
    JobCreateResponse,
    JobGetResponse,
)
from app.schemas.applications import ApplicationCreateRequest, ApplicationCreateResponse
from app.services.auth_service import decode_token, get_bearer_token
from app.services.application_service import create_application
from app.services.job_service import create_job as create_job_record
from app.services.job_service import get_job as get_job_record
from app.services.job_service import list_jobs as list_jobs_records

router = APIRouter()


@router.post("", response_model=JobCreateResponse)
def create_job(
    payload: JobCreateRequest,
    db: Session = Depends(get_db),
    token: str = Depends(get_bearer_token),
) -> JobCreateResponse:
    claims = decode_token(token)
    role = claims.get("role")
    employer_id = claims.get("user_id")

    if role != "EMPLOYER":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Employer role required")
    if not isinstance(employer_id, int):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    employer = db.execute(select(User).where(User.id == employer_id)).scalar_one_or_none()
    if not employer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employer not found")

    job = create_job_record(
        db,
        employer_id=employer_id,
        title=payload.title,
        description=payload.description,
        requirements=payload.requirements or {},
    )
    return JobCreateResponse(job_id=job.id, title=job.title)


@router.get("", response_model=list[JobListItem])
def list_jobs(db: Session = Depends(get_db)) -> list[JobListItem]:
    jobs = list_jobs_records(db)
    return [JobListItem(id=job.id, title=job.title, requirements=job.requirements or {}) for job in jobs]


@router.get("/{job_id}", response_model=JobGetResponse)
def get_job(job_id: int, db: Session = Depends(get_db)) -> JobGetResponse:
    job = get_job_record(db, job_id=job_id)
    return JobGetResponse(
        id=job.id,
        title=job.title,
        description=job.description,
        requirements=job.requirements or {},
    )


@router.post("/{job_id}/apply", response_model=ApplicationCreateResponse)
def apply_to_job(
    job_id: int,
    payload: ApplicationCreateRequest,
    db: Session = Depends(get_db),
    token: str = Depends(get_bearer_token),
) -> ApplicationCreateResponse:
    claims = decode_token(token)
    role = claims.get("role")
    candidate_id = claims.get("user_id")

    if role != "CANDIDATE":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Candidate role required")
    if not isinstance(candidate_id, int):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    application = create_application(
        db,
        job_id=job_id,
        candidate_id=candidate_id,
        credential_id=payload.credential_id,
    )
    return ApplicationCreateResponse(
        application_id=application.id,
        job_id=application.job_id,
        verification_status=application.verification_status,
    )
