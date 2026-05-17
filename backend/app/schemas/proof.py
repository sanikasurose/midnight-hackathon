from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field


class ProofGenerateRequest(BaseModel):
    credential_id: str = Field(..., description="Which credential to prove")
    threshold: float = Field(..., description="Proof threshold (e.g., 3.5 for GPA > 3.5)")
    gpa_value: Optional[float] = Field(
        None, description="Actual GPA (off-chain only, never stored on-chain)"
    )
    proof_type: str = Field(default="GPA", description="Type of proof: GPA, EXPERIENCE, DEGREE, CERTIFICATION")


class ProofGenerateResponse(BaseModel):
    proof_id: str = Field(..., description="Unique proof identifier")
    proof_hash: str = Field(..., description="SHA256 hash of proof")
    proof_type: str = Field(..., description="Type of proof generated")
    credential_hash: Optional[str] = Field(None, description="Which credential this proof is for")
    public_inputs: dict[str, Any] = Field(..., description="Public inputs (threshold, commitment, etc.)")
    proof: Optional[str] = Field(None, description="Actual proof bytes (hex-encoded)")
    status: str = Field(..., description="generated | verified | failed")
    timestamp: str = Field(..., description="ISO datetime")
    error: Optional[str] = Field(None, description="Error message if failed")


class ProofVerifyRequest(BaseModel):
    proof_id: str = Field(..., description="Which proof to verify")
    requirements: Optional[dict[str, Any]] = Field(
        None, description="Optional: verify against requirements"
    )


class ProofVerifyResponse(BaseModel):
    verified: bool = Field(..., description="TRUE if proof is valid")
    proof_id: str = Field(..., description="Which proof was verified")
    proof_hash: Optional[str] = Field(None)
    status: str = Field(..., description="verified | failed | pending")
    timestamp: str = Field(..., description="ISO datetime")
    details: Optional[dict[str, Any]] = Field(None, description="Additional verification details")
    error: Optional[str] = Field(None, description="Error message if failed")


class ProofStatusResponse(BaseModel):
    proof_id: str = Field(..., description="Unique proof identifier")
    proof_hash: Optional[str] = Field(None, description="SHA256 hash of proof")
    proof_type: Optional[str] = Field(None, description="Type of proof: GPA, EXPERIENCE, etc.")
    status: str = Field(..., description="generated | verified | failed | pending")
    verified: Optional[bool] = Field(None, description="Is proof verified?")
    timestamp: str = Field(..., description="ISO datetime")
    contract_status: Optional[dict[str, Any]] = Field(
        None, description="On-chain status (tx_hash, block, etc.)"
    )

