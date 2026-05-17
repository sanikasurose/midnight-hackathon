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


class MatchedRequirement(BaseModel):
    requirement: str = Field(..., description="Human-readable requirement description")
    candidate_evidence: str = Field(..., description="What the candidate has that satisfies this requirement")


class UnmatchedRequirement(BaseModel):
    requirement: str = Field(..., description="Human-readable requirement description")
    candidate_evidence: str = Field(..., description="What the candidate has (or lacks) relevant to this requirement")
    gap_severity: str = Field(..., description="Severity of the gap: minor, moderate, critical")


class JobMatchAnalysis(BaseModel):
    match_score: int = Field(..., ge=0, le=100, description="Overall match score from 0 to 100")
    matched_requirements: List[MatchedRequirement] = Field(default_factory=list, description="Requirements the candidate satisfies")
    unmatched_requirements: List[UnmatchedRequirement] = Field(default_factory=list, description="Requirements the candidate does not satisfy")
    recommendation: str = Field(..., description="Hiring recommendation based on match score")

