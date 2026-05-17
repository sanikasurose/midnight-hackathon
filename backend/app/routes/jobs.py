"""
Job routes: create jobs, view jobs, apply with proof verification.

/jobs (POST) - Create job with requirements
/jobs/{job_id} (GET) - Get job details
/jobs/{job_id}/apply (POST) - Apply with proof verification
"""

import logging
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import Job
from app.schemas.jobs import (
    JobApplyRequest,
    JobApplyResponse,
    JobCreateRequest,
    JobCreateResponse,
    JobGetResponse,
)
from app.services.verification_service import VerificationService

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("", response_model=JobCreateResponse)
def create_job(
    payload: JobCreateRequest,
    db: Session = Depends(get_db),
) -> JobCreateResponse:
    """
    Create a new job posting with requirements.
    
    Args:
        payload: {
            "title": "Senior Engineer",
            "description": "...",
            "requirements": [
                {"type": "GPA", "operator": ">", "value": 3.5},
                {"type": "EXPERIENCE", "operator": ">=", "value": 2}
            ]
        }
    
    Returns:
        {
            "job_id": 123,
            "title": "Senior Engineer",
            "requirements": [...]
        }
    """
    try:
        logger.info(f"Creating job: {payload.title}")

        # Convert list to dict for storage (backward compat)
        requirements = payload.requirements
        if isinstance(requirements, list):
            requirements_dict = {}
            for req in requirements:
                requirements_dict[req.type] = {
                    "operator": req.operator,
                    "value": req.value,
                }
            requirements = requirements_dict

        # Create job
        job = Job(
            title=payload.title,
            description=payload.description,
            requirements=requirements,
        )
        db.add(job)
        db.commit()
        db.refresh(job)

        logger.info(f"Created job {job.id}")

        return JobCreateResponse(
            job_id=job.id,
            title=job.title,
            description=job.description,
            requirements=job.requirements or {},
            created_at=job.created_at.isoformat() if job.created_at else datetime.utcnow().isoformat(),
        )

    except Exception as e:
        logger.exception(f"Error creating job: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{job_id}", response_model=JobGetResponse)
def get_job(
    job_id: int,
    db: Session = Depends(get_db),
) -> JobGetResponse:
    """
    Get job details.
    
    Args:
        job_id: Job ID
    
    Returns:
        {
            "job_id": 123,
            "title": "...",
            "description": "...",
            "requirements": {...}
        }
    """
    try:
        job = db.query(Job).filter(Job.id == job_id).first()
        
        if not job:
            raise HTTPException(status_code=404, detail=f"Job {job_id} not found")

        return JobGetResponse(
            job_id=job.id,
            title=job.title,
            description=job.description,
            requirements=job.requirements or {},
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error getting job: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{job_id}/apply", response_model=JobApplyResponse)
def apply_to_job(
    job_id: int,
    payload: JobApplyRequest,
    db: Session = Depends(get_db),
) -> JobApplyResponse:
    """
    Apply to a job with ZK proof verification.
    
    This is the CRITICAL endpoint: candidate submits proofs, employer sees
    VERIFIED or NOT VERIFIED (without ever seeing actual data).
    
    Flow:
    1. Candidate provides proof IDs
    2. Backend verifies proofs against job requirements
    3. Employer sees result (verified: true/false)
    4. Application recorded on-chain (no personal data)
    
    Args:
        job_id: Which job
        payload: {
            "candidate_id": "0x...",
            "proof_ids": ["proof_123", "proof_456"]
        }
    
    Returns:
        {
            "application_id": "app_123",
            "verified": true/false,
            "status": "VERIFIED" | "FAILED",
            "details": {
                "requirements_count": 2,
                "proofs_provided": 2,
                "all_satisfied": true,
                "requirement_status": [
                    {"requirement_type": "GPA", "satisfied": true},
                    {"requirement_type": "EXPERIENCE", "satisfied": true}
                ]
            }
        }
    """
    try:
        logger.info(
            f"POST /jobs/{job_id}/apply: candidate={payload.candidate_id}, "
            f"proofs={len(payload.proof_ids)}"
        )

        # Verify application via VerificationService
        result = VerificationService.verify_application(
            job_id=str(job_id),
            candidate_id=payload.candidate_id,
            proof_ids=payload.proof_ids,
            db=db,
        )

        if "error" in result:
            raise HTTPException(
                status_code=400,
                detail=result.get("error", "Verification failed")
            )

        return JobApplyResponse(
            application_id=result.get("application_id", f"app_{job_id}_{payload.candidate_id}"),
            job_id=job_id,
            candidate_id=payload.candidate_id,
            verified=result.get("verified", False),
            status="VERIFIED" if result.get("verified") else "FAILED",
            details=result.get("details", {}),
            timestamp=result.get("timestamp", datetime.utcnow().isoformat()),
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error applying to job: {e}")
        raise HTTPException(status_code=500, detail=str(e))

