import os
import json
from app.services.ai_engine import AIEngine
from app.core.config import settings

def test_fraud_pipeline():
    print("Starting Fraud/Inconsistency Analysis Pipeline Verification...")
    
    if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY == "changeme":
        print("Error: GEMINI_API_KEY is not set in .env")
        return

    # Initialize Engine
    engine = AIEngine(gemini_api_key=settings.GEMINI_API_KEY)
    
    # 1. Consistent Clean Profile
    clean_claims = {
        "name": "Jane Doe",
        "degree": "B.S. in Computer Science from MIT",
        "gpa": 3.9,
        "skills": ["Python", "Go", "Docker"],
        "experience": [
            {
                "company": "Stripe",
                "role": "Software Engineer",
                "duration": "2023-Present",
                "description": "Built reliable payment processing APIs using Go and microservices architecture."
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
    
    # 2. Highly Inconsistent & Inflated Profile
    suspicious_claims = {
        "name": "Liar McCheater",
        "degree": "Ph.D. in Artificial Intelligence from Stanford (GPA: 4.0)",
        "gpa": 4.0,
        "skills": ["Python", "Rust", "C++", "Next.js", "Solidity", "Kubernetes", "Quantum Computing", "Deep Learning", "COBOL", "Fortran"],
        "experience": [
            {
                "company": "OpenAI",
                "role": "Chief Scientist & Founder",
                "duration": "2024-2025",
                "description": "Lead researcher. Single-handedly designed and built GPT-5 and all underlying models from scratch in two weeks."
            },
            {
                "company": "Microsoft",
                "role": "Director of Engineering",
                "duration": "2023-2025",
                "description": "Managed over 500 engineers and directed the entire Azure Cloud division."
            },
            {
                "company": "Local Pizza Joint",
                "role": "Delivery Boy",
                "duration": "2019-2022",
                "description": "Delivered pizza."
            }
        ],
        "certifications": []
    }
    
    # Optional raw text containing suspicious templates
    raw_suspicious_text = """
    Liar McCheater
    Contact: liar@fraud.com
    
    Summary:
    Highly motivated professional. Certainly! Here is your resume customized for the role of Chief Scientist. Feel free to copy and paste this.
    
    Experience:
    - OpenAI (2024-2025): Chief Scientist. Built GPT-5.
    - Microsoft (2023-2025): Director of Engineering. Note that these dates overlap completely, but that's because I have 200 IQ.
    - Local Pizza Joint (2019-2022): Delivery Boy.
    """

    print("\n--- Running Test 1: Consistent & Clean Profile ---")
    try:
        report1 = engine.trust_report(resume_claims=clean_claims, job_requirements={"type": "EXPERIENCE", "operator": ">=", "value": 2})
        print("Report output:")
        print(json.dumps(report1, indent=2))
        assert report1["fraud_score"] <= 40, "Clean profile should have a low fraud score"
        print("Test 1 Passed!")
    except Exception as e:
        print(f"Test 1 Failed: {e}")

    print("\n--- Running Test 2: Highly Inconsistent, Inflated, & Suspicious Profile ---")
    try:
        report2 = engine.trust_report(
            resume_claims=suspicious_claims, 
            job_requirements={"type": "EXPERIENCE", "operator": ">=", "value": 3},
            raw_text=raw_suspicious_text
        )
        print("Report output:")
        print(json.dumps(report2, indent=2))
        assert report2["fraud_score"] >= 50, "Suspicious profile should have a high fraud score"
        
        # Check for flags
        flag_types = [f["type"] for f in report2["flags"]]
        print(f"Detected flag types: {flag_types}")
        print("Test 2 Passed!")
    except Exception as e:
        print(f"Test 2 Failed: {e}")

if __name__ == "__main__":
    test_fraud_pipeline()
