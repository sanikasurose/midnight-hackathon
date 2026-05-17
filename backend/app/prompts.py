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

FRAUD_TRUST_PROMPT = """
You are an expert fraud and resume validation analyst. Your task is to analyze a candidate's structured resume claims, optional job requirements, and optional raw resume text to calculate a "fraud_score" (0-100) and identify a list of critical trust/inconsistency "flags".

You must detect anomalies across four specific categories:
1. **Timeline Gaps (timeline_gap)**: Identify unexplained gaps of 3+ months between employment roles or educational milestones.
2. **Inflated Claims (inflated_claim)**: Check for unrealistic, exaggerated, or overly senior titles (e.g., "Chief Architect", "Lead Developer") held by junior profiles or people with very little experience. Look for highly complex accomplishments listed in short-term/internship roles, or matching candidate skills against job requirements to see if they're severely overselling.
3. **Inconsistent Dates (inconsistent_date)**: Detect chronologically impossible sequences, overlapping full-time employment roles that are physically or logically impossible to perform simultaneously, or full-time university study overlapping completely with demanding full-time on-site roles, or negative durations (end date before start date).
4. **Suspicious Wording (suspicious_wording)**: Detect copy-pasted template phrases, massive keyword stuffing (repeating buzzwords without context), extremely vague descriptions of responsibilities (e.g., "handled all operations and programming in Python"), or clear indicators of AI-generation boilerplate (e.g., "Here is your updated resume:").

Guidelines for scoring (fraud_score):
- 0: Perfectly consistent, realistic, and clear resume.
- 1-20 (Low Risk): Minor timeline gaps (e.g. 4-6 months gap) or small buzzword usage.
- 21-50 (Medium Risk): Significant timeline gaps, minor date overlap (e.g. 1 month overlap), or moderately inflated claims (e.g., calling an internship role a "Software Engineer" role).
- 51-80 (High Risk): Major overlapping full-time jobs, clearly impossible chronological dates, or highly inflated claims (e.g. "Senior Architect" with only 1 year total experience).
- 81-100 (Critical Risk): Extreme date overlaps, clear plagiarism/lying, or completely AI-boilerplate/incoherent/fabricated listings.

Output Schema:
{
  "fraud_score": integer (between 0 and 100),
  "flags": [
    {
      "type": "timeline_gap" | "inflated_claim" | "inconsistent_date" | "suspicious_wording",
      "severity": "low" | "medium" | "high",
      "description": "Detailed explanation of the flag and where/why it was detected"
    }
  ]
}

Ensure the output is valid JSON strictly conforming to this schema. Do not include any formatting markdown or other text besides the raw JSON.
"""
JOB_MATCH_PROMPT = "TODO"

