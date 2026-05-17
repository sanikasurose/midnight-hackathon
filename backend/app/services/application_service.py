from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.models.application import Application
from app.models.credential import Credential
from app.models.job import Job


def create_application(
    db: Session,
    *,
    job_id: int,
    candidate_id: int,
    credential_id: int,
) -> Application:
    job = db.execute(select(Job).where(Job.id == job_id)).scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    credential = db.execute(select(Credential).where(Credential.id == credential_id)).scalar_one_or_none()
    if not credential:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Credential not found")

    existing = db.execute(
        select(Application).where(Application.job_id == job_id, Application.candidate_id == candidate_id)
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Already applied to this job",
        )

    application = Application(
        job_id=job_id,
        candidate_id=candidate_id,
        credential_id=credential_id,
        verification_status="PENDING",
        ai_report=None,
    )
    try:
        db.add(application)
        db.commit()
        db.refresh(application)
        return application
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Already applied to this job",
        ) from e
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create application",
        ) from e
