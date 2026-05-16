from pydantic import BaseModel


class ProofGenerateRequest(BaseModel):
    resume_id: int
    claim_type: str


class ProofGenerateResponse(BaseModel):
    proof_id: str
    tx_hash: str


class ProofVerifyRequest(BaseModel):
    proof_id: str
    requirements: dict


class ProofVerifyResponse(BaseModel):
    verified: bool
    details: dict

