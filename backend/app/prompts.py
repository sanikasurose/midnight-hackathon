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
JOB_MATCH_PROMPT = """
You are an expert hiring analyst. Your task is to analyze a candidate's structured resume claims against a set of job requirements and produce a comprehensive match analysis that an employer can use to make informed hiring decisions.

## Analysis Instructions

Perform the following steps in order:

### Step 1 — Requirement-by-Requirement Evaluation
For each job requirement, determine whether the candidate's claims satisfy it:
- **GPA**: Compare the candidate's GPA against the required threshold using the specified operator (>, >=, ==, <, <=). If the candidate has no GPA listed, treat it as unmatched.
- **EXPERIENCE**: Count the candidate's total years of professional experience from their experience entries. Compare against the required threshold. Parse durations like "2021-2023" as 2 years, "2023-Present" as ongoing (use the provided current date).
- **DEGREE**: Check if the candidate holds a degree that matches or exceeds the required level (e.g., B.S., M.S., Ph.D.). Consider field-of-study relevance if specified.
- **CERTIFICATION**: Check if the candidate holds the specific certification(s) required.
- **SKILLS**: Check if the candidate lists the required skill(s) in their skills array. Use semantic matching — e.g., "React.js" matches "React", "ML" matches "Machine Learning".

For each requirement, record:
- `requirement`: A human-readable summary of what the job demands.
- `satisfied`: Boolean indicating if the candidate meets it.
- `candidate_evidence`: Brief explanation of what the candidate has that satisfies (or fails to satisfy) this requirement.

### Step 2 — Scoring
Calculate `match_score` (0–100) using this weighted formula:
- Start with the percentage of requirements satisfied (matched / total × 100).
- Apply the following modifiers:
  - **Exact match or exceeds**: +0 to +5 bonus per requirement (e.g., GPA 3.9 vs. required 3.5 → small bonus).
  - **Near miss**: –5 per requirement that is close but not met (e.g., 1.5 years experience vs. required 2).
  - **Complete miss**: –10 per requirement with no evidence at all.
  - **Bonus skills**: +1 to +5 overall if the candidate brings valuable additional skills beyond what is required.
- Clamp final score to 0–100.

### Step 3 — Recommendation
Based on the match_score, provide a recommendation string:
- **90–100**: "Strong Match — Candidate exceeds requirements. Highly recommended for interview."
- **75–89**: "Good Match — Candidate meets most requirements. Recommended for interview."
- **50–74**: "Partial Match — Candidate meets some requirements but has notable gaps. Consider if gaps are trainable."
- **25–49**: "Weak Match — Candidate falls short on multiple key requirements. Proceed with caution."
- **0–24**: "Poor Match — Candidate does not meet the majority of requirements. Not recommended."

## Output Schema

Return ONLY a JSON object conforming exactly to this schema:
{
  "match_score": integer (0–100),
  "matched_requirements": [
    {
      "requirement": "string — human-readable requirement description",
      "candidate_evidence": "string — what the candidate has that satisfies this"
    }
  ],
  "unmatched_requirements": [
    {
      "requirement": "string — human-readable requirement description",
      "candidate_evidence": "string — what the candidate has (or lacks) relevant to this requirement",
      "gap_severity": "minor" | "moderate" | "critical"
    }
  ],
  "recommendation": "string — one of the recommendation tiers above, optionally with a brief additional context sentence"
}

## Rules
- Be objective, data-driven, and fair. Do not infer skills or experience not explicitly stated in the candidate's claims.
- When in doubt about whether a skill matches, err on the side of NOT matching and note it in the unmatched list.
- Ensure the output is valid JSON strictly conforming to the schema above. Do not include any markdown formatting, code fences, or text outside the JSON.
"""

