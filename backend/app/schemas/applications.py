from pydantic import BaseModel


class ApplicationCreateRequest(BaseModel):
    credential_id: int


class ApplicationCreateResponse(BaseModel):
    application_id: int
    job_id: int
    verification_status: str
