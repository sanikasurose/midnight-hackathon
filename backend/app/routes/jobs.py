from fastapi import APIRouter

from app.schemas.jobs import (
    JobApplyRequest,
    JobApplyResponse,
    JobCreateRequest,
    JobCreateResponse,
    JobGetResponse,
)

router = APIRouter()


@router.post("", response_model=JobCreateResponse)
def create_job(payload: JobCreateRequest) -> JobCreateResponse:
    # TODO: persist job posting (employer_id comes from auth later)
    return JobCreateResponse(job_id=0)


@router.get("/{job_id}", response_model=JobGetResponse)
def get_job(job_id: int) -> JobGetResponse:
    # TODO: fetch job
    return JobGetResponse(job_id=job_id, title="TODO", description="TODO", requirements={})


@router.post("/{job_id}/apply", response_model=JobApplyResponse)
def apply_to_job(job_id: int, payload: JobApplyRequest) -> JobApplyResponse:
    # TODO: create application + kick off verification
    return JobApplyResponse(application_id=0, status="PENDING")

