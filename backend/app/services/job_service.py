from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.job import Job


def create_job(
    db: Session,
    *,
    employer_id: int,
    title: str,
    description: str,
    requirements: dict,
) -> Job:
    try:
        job = Job(
            employer_id=employer_id,
            title=title,
            description=description,
            requirements=requirements,
        )
        db.add(job)
        db.commit()
        db.refresh(job)
        return job
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create job",
        ) from e


def get_job(db: Session, *, job_id: int) -> Job:
    job = db.execute(select(Job).where(Job.id == job_id)).scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    return job


def list_jobs(db: Session) -> list[Job]:
    return list(db.execute(select(Job).order_by(Job.created_at.desc())).scalars().all())
