from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field


class JobRequirement(BaseModel):
    type: str = Field(..., description="GPA | EXPERIENCE | DEGREE | CERTIFICATION")
    operator: str = Field(..., description="> | >= | == | < | <=")
    value: float = Field(..., description="Threshold value")


class JobCreateRequest(BaseModel):
    title: str = Field(..., description="Job title")
    description: str = Field(..., description="Job description")
    requirements: list[JobRequirement] | dict[str, Any] = Field(
        ..., description="Job requirements"
    )


class JobCreateResponse(BaseModel):
    job_id: int
    title: str
    description: str
    requirements: list[JobRequirement] | dict[str, Any]
    created_at: str


class JobGetResponse(BaseModel):
    job_id: int
    title: str
    description: str
    requirements: list[JobRequirement] | dict[str, Any]


class JobApplyRequest(BaseModel):
    candidate_id: str = Field(..., description="Candidate wallet address or ID")
    proof_ids: list[str] = Field(..., description="List of proof IDs to verify")


class JobApplyResponse(BaseModel):
    application_id: str = Field(..., description="Unique application ID")
    job_id: int
    candidate_id: str
    verified: bool = Field(..., description="Was verification successful?")
    status: str = Field(..., description="VERIFIED | FAILED | PENDING")
    details: Optional[dict[str, Any]] = Field(None, description="Verification details")
    timestamp: str = Field(..., description="ISO datetime")

