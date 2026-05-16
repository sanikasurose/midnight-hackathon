from __future__ import annotations

from io import BytesIO

from pypdf import PdfReader


def extract_text_from_pdf_bytes(pdf_bytes: bytes) -> str:
    """
    Minimal text extraction for hackathon MVP.
    Returns best-effort extracted text (may be empty).
    """
    try:
        reader = PdfReader(BytesIO(pdf_bytes))
        parts: list[str] = []
        for page in reader.pages:
            parts.append(page.extract_text() or "")
        return "\n".join(p.strip() for p in parts if p.strip())
    except Exception:
        return ""
