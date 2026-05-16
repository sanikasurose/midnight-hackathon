from pydantic import BaseModel


class ResumeUploadResponse(BaseModel):
    resume_id: int
    claims: dict


class ResumeClaimsResponse(BaseModel):
    resume_id: int
    claims: dict

