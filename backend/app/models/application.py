from sqlalchemy import DateTime, ForeignKey, Integer, String, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class Application(Base):
    __tablename__ = "applications"
    __table_args__ = (UniqueConstraint("job_id", "candidate_id", name="uq_applications_job_candidate"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    job_id: Mapped[int] = mapped_column(ForeignKey("jobs.id"), index=True, nullable=False)
    candidate_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True, nullable=False)

    # Legacy field used by earlier proof-based apply flow. Keep nullable for backward compatibility.
    proof_id: Mapped[str | None] = mapped_column(String, nullable=True)

    # Current MVP linkage: applications reference a credential record.
    # NOTE: This column may be added via lightweight init_db ALTER TABLE during hackathon development.
    credential_id: Mapped[int | None] = mapped_column(ForeignKey("credentials.id"), index=True, nullable=True)

    verification_status: Mapped[str] = mapped_column(
        String, nullable=False, default="PENDING"
    )  # PENDING|VERIFIED|FAILED
    ai_report: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    job = relationship("Job", back_populates="applications")
    candidate = relationship("User", back_populates="applications")
    credential = relationship("Credential", back_populates="applications")
