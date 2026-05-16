from pydantic import BaseModel


class JobCreateRequest(BaseModel):
    title: str
    description: str
    requirements: dict


class JobCreateResponse(BaseModel):
    job_id: int


class JobGetResponse(BaseModel):
    job_id: int
    title: str
    description: str
    requirements: dict


class JobApplyRequest(BaseModel):
    candidate_id: int
    proof_id: str


class JobApplyResponse(BaseModel):
    application_id: int
    status: str

