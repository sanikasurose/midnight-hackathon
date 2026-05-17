import io
import json
import re
import time
import random
import functools
from typing import Callable, Any

import google.generativeai as genai
import google.api_core.exceptions as google_exceptions
import anthropic
from PyPDF2 import PdfReader

from app.prompts import RESUME_PARSE_PROMPT, FRAUD_TRUST_PROMPT, JOB_MATCH_PROMPT
from app.schemas.resume import ResumeClaims, FraudAnalysis, JobMatchAnalysis
from app.core.config import settings


# =====================================================================
# Normalized Exception Hierarchy
# =====================================================================

class AIError(Exception):
    """Base exception for all AI Engine operations."""
    pass


class AIAuthenticationError(AIError):
    """Exception raised when API key or authentication is invalid."""
    pass


class AIRateLimitError(AIError):
    """Exception raised when API rate limits or quotas are exceeded."""
    pass


class AIConnectionError(AIError):
    """Exception raised when a network connection or timeout issue occurs."""
    pass


class AIValidationError(AIError):
    """Exception raised when a response fails schema validation or JSON decoding."""
    pass


class AIServiceError(AIError):
    """Exception raised for upstream API/server issues (5xx errors)."""
    pass


# =====================================================================
# Exception Normalizers
# =====================================================================

def normalize_google_exception(e: Exception) -> AIError:
    """Maps Google Generative AI exceptions to normalized AIError classes."""
    if isinstance(e, google_exceptions.Unauthenticated):
        return AIAuthenticationError(f"Gemini authentication failed: {e}")
    elif isinstance(e, google_exceptions.PermissionDenied):
        return AIAuthenticationError(f"Gemini permissions check failed: {e}")
    elif isinstance(e, google_exceptions.ResourceExhausted):
        return AIRateLimitError(f"Gemini rate limit or quota exceeded: {e}")
    elif isinstance(e, (google_exceptions.DeadlineExceeded, google_exceptions.ServiceUnavailable)):
        return AIConnectionError(f"Gemini connection timeout or service unavailable: {e}")
    elif isinstance(e, (google_exceptions.InternalServerError, google_exceptions.BadGateway)):
        return AIServiceError(f"Gemini internal server error: {e}")
    elif isinstance(e, google_exceptions.GoogleAPICallError):
        return AIServiceError(f"Gemini API call failed: {e}")
    else:
        return AIServiceError(f"An unexpected Gemini error occurred: {e}")


def normalize_anthropic_exception(e: Exception) -> AIError:
    """Maps Anthropic exceptions to normalized AIError classes."""
    if isinstance(e, anthropic.AuthenticationError):
        return AIAuthenticationError(f"Claude authentication failed: {e}")
    elif isinstance(e, anthropic.PermissionDeniedError):
        return AIAuthenticationError(f"Claude permissions check failed: {e}")
    elif isinstance(e, anthropic.RateLimitError):
        return AIRateLimitError(f"Claude rate limit or quota exceeded: {e}")
    elif isinstance(e, (anthropic.APITimeoutError, anthropic.APIConnectionError)):
        return AIConnectionError(f"Claude connection timeout or network issue: {e}")
    elif isinstance(e, anthropic.InternalServerError):
        return AIServiceError(f"Claude internal server error: {e}")
    elif isinstance(e, anthropic.APIError):
        return AIServiceError(f"Claude API failed: {e}")
    else:
        return AIServiceError(f"An unexpected Claude error occurred: {e}")


# =====================================================================
# Retry Handler Decorator
# =====================================================================

def retry_on_transient_error(max_retries: int = 3, initial_delay: float = 1.0, backoff_factor: float = 2.0):
    """
    Decorator that retries on transient errors (RateLimit, Connection, Service errors)
    using exponential backoff and randomized jitter.
    """
    def decorator(func: Callable[..., Any]) -> Callable[..., Any]:
        @functools.wraps(func)
        def wrapper(*args: Any, **kwargs: Any) -> Any:
            delay = initial_delay
            last_exception = None
            for attempt in range(max_retries + 1):
                try:
                    return func(*args, **kwargs)
                except (AIRateLimitError, AIConnectionError, AIServiceError) as e:
                    last_exception = e
                    if attempt >= max_retries:
                        break
                    # Jitter: ±20% variation to prevent synchronization issues
                    jitter = random.uniform(0.8, 1.2)
                    sleep_time = delay * jitter
                    print(f"[AIEngine] Transient error: {e}. Retrying in {sleep_time:.2f}s (Attempt {attempt + 1}/{max_retries})...")
                    time.sleep(sleep_time)
                    delay *= backoff_factor
                except AIError:
                    # Non-transient errors (AuthError, ValidationError) raise immediately without retry
                    raise
            raise last_exception or AIError("AI operations failed after maximum retries")
        return wrapper
    return decorator


# =====================================================================
# Main AI Service Abstraction
# =====================================================================

class AIEngine:
    """
    Unified, enterprise-grade AI Service for résumé extraction, fraud detection, and job matching.
    Supports both Google Gemini and Anthropic Claude with shared client instances,
    selective exponential retries, robust JSON extraction, and normalized errors.
    """

    def __init__(
        self,
        gemini_api_key: str = None,
        anthropic_api_key: str = None,
        provider: str = None,
    ) -> None:
        # Load keys with automatic fallback to central settings
        self.gemini_api_key = gemini_api_key or settings.GEMINI_API_KEY
        self.anthropic_api_key = anthropic_api_key or settings.ANTHROPIC_API_KEY

        # Determine active provider:
        # 1. Use explicitly requested provider if provided
        # 2. Prefer Claude if a valid Anthropic key is present
        # 3. Default to Gemini
        if provider:
            self.provider = provider.lower()
        elif self.anthropic_api_key and self.anthropic_api_key not in ("", "changeme"):
            self.provider = "claude"
        else:
            self.provider = "gemini"

        # Initialize shared clients to optimize connection reuse
        self.claude_client = None
        if self.anthropic_api_key and self.anthropic_api_key not in ("", "changeme"):
            self.claude_client = anthropic.Anthropic(api_key=self.anthropic_api_key)

        self.gemini_model = None
        if self.gemini_api_key and self.gemini_api_key not in ("", "changeme"):
            genai.configure(api_key=self.gemini_api_key)
            self.gemini_model = genai.GenerativeModel(
                model_name="gemini-2.5-flash",
                generation_config={"response_mime_type": "application/json"}
            )

    @staticmethod
    def _clean_json_text(text: str) -> str:
        """Deprecated: Kept for backward compatibility. Use _extract_and_parse_json."""
        text = text.strip()
        if text.startswith("```"):
            lines = text.splitlines()
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines[-1].startswith("```"):
                lines = lines[:-1]
            text = "\n".join(lines).strip()
        return text

    @staticmethod
    def _extract_and_parse_json(text: str) -> dict:
        """
        Extremely resilient JSON extraction helper. Handles markdown wrapping,
        formatting oddities, and conversational wrapper text.
        """
        cleaned = text.strip()
        
        # 1. Clean markdown code fences if present
        if "```" in cleaned:
            try:
                first_fence = cleaned.find("```")
                newline_pos = cleaned.find("\n", first_fence)
                last_fence = cleaned.rfind("```")
                if last_fence > newline_pos:
                    cleaned = cleaned[newline_pos:last_fence].strip()
            except Exception:
                pass

        # 2. Attempt direct JSON load
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            pass

        # 3. Fallback: Parse between the first '{' and last '}'
        try:
            match = re.search(r"(\{.*})", cleaned, re.DOTALL)
            if match:
                return json.loads(match.group(1))
        except (json.JSONDecodeError, AttributeError):
            pass

        raise ValueError("AI response did not contain a valid JSON object.")

    def _extract_text_from_pdf(self, pdf_bytes: bytes) -> str:
        """Extracts text from PDF bytes. Kept for backward compatibility."""
        pdf_file = io.BytesIO(pdf_bytes)
        reader = PdfReader(pdf_file)
        text = ""
        for page in reader.pages:
            text += page.extract_text() or ""
        return text

    @retry_on_transient_error()
    def _call_provider(self, prompt: str) -> str:
        """
        Calls the active AI provider (Gemini or Claude) with robust error
        normalization and automatic retries for transient failures.
        """
        if self.provider == "claude":
            if not self.claude_client:
                raise AIAuthenticationError("Claude client is not initialized (missing Anthropic key).")
            try:
                response = self.claude_client.messages.create(
                    model="claude-3-5-sonnet-20241022",
                    max_tokens=4000,
                    messages=[{"role": "user", "content": prompt}]
                )
                return response.content[0].text
            except Exception as e:
                raise normalize_anthropic_exception(e) from e
        else:
            if not self.gemini_model:
                raise AIAuthenticationError("Gemini client is not initialized (missing Gemini key).")
            try:
                response = self.gemini_model.generate_content(prompt)
                return response.text
            except Exception as e:
                raise normalize_google_exception(e) from e

    def parse_resume(self, raw_text: str) -> dict:
        """
        Parses a PDF résumé text and returns structured claims.
        """
        prompt = f"""
        {RESUME_PARSE_PROMPT}
        
        Résumé Text:
        {raw_text}
        """
        
        response_text = self._call_provider(prompt)
        
        try:
            parsed_json = self._extract_and_parse_json(response_text)
            validated_claims = ResumeClaims.model_validate(parsed_json)
            return validated_claims.model_dump()
        except (json.JSONDecodeError, ValueError) as e:
            raise AIValidationError(f"Failed to parse response as JSON: {e}") from e
        except Exception as e:
            raise AIValidationError(f"Response failed schema validation: {e}") from e

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
        
        response_text = self._call_provider(prompt)
        
        try:
            parsed_json = self._extract_and_parse_json(response_text)
            validated_report = FraudAnalysis.model_validate(parsed_json)
            return validated_report.model_dump()
        except (json.JSONDecodeError, ValueError) as e:
            raise AIValidationError(f"Failed to parse response as JSON: {e}") from e
        except Exception as e:
            raise AIValidationError(f"Response failed schema validation: {e}") from e

    def job_match(self, candidate_claims: dict, job_requirements: list[dict]) -> dict:
        """
        Analyzes candidate resume claims against job requirements and returns
        a comprehensive match analysis for employer hiring decisions.
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

        response_text = self._call_provider(prompt)

        try:
            parsed_json = self._extract_and_parse_json(response_text)
            validated_analysis = JobMatchAnalysis.model_validate(parsed_json)
            return validated_analysis.model_dump()
        except (json.JSONDecodeError, ValueError) as e:
            raise AIValidationError(f"Failed to parse job match response as JSON: {e}") from e
        except Exception as e:
            raise AIValidationError(f"Job match response failed schema validation: {e}") from e
