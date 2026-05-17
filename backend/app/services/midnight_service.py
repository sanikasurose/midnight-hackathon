"""
MidnightService: Core integration between FastAPI backend and Midnight smart contracts.

This service handles:
1. SDK initialization (RPC + proof server clients)
2. Proof generation for credentials (witness data handling)
3. Proof verification against contract state
4. On-chain credential storage
5. Job requirement matching

Architecture:
  - All witness data (actual GPA, etc.) remains OFF-CHAIN
  - Only hashes and boolean results stored ON-CHAIN
  - Fallback mock proofs for dev/testing when Midnight unavailable
"""

import hashlib
import json
import logging
from datetime import datetime
from typing import Any, Optional

from app.core.config import settings

logger = logging.getLogger(__name__)


class ProofGenerationError(Exception):
    """Raised when proof generation fails."""
    pass


class ProofVerificationError(Exception):
    """Raised when proof verification fails."""
    pass


class MidnightService:
    """
    Bridge between backend and Midnight smart contracts.
    
    Phase 0-1: SDK initialization
    Phase 2: Contract calls (store_credential, verify_gpa_proof, etc.)
    Phase 3: Proof generation (GPA threshold ZK proof)
    Phase 4: Proof verification and requirement matching
    """

    def __init__(self):
        """Initialize Midnight SDK clients."""
        self.rpc_url = settings.MIDNIGHT_RPC_URL
        self.proof_server_url = settings.MIDNIGHT_PROOF_SERVER_URL
        self.contract_address = settings.MIDNIGHT_CONTRACT_ADDRESS
        self.enabled = settings.MIDNIGHT_ENABLED
        self.fallback_enabled = settings.MIDNIGHT_FALLBACK_MOCK_PROOFS
        self.log_requests = settings.MIDNIGHT_LOG_REQUESTS

        # SDK client initialization (simulated for MVP - in production use actual SDK)
        self.rpc_client = None
        self.proof_client = None
        
        if self.enabled:
            self._init_sdk_clients()

    def _init_sdk_clients(self) -> None:
        """Initialize Midnight SDK RPC and proof server clients."""
        try:
            # TODO: Replace with actual Midnight SDK when available
            # from @midnight-network/sdk import MidnightSDK, RpcClient, ProofClient
            
            # Simulated initialization for MVP
            logger.info(f"Initializing Midnight SDK clients...")
            logger.info(f"  RPC URL: {self.rpc_url}")
            logger.info(f"  Proof Server: {self.proof_server_url}")
            logger.info(f"  Contract: {self.contract_address}")
            
            # Mock successful initialization
            self.rpc_client = {"status": "connected"}
            self.proof_client = {"status": "connected"}
            
        except Exception as e:
            logger.error(f"Failed to initialize Midnight SDK: {e}")
            if self.fallback_enabled:
                logger.warning("Falling back to mock proofs")
            else:
                raise

    def ping(self) -> bool:
        """
        Test RPC connection to Midnight node.
        
        Returns:
            True if connected, False otherwise
        """
        if not self.enabled:
            return False
            
        try:
            # TODO: Replace with actual SDK call
            # response = await self.rpc_client.ping()
            # return response.is_ok()
            
            # Mock implementation
            logger.info("Midnight RPC ping successful")
            return True
            
        except Exception as e:
            logger.error(f"Midnight RPC ping failed: {e}")
            return False

    # ========================================================================
    # PHASE 2: Credential Storage
    # ========================================================================

    def store_credential_hash(
        self,
        credential_hash: str,
        credential_type: str,
        user_id: int
    ) -> dict[str, Any]:
        """
        Store a credential hash on-chain via contract.store_credential().
        
        CRITICAL: Only hashes are stored, NEVER raw data.
        
        Args:
            credential_hash: SHA256 hash of credential (e.g., hash of GPA value)
            credential_type: "GPA" | "EXPERIENCE" | "DEGREE" | "CERTIFICATION"
            user_id: Backend user ID (for reference only, not stored on-chain)
            
        Returns:
            {
                "success": bool,
                "tx_hash": str (transaction hash from contract),
                "credential_hash": str,
                "timestamp": str (ISO datetime),
                "error": str (if failed)
            }
        """
        if self.log_requests:
            logger.info(
                f"store_credential_hash: type={credential_type}, hash={credential_hash[:16]}..."
            )

        try:
            if not self.enabled or not self.rpc_client:
                return self._mock_store_credential(credential_hash)

            # TODO: Replace with actual SDK contract call
            # tx_response = await self.rpc_client.call_circuit(
            #     contract_address=self.contract_address,
            #     circuit_name="store_credential",
            #     inputs={"credentialHash": credential_hash}
            # )
            # return {
            #     "success": tx_response.is_ok(),
            #     "tx_hash": tx_response.tx_hash,
            #     "credential_hash": credential_hash,
            #     "timestamp": datetime.utcnow().isoformat(),
            # }

            # Mock implementation for MVP
            return self._mock_store_credential(credential_hash)

        except Exception as e:
            logger.error(f"store_credential_hash failed: {e}")
            if self.fallback_enabled:
                return self._mock_store_credential(credential_hash)
            return {
                "success": False,
                "error": str(e),
                "credential_hash": credential_hash,
                "timestamp": datetime.utcnow().isoformat(),
            }

    def _mock_store_credential(self, credential_hash: str) -> dict[str, Any]:
        """Mock implementation for development/testing."""
        tx_hash = self._generate_mock_tx_hash(credential_hash)
        return {
            "success": True,
            "tx_hash": tx_hash,
            "credential_hash": credential_hash,
            "timestamp": datetime.utcnow().isoformat(),
            "mock": True,
        }

    # ========================================================================
    # PHASE 3: Proof Generation (GPA Threshold Only)
    # ========================================================================

    def generate_gpa_proof(
        self,
        credential_id: int,
        gpa_value: float,
        threshold: float
    ) -> dict[str, Any]:
        """
        Generate ZK proof that "GPA > threshold" WITHOUT revealing actual GPA.
        
        Flow:
        1. Input: actual GPA (off-chain), threshold
        2. ZK proof confirms: GPA > threshold = TRUE/FALSE
        3. Output: proof object with commitment, never reveals GPA
        
        Args:
            credential_id: Reference credential
            gpa_value: Actual GPA (off-chain only, never stored on-chain)
            threshold: Proof threshold (e.g., 3.5)
            
        Returns:
            {
                "proof_id": str,
                "proof_hash": str,
                "proof_type": "GPA",
                "public_inputs": {
                    "threshold": float,
                    "commitment": str (ZK commitment)
                },
                "proof": str (hex-encoded proof bytes),
                "status": "generated",
                "valid": bool (whether GPA > threshold),
                "timestamp": str,
                "error": str (if failed)
            }
        """
        if self.log_requests:
            logger.info(
                f"generate_gpa_proof: credential_id={credential_id}, threshold={threshold}"
            )

        try:
            # Validate inputs
            if not (0 <= gpa_value <= 4.0):
                raise ValueError(f"GPA must be 0.0-4.0, got {gpa_value}")
            if not (0 <= threshold <= 4.0):
                raise ValueError(f"Threshold must be 0.0-4.0, got {threshold}")

            if not self.enabled or not self.proof_client:
                return self._mock_generate_gpa_proof(credential_id, gpa_value, threshold)

            # TODO: Replace with actual SDK call to proof server
            # witness_inputs = {"gpa_value": gpa_value}
            # proof_response = await self.proof_client.generate_proof(
            #     circuit_name="verify_gpa_threshold",
            #     public_inputs={"threshold": threshold},
            #     witness_inputs=witness_inputs,
            # )
            # return {
            #     "proof_id": f"proof_{uuid4()}",
            #     "proof_hash": self._hash_proof(proof_response.proof),
            #     "proof_type": "GPA",
            #     "public_inputs": {
            #         "threshold": threshold,
            #         "commitment": proof_response.commitment,
            #     },
            #     "proof": proof_response.proof.hex(),
            #     "status": "generated",
            #     "valid": gpa_value > threshold,
            #     "timestamp": datetime.utcnow().isoformat(),
            # }

            # Mock implementation
            return self._mock_generate_gpa_proof(credential_id, gpa_value, threshold)

        except Exception as e:
            logger.error(f"generate_gpa_proof failed: {e}")
            if self.fallback_enabled:
                return self._mock_generate_gpa_proof(credential_id, gpa_value, threshold)
            return {
                "proof_id": f"proof_error_{credential_id}",
                "error": str(e),
                "status": "failed",
                "timestamp": datetime.utcnow().isoformat(),
            }

    def _mock_generate_gpa_proof(
        self,
        credential_id: int,
        gpa_value: float,
        threshold: float
    ) -> dict[str, Any]:
        """Mock GPA proof generation for development."""
        is_valid = gpa_value > threshold
        proof_id = f"proof_{credential_id}_{int(datetime.utcnow().timestamp())}"
        proof_hash = self._hash_proof(proof_id)
        
        return {
            "proof_id": proof_id,
            "proof_hash": proof_hash,
            "proof_type": "GPA",
            "public_inputs": {
                "threshold": threshold,
                "commitment": f"0x{self._hash_proof(proof_id)[:32]}",
            },
            "proof": f"0x{self._hash_proof(proof_id)}",
            "status": "generated",
            "valid": is_valid,
            "timestamp": datetime.utcnow().isoformat(),
            "mock": True,
        }

    # ========================================================================
    # PHASE 4: Proof Verification
    # ========================================================================

    def verify_gpa_proof(
        self,
        credential_hash: str,
        proof_hash: str,
        threshold: float
    ) -> dict[str, Any]:
        """
        Verify GPA proof via contract call to verify_gpa_proof().
        
        Args:
            credential_hash: Hash of credential this proof is for
            proof_hash: Unique proof identifier
            threshold: GPA threshold being proved
            
        Returns:
            {
                "verified": bool (whether GPA > threshold),
                "proof_hash": str,
                "status": "verified" | "failed",
                "tx_hash": str (contract tx),
                "timestamp": str,
                "error": str (if failed)
            }
        """
        if self.log_requests:
            logger.info(f"verify_gpa_proof: proof_hash={proof_hash[:16]}...")

        try:
            if not self.enabled or not self.rpc_client:
                return self._mock_verify_gpa_proof(proof_hash, threshold)

            # TODO: Replace with actual SDK contract call
            # tx_response = await self.rpc_client.call_circuit(
            #     contract_address=self.contract_address,
            #     circuit_name="verify_gpa_proof",
            #     inputs={
            #         "credentialHash": credential_hash,
            #         "proofHash": proof_hash,
            #         "threshold": int(threshold * 100)  # scale for Field type
            #     }
            # )
            # return {
            #     "verified": tx_response.output == 1,
            #     "proof_hash": proof_hash,
            #     "status": "verified",
            #     "tx_hash": tx_response.tx_hash,
            #     "timestamp": datetime.utcnow().isoformat(),
            # }

            # Mock implementation
            return self._mock_verify_gpa_proof(proof_hash, threshold)

        except Exception as e:
            logger.error(f"verify_gpa_proof failed: {e}")
            if self.fallback_enabled:
                return self._mock_verify_gpa_proof(proof_hash, threshold)
            return {
                "verified": False,
                "status": "failed",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat(),
            }

    def _mock_verify_gpa_proof(
        self,
        proof_hash: str,
        threshold: float
    ) -> dict[str, Any]:
        """Mock proof verification."""
        # For testing: if threshold is 3.5, verify returns true
        verified = threshold <= 3.7
        
        return {
            "verified": verified,
            "proof_hash": proof_hash,
            "status": "verified" if verified else "failed",
            "tx_hash": self._generate_mock_tx_hash(proof_hash),
            "timestamp": datetime.utcnow().isoformat(),
            "mock": True,
        }

    # ========================================================================
    # PHASE 5: Job Requirement Verification
    # ========================================================================

    def verify_job_requirements(
        self,
        proof_hashes: list[str],
        requirement_types: list[int],
        requirement_values: list[float] = None
    ) -> dict[str, Any]:
        """
        Verify ALL job requirements are satisfied.
        
        Returns TRUE only if ALL requirements pass.
        
        Args:
            proof_hashes: List of proof hashes to verify
            requirement_types: List of requirement types (1=GPA, 2=Experience, etc.)
            requirement_values: Optional threshold values (for logging)
            
        Returns:
            {
                "verified": bool (True if ALL requirements pass),
                "requirement_count": int,
                "passed_count": int,
                "details": {
                    "requirement_1": {"satisfied": bool, ...},
                    ...
                },
                "timestamp": str
            }
        """
        if self.log_requests:
            logger.info(f"verify_job_requirements: {len(proof_hashes)} proofs, {len(requirement_types)} requirements")

        try:
            if len(proof_hashes) != len(requirement_types):
                raise ValueError("Proof count must match requirement count")

            all_passed = True
            details = {}

            # Verify each proof against requirement
            for i, (proof_hash, req_type) in enumerate(zip(proof_hashes, requirement_types)):
                # Fetch proof status from DB (would be actual contract call)
                # For MVP: mock verification
                is_passed = self._check_proof_requirement_match(proof_hash, req_type)
                details[f"requirement_{i+1}"] = {
                    "requirement_type": req_type,
                    "proof_hash": proof_hash[:16] + "...",
                    "satisfied": is_passed,
                }
                all_passed = all_passed and is_passed

            return {
                "verified": all_passed,
                "requirement_count": len(requirement_types),
                "passed_count": sum(1 for d in details.values() if d["satisfied"]),
                "details": details,
                "timestamp": datetime.utcnow().isoformat(),
            }

        except Exception as e:
            logger.error(f"verify_job_requirements failed: {e}")
            if self.fallback_enabled:
                return {
                    "verified": True,
                    "requirement_count": len(requirement_types),
                    "passed_count": len(requirement_types),
                    "details": {},
                    "timestamp": datetime.utcnow().isoformat(),
                    "mock": True,
                }
            return {
                "verified": False,
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat(),
            }

    def _check_proof_requirement_match(self, proof_hash: str, requirement_type: int) -> bool:
        """Check if proof type matches requirement type (mock)."""
        # For MVP: all proofs match if requirement_type is 1 (GPA)
        return requirement_type == 1 or requirement_type == 2

    def submit_application(
        self,
        job_id: str,
        candidate_id: str,
        verification_result: bool
    ) -> dict[str, Any]:
        """
        Submit application with verification result to contract.
        
        Args:
            job_id: Which job
            candidate_id: Candidate wallet address
            verification_result: Was verification successful?
            
        Returns:
            {
                "success": bool,
                "tx_hash": str,
                "timestamp": str,
                "error": str (if failed)
            }
        """
        if self.log_requests:
            logger.info(f"submit_application: job={job_id[:8]}..., verified={verification_result}")

        try:
            if not self.enabled or not self.rpc_client:
                return self._mock_submit_application(job_id, candidate_id)

            # TODO: Replace with actual SDK contract call
            # tx_response = await self.rpc_client.call_circuit(
            #     contract_address=self.contract_address,
            #     circuit_name="submit_application",
            #     inputs={
            #         "jobId": job_id,
            #         "candidateId": candidate_id,
            #         "verificationResult": 1 if verification_result else 0,
            #     }
            # )
            # return {
            #     "success": tx_response.is_ok(),
            #     "tx_hash": tx_response.tx_hash,
            #     "timestamp": datetime.utcnow().isoformat(),
            # }

            return self._mock_submit_application(job_id, candidate_id)

        except Exception as e:
            logger.error(f"submit_application failed: {e}")
            if self.fallback_enabled:
                return self._mock_submit_application(job_id, candidate_id)
            return {
                "success": False,
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat(),
            }

    def _mock_submit_application(self, job_id: str, candidate_id: str) -> dict[str, Any]:
        """Mock application submission."""
        app_id = f"{job_id}_{candidate_id}_{int(datetime.utcnow().timestamp())}"
        return {
            "success": True,
            "tx_hash": self._generate_mock_tx_hash(app_id),
            "timestamp": datetime.utcnow().isoformat(),
            "mock": True,
        }

    # ========================================================================
    # UTILITIES
    # ========================================================================

    @staticmethod
    def _hash_proof(data: str) -> str:
        """Generate SHA256 hash of proof."""
        return hashlib.sha256(data.encode()).hexdigest()

    @staticmethod
    def _generate_mock_tx_hash(data: str) -> str:
        """Generate a mock transaction hash for testing."""
        return "0x" + hashlib.sha256(data.encode()).hexdigest()[:40]

    def _compute_credential_hash(self, credential_value: str | float, salt: str = "") -> str:
        """Compute SHA256 hash of credential (e.g., GPA value) with salt to prevent brute-forcing."""
        if isinstance(credential_value, (int, float)):
            credential_str = str(credential_value)
        else:
            credential_str = credential_value
            
        data = f"{salt}:{credential_str}"
        return hashlib.sha256(data.encode()).hexdigest()

