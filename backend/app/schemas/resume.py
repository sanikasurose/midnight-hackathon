from typing import List, Optional
from pydantic import BaseModel, Field


class ExperienceItem(BaseModel):
    company: str
    role: str
    duration: str
    description: Optional[str] = None


class ResumeClaims(BaseModel):
    name: str
    degree: str
    gpa: Optional[float] = None
    skills: List[str]
    experience: List[ExperienceItem]
    certifications: List[str]


class ResumeUploadResponse(BaseModel):
    resume_id: int
    claims: ResumeClaims


class ResumeClaimsResponse(BaseModel):
    resume_id: int
    claims: ResumeClaims

