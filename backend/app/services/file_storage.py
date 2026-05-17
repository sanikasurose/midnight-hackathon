from __future__ import annotations

import os
from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, status


def _ensure_dir(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)


def validate_pdf_upload(*, filename: str | None, content_type: str | None) -> None:
    if not filename or not filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="PDF only")
    if content_type not in (None, "", "application/pdf", "application/octet-stream"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="PDF only")


def validate_file_size(*, file_bytes: bytes, max_size_mb: int) -> None:
    max_bytes = int(max_size_mb) * 1024 * 1024
    if len(file_bytes) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large (max {max_size_mb} MB)",
        )


def save_resume_pdf_for_user(
    *,
    user_id: int,
    pdf_bytes: bytes,
    original_filename: str,
    uploads_root: str = "uploads/resumes",
) -> str:
    """
    Saves resume bytes to local disk and returns the stored file path (relative).

    Directory layout:
      uploads/resumes/{user_id}/resume_<uuid>.pdf
    """
    root = Path(uploads_root) / str(user_id)
    _ensure_dir(root)

    stored_name = f"resume_{uuid4().hex}.pdf"
    file_path = root / stored_name
    try:
        file_path.write_bytes(pdf_bytes)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save uploaded file",
        ) from e

    return os.fspath(file_path)
