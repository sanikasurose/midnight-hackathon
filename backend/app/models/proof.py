from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, JSON, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class Proof(Base):
    __tablename__ = "proofs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    credential_id: Mapped[int] = mapped_column(
        ForeignKey("credentials.id", ondelete="CASCADE"), index=True, nullable=False
    )

    proof_type: Mapped[str] = mapped_column(String, nullable=False)  # GPA, EXPERIENCE, DEGREE, etc.
    proof_hash: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    public_inputs: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    proof_data: Mapped[str | None] = mapped_column(String, nullable=True)  # Hex-encoded proof bytes
    verification_status: Mapped[str] = mapped_column(String, default="generated")  # generated | verified | failed
    verified: Mapped[bool] = mapped_column(Boolean, default=False)
    midnight_tx_id: Mapped[str | None] = mapped_column(String, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    credential = relationship("Credential", back_populates="proofs")
