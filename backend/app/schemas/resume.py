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


class FraudFlag(BaseModel):
    type: str = Field(..., description="Flag type: timeline_gap, inflated_claim, inconsistent_date, suspicious_wording")
    severity: str = Field(..., description="Severity level: low, medium, high")
    description: str = Field(..., description="Detailed description of the flagged issue")


class FraudAnalysis(BaseModel):
    fraud_score: int = Field(..., description="Fraud score from 0 (trustworthy) to 100 (suspicious)")
    flags: List[FraudFlag] = Field(default_factory=list, description="List of flags identified")

