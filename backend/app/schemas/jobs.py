from typing import Any

from pydantic import BaseModel, Field


class JobCreateRequest(BaseModel):
    title: str = Field(min_length=3)
    description: str = Field(min_length=10)
    requirements: dict[str, Any]


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
