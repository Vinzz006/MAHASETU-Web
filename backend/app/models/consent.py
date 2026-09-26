import uuid

from backend.app.database import Base
from sqlalchemy import JSON, Column, DateTime, ForeignKey, String
from sqlalchemy.orm import relationship


class Consent(Base):
    __tablename__ = "consents"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    consent_number = Column(
        String(64), unique=True, nullable=False, index=True
    )  # e.g. CON-2026-004821
    application_id = Column(
        String(36),
        ForeignKey("applications.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    citizen_id = Column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    requested_by = Column(
        String(100), nullable=False
    )  # e.g. "Employment Department (DEPT_C)"
    purpose = Column(
        String(255), nullable=False
    )  # e.g. "Eligibility verification for Employment Support Scheme"
    data_categories = Column(
        JSON, nullable=False
    )  # ["Identity information", "Address information", "Eligibility information"]
    status = Column(
        String(50), nullable=False, default="REQUESTED"
    )  # REQUESTED, AUTHORIZED, DECLINED, REVOKED
    granted_at = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=True)
    consent_hash = Column(String(128), nullable=True)

    application = relationship("Application", back_populates="consents")
    citizen = relationship("User", foreign_keys=[citizen_id])
