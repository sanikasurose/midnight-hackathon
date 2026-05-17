from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.application import Application
from app.models.credential import Credential
from app.models.job import Job
from app.models.resume import Resume
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
from app.services.auth_service import decode_token

router = APIRouter()
bearer_scheme = HTTPBearer(auto_error=False)


def _get_token(credentials: HTTPAuthorizationCredentials | None) -> str:
    if not credentials or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Bearer token required")
    return credentials.credentials


def _require_role(credentials: HTTPAuthorizationCredentials | None, role: str) -> int:
    claims = decode_token(_get_token(credentials))
    token_role = claims.get("role")
    user_id = claims.get("user_id")

    if token_role != role:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=f"{role.title()} role required")
    if not isinstance(user_id, int):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    return user_id


def _normalize_requirements(requirements: dict[str, Any] | list[JobRequirement]) -> dict[str, Any]:
    if isinstance(requirements, list):
        return {req.type: {"operator": req.operator, "value": req.value} for req in requirements}
    return requirements


def _application_counts(db: Session) -> dict[int, int]:
    rows = db.execute(
        select(Application.job_id, func.count(Application.id))
        .group_by(Application.job_id)
    ).all()
    return {job_id: count for job_id, count in rows}


@router.post("", response_model=JobCreateResponse)
def create_job(
    payload: JobCreateRequest,
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> JobCreateResponse:
    employer_id = _require_role(credentials, "EMPLOYER")
    employer = db.execute(select(User).where(User.id == employer_id)).scalar_one_or_none()
    if not employer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employer not found")

    job = Job(
        employer_id=employer_id,
        title=payload.title,
        description=payload.description,
        requirements=_normalize_requirements(payload.requirements or {}),
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    return JobCreateResponse(
        job_id=job.id,
        title=job.title,
        description=job.description,
        requirements=job.requirements or {},
        created_at=job.created_at.isoformat() if job.created_at else "",
    )


@router.get("/employer/mine", response_model=list[JobListItem])
def list_employer_jobs(
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> list[JobListItem]:
    employer_id = _require_role(credentials, "EMPLOYER")
    counts = _application_counts(db)
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
            application_count=counts.get(job.id, 0),
            created_at=job.created_at.isoformat() if job.created_at else None,
        )
        for job in jobs
    ]


@router.get("/employer/applications", response_model=list[EmployerApplicationItem])
def list_employer_applications(
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> list[EmployerApplicationItem]:
    employer_id = _require_role(credentials, "EMPLOYER")
    rows = db.execute(
        select(Application, Job, User, Credential)
        .join(Job, Application.job_id == Job.id)
        .join(User, Application.candidate_id == User.id)
        .outerjoin(Credential, Application.credential_id == Credential.id)
        .where(Job.employer_id == employer_id)
        .order_by(Application.created_at.desc(), Application.id.desc())
    ).all()

    return [
        EmployerApplicationItem(
            application_id=application.id,
            job_id=job.id,
            job_title=job.title,
            candidate_id=application.candidate_id,
            candidate_email=candidate.email,
            credential_id=application.credential_id,
            credential_type=credential.claim_type if credential else None,
            verification_status=application.verification_status,
            created_at=application.created_at.isoformat() if application.created_at else None,
        )
        for application, job, candidate, credential in rows
    ]


@router.get("", response_model=list[JobListItem])
def list_jobs(db: Session = Depends(get_db)) -> list[JobListItem]:
    counts = _application_counts(db)
    jobs = db.execute(select(Job).order_by(Job.created_at.desc(), Job.id.desc())).scalars().all()
    return [
        JobListItem(
            id=job.id,
            title=job.title,
            description=job.description,
            requirements=job.requirements or {},
            application_count=counts.get(job.id, 0),
            created_at=job.created_at.isoformat() if job.created_at else None,
        )
        for job in jobs
    ]


@router.get("/{job_id}", response_model=JobGetResponse)
def get_job(job_id: int, db: Session = Depends(get_db)) -> JobGetResponse:
    job = db.execute(select(Job).where(Job.id == job_id)).scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    return JobGetResponse(
        job_id=job.id,
        title=job.title,
        description=job.description,
        requirements=job.requirements or {},
    )


@router.post("/{job_id}/apply", response_model=ApplicationCreateResponse)
def apply_to_job(
    job_id: int,
    payload: ApplicationCreateRequest,
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> ApplicationCreateResponse:
    candidate_id = _require_role(credentials, "CANDIDATE")
    job = db.execute(select(Job).where(Job.id == job_id)).scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    credential = (
        db.execute(
            select(Credential)
            .join(Resume, Credential.resume_id == Resume.id)
            .where(Credential.id == payload.credential_id, Resume.user_id == candidate_id)
        )
        .scalar_one_or_none()
    )
    if not credential:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Credential not found")

    existing = db.execute(
        select(Application).where(Application.job_id == job_id, Application.candidate_id == candidate_id)
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Already applied to this job")

    application = Application(
        job_id=job_id,
        candidate_id=candidate_id,
        credential_id=credential.id,
        proof_id=credential.proof_hash,
        verification_status="PENDING",
        ai_report=None,
    )
    db.add(application)
    db.commit()
    db.refresh(application)

    return ApplicationCreateResponse(
        application_id=application.id,
        job_id=application.job_id,
        verification_status=application.verification_status,
    )
