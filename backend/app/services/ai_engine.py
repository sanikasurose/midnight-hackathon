import io
import json
import google.generativeai as genai
from PyPDF2 import PdfReader
from app.prompts import RESUME_PARSE_PROMPT, FRAUD_TRUST_PROMPT, JOB_MATCH_PROMPT
from app.schemas.resume import ResumeClaims, FraudAnalysis, JobMatchAnalysis


class AIEngine:
    """
    AI Service for résumé extraction and trust reports using Gemini.
    """

    def __init__(self, gemini_api_key: str) -> None:
        genai.configure(api_key=gemini_api_key)
        self.model = genai.GenerativeModel(
            model_name="gemini-2.5-flash",
            generation_config={"response_mime_type": "application/json"}
        )

    @staticmethod
    def _clean_json_text(text: str) -> str:
        text = text.strip()
        if text.startswith("```"):
            lines = text.splitlines()
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines[-1].startswith("```"):
                lines = lines[:-1]
            text = "\n".join(lines).strip()
        return text

    def _extract_text_from_pdf(self, pdf_bytes: bytes) -> str:
        pdf_file = io.BytesIO(pdf_bytes)
        reader = PdfReader(pdf_file)
        text = ""
        for page in reader.pages:
            text += page.extract_text() or ""
        return text

    def parse_resume(self, raw_text: str) -> dict:
        """
        Parses a PDF résumé text and returns structured claims using Gemini.
        """
        prompt = f"""
        {RESUME_PARSE_PROMPT}
        
        Résumé Text:
        {raw_text}
        """
        
        response = self.model.generate_content(prompt)
        
        try:
            cleaned_text = self._clean_json_text(response.text)
            parsed_json = json.loads(cleaned_text)
        except (json.JSONDecodeError, AttributeError) as e:
            raise ValueError(f"Failed to parse Gemini response as JSON: {e}") from e

        try:
            # Validate that all required fields are present and correctly typed using Pydantic
            validated_claims = ResumeClaims.model_validate(parsed_json)
            return validated_claims.model_dump()
        except Exception as e:
            raise ValueError(f"Gemini response failed schema validation: {e}") from e

    def trust_report(self, resume_claims: dict, job_requirements: dict, raw_text: str = None) -> dict:
        """
        Analyzes structured résumé claims and optionally raw text/job requirements for anomalies:
        - Timeline gaps
        - Inflated claims
        - Inconsistent dates
        - Suspicious wording
        
        Returns validated structured JSON: { "fraud_score": 0-100, "flags": [...] }
        """
        from datetime import datetime
        current_date_str = datetime.utcnow().strftime("%B %Y")
        
        prompt = f"""
        {FRAUD_TRUST_PROMPT}
        
        Current Evaluation Date: {current_date_str}
        
        Structured Resume Claims:
        {json.dumps(resume_claims, indent=2)}
        
        Job Requirements (optional):
        {json.dumps(job_requirements, indent=2) if job_requirements else "None"}
        
        Raw Resume Text (optional):
        {raw_text if raw_text else "None"}
        """
        
        response = self.model.generate_content(prompt)
        
        try:
            cleaned_text = self._clean_json_text(response.text)
            parsed_json = json.loads(cleaned_text)
        except (json.JSONDecodeError, AttributeError) as e:
            raise ValueError(f"Failed to parse Gemini response as JSON: {e}") from e

        try:
            # Validate response using FraudAnalysis schema for a guaranteed stable structure
            validated_report = FraudAnalysis.model_validate(parsed_json)
            return validated_report.model_dump()
        except Exception as e:
            raise ValueError(f"Gemini trust report failed schema validation: {e}") from e

    def job_match(self, candidate_claims: dict, job_requirements: list[dict]) -> dict:
        """
        Analyzes candidate resume claims against job requirements and returns
        a comprehensive match analysis for employer hiring decisions.

        Args:
            candidate_claims: Structured resume data (name, degree, gpa, skills, experience, certifications).
            job_requirements: List of requirement dicts, each with "type", "operator", "value"
                              (e.g., [{"type": "GPA", "operator": ">=", "value": 3.5}, ...]).

        Returns:
            Validated dict: { "match_score": 0-100, "matched_requirements": [...],
                              "unmatched_requirements": [...], "recommendation": "..." }
        """
        from datetime import datetime
        current_date_str = datetime.utcnow().strftime("%B %Y")

        prompt = f"""
        {JOB_MATCH_PROMPT}

        Current Evaluation Date: {current_date_str}

        Candidate Resume Claims:
        {json.dumps(candidate_claims, indent=2)}

        Job Requirements:
        {json.dumps(job_requirements, indent=2)}
        """

        response = self.model.generate_content(prompt)

        try:
            cleaned_text = self._clean_json_text(response.text)
            parsed_json = json.loads(cleaned_text)
        except (json.JSONDecodeError, AttributeError) as e:
            raise ValueError(f"Failed to parse Gemini job match response as JSON: {e}") from e

        try:
            validated_analysis = JobMatchAnalysis.model_validate(parsed_json)
            return validated_analysis.model_dump()
        except Exception as e:
            raise ValueError(f"Gemini job match response failed schema validation: {e}") from e

