from typing import Any, Optional

from pydantic import BaseModel, Field


class JobRequirement(BaseModel):
    type: str = Field(..., description="GPA | EXPERIENCE | DEGREE | CERTIFICATION")
    operator: str = Field(..., description="> | >= | == | < | <=")
    value: float = Field(..., description="Threshold value")


class JobCreateRequest(BaseModel):
    title: str = Field(..., min_length=3, description="Job title")
    description: str = Field(..., min_length=10, description="Job description")
    requirements: list[JobRequirement] | dict[str, Any] = Field(..., description="Job requirements")


class JobCreateResponse(BaseModel):
    job_id: int
    title: str
    description: str
    requirements: list[JobRequirement] | dict[str, Any]
    created_at: str


class JobListItem(BaseModel):
    id: int
    title: str
    requirements: dict[str, Any]
    description: str | None = None
    application_count: int = 0
    created_at: str | None = None


class JobGetResponse(BaseModel):
    job_id: int
    title: str
    description: str
    requirements: list[JobRequirement] | dict[str, Any]


class EmployerApplicationItem(BaseModel):
    application_id: int
    job_id: int
    job_title: str
    candidate_id: int
    candidate_email: str | None = None
    credential_id: int | None = None
    credential_type: str | None = None
    verification_status: str
    created_at: str | None = None


class JobApplyRequest(BaseModel):
    candidate_id: str = Field(..., description="Legacy candidate wallet address or ID")
    proof_ids: list[str] = Field(..., description="Legacy proof IDs to verify")


class JobApplyResponse(BaseModel):
    application_id: str = Field(..., description="Unique application ID")
    job_id: int
    candidate_id: str
    verified: bool = Field(..., description="Was verification successful?")
    status: str = Field(..., description="VERIFIED | FAILED | PENDING")
    details: Optional[dict[str, Any]] = Field(None, description="Verification details")
    timestamp: str = Field(..., description="ISO datetime")
