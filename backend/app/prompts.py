# Phase 0 placeholder.
# Dev 3 will centralize all Claude prompts in this module during Phase 1.

RESUME_PARSE_PROMPT = """
Extract information from the following résumé text and return it as a structured JSON object.
Follow the strict schema provided below. If a field is not found, use null or an empty list where appropriate.

Schema:
{
  "name": "string",
  "degree": "string",
  "gpa": float,
  "skills": ["string"],
  "experience": [
    {
      "company": "string",
      "role": "string",
      "duration": "string",
      "description": "string"
    }
  ],
  "certifications": ["string"]
}

Return ONLY the JSON object. Do not include any introductory or concluding text.
"""

FRAUD_TRUST_PROMPT = "TODO"
JOB_MATCH_PROMPT = "TODO"

