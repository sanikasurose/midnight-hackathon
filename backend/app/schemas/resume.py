from typing import List, Optional
from pydantic import BaseModel, Field


class ExperienceItem(BaseModel):
    company: str
    role: str
    duration: str
    description: Optional[str] = None


class ResumeClaims(BaseModel):
    name: str = "Candidate"
    degree: str = "Not detected"
    gpa: Optional[float] = None
    skills: List[str] = Field(default_factory=list)
    experience: List[ExperienceItem] = Field(default_factory=list)
    certifications: List[str] = Field(default_factory=list)


class ResumeCredential(BaseModel):
    id: int
    claim_type: str
    label: str
    verification_status: str


class ResumeUploadResponse(BaseModel):
    resume_id: int
    claims: ResumeClaims
    credentials: List[ResumeCredential] = []


class ResumeListItem(BaseModel):
    resume_id: int
    original_filename: Optional[str] = None
    created_at: str
    claims: ResumeClaims
    credentials: List[ResumeCredential] = []


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

