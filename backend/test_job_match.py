import json
from app.services.ai_engine import AIEngine
from app.core.config import settings


def test_job_match_pipeline():
    print("=" * 60)
    print("Job Match Analysis Pipeline — Verification")
    print("=" * 60)

    if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY == "changeme":
        print("Error: GEMINI_API_KEY is not set in .env")
        return

    engine = AIEngine(gemini_api_key=settings.GEMINI_API_KEY)

    # ── Job Requirements ────────────────────────────────────────
    job_requirements = [
        {"type": "GPA", "operator": ">=", "value": 3.5},
        {"type": "EXPERIENCE", "operator": ">=", "value": 2},
        {"type": "DEGREE", "operator": "==", "value": "B.S. in Computer Science"},
        {"type": "SKILLS", "operator": "includes", "value": "Python"},
        {"type": "SKILLS", "operator": "includes", "value": "Docker"},
        {"type": "CERTIFICATION", "operator": "includes", "value": "AWS Certified Solutions Architect"},
    ]

    # ── Test 1: Strong Candidate ────────────────────────────────
    strong_candidate = {
        "name": "Jane Doe",
        "degree": "B.S. in Computer Science from MIT",
        "gpa": 3.9,
        "skills": ["Python", "Go", "Docker", "Kubernetes", "PostgreSQL"],
        "experience": [
            {
                "company": "Stripe",
                "role": "Software Engineer",
                "duration": "2023-Present",
                "description": "Built payment processing APIs using Go and microservices."
            },
            {
                "company": "Google",
                "role": "Software Engineering Intern",
                "duration": "2021-2022",
                "description": "Optimized database queries for internal web applications."
            }
        ],
        "certifications": ["AWS Certified Solutions Architect"]
    }

    print("\n--- Test 1: Strong Candidate (should score HIGH) ---")
    try:
        result1 = engine.job_match(
            candidate_claims=strong_candidate,
            job_requirements=job_requirements,
        )
        print(json.dumps(result1, indent=2))
        assert result1["match_score"] >= 70, f"Strong candidate scored too low: {result1['match_score']}"
        assert isinstance(result1["matched_requirements"], list)
        assert isinstance(result1["unmatched_requirements"], list)
        assert isinstance(result1["recommendation"], str) and len(result1["recommendation"]) > 0
        print("[PASS] Test 1 Passed!")
    except Exception as e:
        print(f"[FAIL] Test 1 Failed: {e}")

    # ── Test 2: Weak / Mismatched Candidate ─────────────────────
    weak_candidate = {
        "name": "Bob Builder",
        "degree": "B.A. in English Literature",
        "gpa": 2.8,
        "skills": ["Microsoft Word", "Public Speaking"],
        "experience": [
            {
                "company": "Local Library",
                "role": "Library Assistant",
                "duration": "2024-Present",
                "description": "Organized book shelves and assisted patrons."
            }
        ],
        "certifications": []
    }

    print("\n--- Test 2: Weak Candidate (should score LOW) ---")
    try:
        result2 = engine.job_match(
            candidate_claims=weak_candidate,
            job_requirements=job_requirements,
        )
        print(json.dumps(result2, indent=2))
        assert result2["match_score"] <= 30, f"Weak candidate scored too high: {result2['match_score']}"
        assert len(result2["unmatched_requirements"]) > 0, "Weak candidate should have unmatched requirements"
        print("[PASS] Test 2 Passed!")
    except Exception as e:
        print(f"[FAIL] Test 2 Failed: {e}")

    print("\n" + "=" * 60)
    print("Job Match Pipeline verification complete.")
    print("=" * 60)


if __name__ == "__main__":
    test_job_match_pipeline()
