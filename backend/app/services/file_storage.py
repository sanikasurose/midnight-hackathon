from __future__ import annotations

import os
from pathlib import Path
from uuid import uuid4


def ensure_dir(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)


def save_resume_pdf(*, pdf_bytes: bytes, uploads_root: str = "uploads/resumes") -> str:
    """
    Saves resume bytes to local disk and returns the stored file path (relative).
    Phase 0/1: local filesystem only (hackathon-simple).
    """
    root = Path(uploads_root)
    ensure_dir(root)

    filename = f"{uuid4().hex}.pdf"
    file_path = root / filename
    file_path.write_bytes(pdf_bytes)
    # Normalize to a portable relative path string
    return os.fspath(file_path)
