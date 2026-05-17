from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class Credential(Base):
    __tablename__ = "credentials"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    resume_id: Mapped[int] = mapped_column(ForeignKey("resumes.id", ondelete="CASCADE"), index=True, nullable=False)

    claim_type: Mapped[str] = mapped_column(String, nullable=False)
    claim_value: Mapped[str] = mapped_column(String, nullable=False)  # encrypted/opaque placeholder

    midnight_tx_id: Mapped[str | None] = mapped_column(String, nullable=True)
    proof_hash: Mapped[str | None] = mapped_column(String, nullable=True)

    user = relationship("User", back_populates="credentials")
    resume = relationship("Resume", back_populates="credentials")
    applications = relationship("Application", back_populates="credential")
