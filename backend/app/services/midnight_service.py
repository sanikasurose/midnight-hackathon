class MidnightService:
    """
    Placeholder service for Midnight devnet integration.
    Phase 0: only structure (no proof generation / no on-chain calls).
    """

    def __init__(self, rpc_url: str, contract_address: str) -> None:
        self.rpc_url = rpc_url
        self.contract_address = contract_address

    def generate_proof(self, resume_id: int, claim_type: str) -> dict:
        # TODO: call Midnight SDK/contract to store shielded credential + produce proof
        raise NotImplementedError

    def verify_proof(self, proof_id: str, requirements: dict) -> dict:
        # TODO: verify proof against requirements via contract call
        raise NotImplementedError

