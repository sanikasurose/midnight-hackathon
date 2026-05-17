from typing import Any

from pydantic import BaseModel, Field


class JobRequirement(BaseModel):
    type: str = Field(..., description="GPA | EXPERIENCE | DEGREE | CERTIFICATION")
    operator: str = Field(..., description="> | >= | == | < | <=")
    value: float = Field(..., description="Threshold value")


class JobCreateRequest(BaseModel):
    title: str = Field(min_length=3)
    description: str = Field(min_length=10)
    # Hackathon-flexible: accept dict (frontend-friendly) or list (proof-service-friendly).
    requirements: dict[str, Any] | list[JobRequirement]


class JobCreateResponse(BaseModel):
    job_id: int
    title: str


class JobListItem(BaseModel):
    id: int
    title: str
    requirements: dict


class JobGetResponse(BaseModel):
    id: int
    title: str
    description: str
    requirements: dict

