import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.application import Application
from app.models.job import Job
from app.models.user import User
from app.schemas.applications import ApplicationCreateRequest, ApplicationCreateResponse
from app.schemas.jobs import (
    EmployerApplicationItem,
    JobCreateRequest,
    JobCreateResponse,
    JobGetResponse,
    JobListItem,
    JobRequirement,
)
from app.services.application_service import create_application
from app.services.auth_service import decode_token, get_bearer_token
from app.services.job_service import create_job as create_job_record
from app.services.job_service import get_job as get_job_record
from app.services.job_service import list_jobs as list_jobs_records

router = APIRouter()
logger = logging.getLogger(__name__)


def _normalize_requirements(requirements: dict[str, Any] | list[JobRequirement]) -> dict[str, Any]:
    if isinstance(requirements, list):
        return {req.type: {"operator": req.operator, "value": req.value} for req in requirements}
    return requirements


def _require_employer(token: str) -> int:
    claims = decode_token(token)
    role = claims.get("role")
    employer_id = claims.get("user_id")

    if role != "EMPLOYER":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Employer role required")
    if not isinstance(employer_id, int):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    return employer_id


@router.post("", response_model=JobCreateResponse)
def create_job(
    payload: JobCreateRequest,
    db: Session = Depends(get_db),
    token: str = Depends(get_bearer_token),
) -> JobCreateResponse:
    employer_id = _require_employer(token)

    employer = db.execute(select(User).where(User.id == employer_id)).scalar_one_or_none()
    if not employer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employer not found")

    requirements = _normalize_requirements(payload.requirements or {})
    job = create_job_record(
        db,
        employer_id=employer_id,
        title=payload.title,
        description=payload.description,
        requirements=requirements,
    )
    logger.info("Created job %s for employer %s", job.id, employer_id)
    return JobCreateResponse(job_id=job.id, title=job.title)


@router.get("/employer/mine", response_model=list[JobListItem])
def list_employer_jobs(
    db: Session = Depends(get_db),
    token: str = Depends(get_bearer_token),
) -> list[JobListItem]:
    employer_id = _require_employer(token)
    jobs = (
        db.execute(select(Job).where(Job.employer_id == employer_id).order_by(Job.created_at.desc(), Job.id.desc()))
        .scalars()
        .all()
    )
    return [
        JobListItem(
            id=job.id,
            title=job.title,
            description=job.description,
            requirements=job.requirements or {},
            application_count=len(job.applications),
            created_at=job.created_at.isoformat() if job.created_at else None,
        )
        for job in jobs
    ]


@router.get("/employer/applications", response_model=list[EmployerApplicationItem])
def list_employer_applications(
    db: Session = Depends(get_db),
    token: str = Depends(get_bearer_token),
) -> list[EmployerApplicationItem]:
    employer_id = _require_employer(token)
    rows = (
        db.execute(
            select(Application)
            .join(Job, Application.job_id == Job.id)
            .where(Job.employer_id == employer_id)
            .order_by(Application.created_at.desc(), Application.id.desc())
        )
        .scalars()
        .all()
    )

    return [
        EmployerApplicationItem(
            application_id=application.id,
            job_id=application.job_id,
            job_title=application.job.title,
            candidate_id=application.candidate_id,
            candidate_email=application.candidate.email if application.candidate else None,
            credential_id=application.credential_id,
            credential_type=application.credential.claim_type if application.credential else None,
            verification_status=application.verification_status,
            created_at=application.created_at.isoformat() if application.created_at else None,
        )
        for application in rows
    ]


@router.get("", response_model=list[JobListItem])
def list_jobs(db: Session = Depends(get_db)) -> list[JobListItem]:
    jobs = list_jobs_records(db)
    return [
        JobListItem(
            id=job.id,
            title=job.title,
            description=job.description,
            requirements=job.requirements or {},
            application_count=len(job.applications),
            created_at=job.created_at.isoformat() if job.created_at else None,
        )
        for job in jobs
    ]


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

