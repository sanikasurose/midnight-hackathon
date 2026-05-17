import os
from unittest.mock import MagicMock
from app.services.ai_engine import AIEngine
from app.core.config import settings

def test_pipeline():
    print("Starting Resume Extraction Pipeline Verification...")
    
    if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY == "changeme":
        print("Error: GEMINI_API_KEY is not set in .env")
        return

    # Initialize Engine
    engine = AIEngine(gemini_api_key=settings.GEMINI_API_KEY)
    
    # Sample Resume Text
    sample_text = """
    John Smith
    Education: B.S. in Computer Science from Stanford University (GPA: 3.8)
    Skills: Python, JavaScript, Docker, Kubernetes
    Experience:
    - Software Engineer at Google (2020-2023): Developed scalable microservices.
    - Intern at Meta (2019): Worked on React components.
    Certifications: AWS Certified Developer
    """

    print("Sending request to Gemini...")
    try:
        result = engine.parse_resume(sample_text)
        
        print("\nPipeline returned structured data:")
        import json
        print(json.dumps(result, indent=2))
        
        # Basic Validation
        required_keys = ["name", "degree", "skills", "experience", "certifications"]
        missing = [k for k in required_keys if k not in result]
        
        if not missing:
            print("\nVerification Successful: All required fields present.")
        else:
            print(f"\nVerification Warning: Missing fields: {missing}")
            
    except Exception as e:
        print(f"\nPipeline Failed: {str(e)}")

if __name__ == "__main__":
    test_pipeline()
