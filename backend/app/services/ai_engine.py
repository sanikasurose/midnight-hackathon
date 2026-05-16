class AIEngine:
    """
    Placeholder service for Claude API integration.
    Phase 0: only structure (no prompts / no API calls).
    """

    def __init__(self, anthropic_api_key: str) -> None:
        self.anthropic_api_key = anthropic_api_key

    def parse_resume(self, raw_text: str) -> dict:
        # TODO: call Claude with résumé parsing prompt; return structured claims JSON
        # Hackathon placeholder: return empty claims when not implemented.
        raise NotImplementedError

    def trust_report(self, resume_claims: dict, job_requirements: dict) -> dict:
        # TODO: call Claude fraud/trust prompt; return structured report JSON
        raise NotImplementedError
