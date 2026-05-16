from fastapi import APIRouter

from app.schemas.proof import (
    ProofGenerateRequest,
    ProofGenerateResponse,
    ProofVerifyRequest,
    ProofVerifyResponse,
)

router = APIRouter()


@router.post("/generate", response_model=ProofGenerateResponse)
def generate_proof(payload: ProofGenerateRequest) -> ProofGenerateResponse:
    # TODO: call midnight_service to generate proof for claim_type
    return ProofGenerateResponse(proof_id="TODO", tx_hash="TODO")


@router.post("/verify", response_model=ProofVerifyResponse)
def verify_proof(payload: ProofVerifyRequest) -> ProofVerifyResponse:
    # TODO: call midnight_service to verify against requirements
    return ProofVerifyResponse(verified=False, details={})

