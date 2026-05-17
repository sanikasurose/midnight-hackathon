from sqlalchemy import DateTime, ForeignKey, Integer, JSON, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class Application(Base):
    __tablename__ = "applications"
    __table_args__ = (UniqueConstraint("job_id", "candidate_id", name="uq_applications_job_candidate"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    job_id: Mapped[int] = mapped_column(ForeignKey("jobs.id"), index=True, nullable=False)
    candidate_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True, nullable=False)

    proof_id: Mapped[str | None] = mapped_column(String, nullable=True)
    credential_id: Mapped[int | None] = mapped_column(ForeignKey("credentials.id"), index=True, nullable=True)
    verification_status: Mapped[str] = mapped_column(String, nullable=False, default="PENDING")
    ai_report: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
