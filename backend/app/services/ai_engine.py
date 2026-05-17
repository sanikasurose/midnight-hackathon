import io
import json
import google.generativeai as genai
from PyPDF2 import PdfReader
from app.prompts import RESUME_PARSE_PROMPT
from app.schemas.resume import ResumeClaims


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
            parsed_json = json.loads(response.text)
        except (json.JSONDecodeError, AttributeError) as e:
            raise ValueError(f"Failed to parse Gemini response as JSON: {e}") from e

        try:
            # Validate that all required fields are present and correctly typed using Pydantic
            validated_claims = ResumeClaims.model_validate(parsed_json)
            return validated_claims.model_dump()
        except Exception as e:
            raise ValueError(f"Gemini response failed schema validation: {e}") from e

    def trust_report(self, resume_claims: dict, job_requirements: dict) -> dict:
        # TODO: call Gemini fraud/trust prompt; return structured report JSON
        raise NotImplementedError
