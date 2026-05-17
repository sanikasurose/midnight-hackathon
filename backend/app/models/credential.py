from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class Credential(Base):
    __tablename__ = "credentials"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    # Hackathon note: allow NULL for existing dev DBs seeded before user_id existed.
    # Phase 1+ can enforce NOT NULL via migrations if desired.
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=True)
    resume_id: Mapped[int] = mapped_column(ForeignKey("resumes.id", ondelete="CASCADE"), index=True, nullable=False)

    # Credential metadata (never raw data)
    claim_type: Mapped[str] = mapped_column(String, nullable=False)  # GPA, EXPERIENCE, DEGREE, etc.
    claim_value: Mapped[str] = mapped_column(String, nullable=False)  # encrypted/opaque placeholder

    # Midnight integration
    credential_hash: Mapped[str | None] = mapped_column(String, nullable=True, index=True)  # SHA256 hash
    midnight_tx_id: Mapped[str | None] = mapped_column(String, nullable=True)  # tx hash from store_credential()
    proof_hash: Mapped[str | None] = mapped_column(String, nullable=True, index=True)  # proof hash

    # Status tracking
    verification_status: Mapped[str] = mapped_column(String, default="pending")  # pending | verified | failed

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="credentials")
    resume = relationship("Resume", back_populates="credentials")
    applications = relationship("Application", back_populates="credential")
    proofs = relationship("Proof", back_populates="credential", cascade="all, delete-orphan")
