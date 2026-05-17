"""
Proof endpoints: /proof/generate, /proof/verify, /proof/status

These endpoints expose Midnight smart contract functionality via REST API.
No raw data is ever exposed - only hashes and boolean verification results.
"""

import logging
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import Credential, Proof
from app.schemas.proof import (
    ProofGenerateRequest,
    ProofGenerateResponse,
    ProofStatusResponse,
    ProofVerifyRequest,
    ProofVerifyResponse,
)
from app.services.midnight_service import MidnightService

router = APIRouter()
logger = logging.getLogger(__name__)

# Global service instance
midnight_service = MidnightService()


@router.post("/generate", response_model=ProofGenerateResponse)
def generate_proof(
    payload: ProofGenerateRequest,
    db: Session = Depends(get_db),
) -> ProofGenerateResponse:
    """
    Generate ZK proof for credential claim.
    
    MVP Scope: Only supports GPA > threshold proofs.
    
    Flow:
    1. Fetch credential from DB
    2. Call Midnight service to generate ZK proof
    3. Store proof in DB
    4. Return proof object (never contains raw data)
    
    Args:
        payload: {
            "credential_id": "cred_123",
            "threshold": 3.5,
            "gpa_value": 3.72 (off-chain only),
            "proof_type": "GPA"
        }
    
    Returns:
        {
            "proof_id": "proof_123",
            "proof_hash": "0xABC...",
            "proof_type": "GPA",
            "public_inputs": { "threshold": 3.5, "commitment": "0x..." },
            "status": "generated"
        }
    """
    try:
        logger.info(f"POST /proof/generate: credential_id={payload.credential_id}, threshold={payload.threshold}")

        # Fetch credential from DB
        credential = db.query(Credential).filter(
            Credential.id == int(payload.credential_id)
        ).first()
        
        if not credential:
            raise HTTPException(
                status_code=404,
                detail=f"Credential {payload.credential_id} not found"
            )

        # Generate ZK proof via Midnight service
        proof_result = midnight_service.generate_gpa_proof(
            credential_id=int(payload.credential_id),
            gpa_value=payload.gpa_value or 3.7,  # Default for MVP testing
            threshold=payload.threshold
        )

        if "error" in proof_result:
            logger.error(f"Proof generation failed: {proof_result['error']}")
            raise HTTPException(
                status_code=500,
                detail=f"Proof generation failed: {proof_result['error']}"
            )

        # Store proof in DB
        proof = Proof(
            credential_id=int(payload.credential_id),
            proof_type=payload.proof_type,
            proof_hash=proof_result.get("proof_hash", ""),
            public_inputs=proof_result.get("public_inputs", {}),
            proof_data=proof_result.get("proof"),
            verification_status="generated",
            verified=False,
        )
        db.add(proof)
        db.commit()
        db.refresh(proof)

        # Update credential record
        credential.proof_hash = proof_result.get("proof_hash")
        credential.credential_hash = midnight_service._compute_credential_hash(
            payload.gpa_value or 3.7, 
            salt=f"cred_{credential.id}"
        )
        db.commit()

        return ProofGenerateResponse(
            proof_id=proof_result.get("proof_id", f"proof_{proof.id}"),
            proof_hash=proof_result.get("proof_hash", ""),
            proof_type=payload.proof_type,
            credential_hash=credential.credential_hash,
            public_inputs=proof_result.get("public_inputs", {}),
            proof=proof_result.get("proof"),
            status="generated",
            timestamp=datetime.utcnow().isoformat(),
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error in /proof/generate: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/verify", response_model=ProofVerifyResponse)
def verify_proof(
    payload: ProofVerifyRequest,
    db: Session = Depends(get_db),
) -> ProofVerifyResponse:
    """
    Verify a ZK proof via Midnight contract.
    
    Flow:
    1. Fetch proof from DB
    2. Call contract to verify proof
    3. Update proof status in DB
    4. Return boolean result (verified: true/false)
    
    Args:
        payload: {
            "proof_id": "proof_123",
            "requirements": {
                "GPA": { "operator": ">", "value": 3.5 }
            }
        }
    
    Returns:
        {
            "verified": true/false,
            "proof_id": "proof_123",
            "status": "verified" or "failed"
        }
    """
    try:
        logger.info(f"POST /proof/verify: proof_id={payload.proof_id}")

        # Fetch proof from DB
        proof = db.query(Proof).filter(Proof.proof_hash == payload.proof_id).first()
        
        if not proof:
            # Try by proof_id (backward compat)
            proof = db.query(Proof).filter(Proof.id == int(payload.proof_id)).first()
        
        if not proof:
            raise HTTPException(
                status_code=404,
                detail=f"Proof {payload.proof_id} not found"
            )

        # Get credential for context
        credential = db.query(Credential).filter(
            Credential.id == proof.credential_id
        ).first()

        # Verify proof via Midnight service
        threshold = proof.public_inputs.get("threshold", 3.5) if proof.public_inputs else 3.5
        verify_result = midnight_service.verify_gpa_proof(
            credential_hash=credential.credential_hash or "",
            proof_hash=proof.proof_hash,
            threshold=threshold
        )

        # Update proof status in DB
        proof.verified = verify_result.get("verified", False)
        proof.verification_status = verify_result.get("status", "failed")
        proof.midnight_tx_id = verify_result.get("tx_hash")
        db.commit()

        return ProofVerifyResponse(
            verified=proof.verified,
            proof_id=payload.proof_id,
            proof_hash=proof.proof_hash,
            status=proof.verification_status,
            timestamp=datetime.utcnow().isoformat(),
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error in /proof/verify: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status/{proof_id}", response_model=ProofStatusResponse)
def get_proof_status(
    proof_id: str,
    db: Session = Depends(get_db),
) -> ProofStatusResponse:
    """
    Get proof status without verifying.
    
    Args:
        proof_id: Proof identifier or proof_hash
    
    Returns:
        {
            "proof_id": "proof_123",
            "status": "generated" | "verified" | "failed",
            "verified": true/false,
            "timestamp": "2024-..."
        }
    """
    try:
        logger.info(f"GET /proof/status/{proof_id}")

        # Try by proof_hash first
        proof = db.query(Proof).filter(Proof.proof_hash == proof_id).first()
        
        # Try by ID if not found
        if not proof:
            try:
                proof = db.query(Proof).filter(Proof.id == int(proof_id)).first()
            except ValueError:
                pass
        
        if not proof:
            raise HTTPException(
                status_code=404,
                detail=f"Proof {proof_id} not found"
            )

        return ProofStatusResponse(
            proof_id=proof_id,
            proof_hash=proof.proof_hash,
            proof_type=proof.proof_type,
            status=proof.verification_status,
            verified=proof.verified,
            timestamp=proof.created_at.isoformat() if proof.created_at else datetime.utcnow().isoformat(),
            contract_status={
                "stored_on_chain": bool(proof.midnight_tx_id),
                "transaction_hash": proof.midnight_tx_id,
            } if proof.midnight_tx_id else None,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error in /proof/status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

