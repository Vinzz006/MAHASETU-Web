import uuid

from backend.app.database import Base, utc_now
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
    requesting_department = Column(String(100), nullable=True)  # e.g. "DEPT_C"
    receiving_department = Column(String(100), nullable=True)  # e.g. "DEPT_B"
    purpose = Column(
        String(255), nullable=False
    )  # e.g. "Eligibility verification for Employment Support Scheme"
    data_categories = Column(
        JSON, nullable=False
    )  # ["Identity information", "Address information", "Eligibility information"]
    scope = Column(
        JSON, nullable=True
    )  # e.g. ["READ_DEMOGRAPHICS", "READ_INCOME_BRACKET"]
    status = Column(
        String(50), nullable=False, default="REQUESTED"
    )  # REQUESTED, AUTHORIZED, DECLINED, REVOKED, EXPIRED
    granted_at = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=True)
    revocation_at = Column(DateTime, nullable=True)
    consent_version = Column(String(32), default="v1.0", nullable=False)
    consent_hash = Column(String(128), nullable=True)

    application = relationship("Application", back_populates="consents")
    citizen = relationship("User", foreign_keys=[citizen_id])
    data_sharing_logs = relationship("DataSharingLog", back_populates="consent")


class DataSharingLog(Base):
    """
    Data Sharing Log: Complete audit history of every inter-departmental data disclosure,
    recording accessing department, recipient department, specific data categories, purpose,
    authorization status, and correlation IDs.
    """

    __tablename__ = "data_sharing_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    consent_id = Column(
        String(36),
        ForeignKey("consents.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    application_id = Column(
        String(36),
        ForeignKey("applications.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    citizen_id = Column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    requesting_dept = Column(String(50), nullable=False, index=True)
    receiving_dept = Column(String(50), nullable=False, index=True)
    data_scope_accessed = Column(JSON, nullable=False)
    purpose = Column(String(255), nullable=False)
    status = Column(
        String(50), nullable=False
    )  # ALLOWED, BLOCKED_NO_CONSENT, BLOCKED_SCOPE_EXCEEDED, BLOCKED_EXPIRED
    reason = Column(String(255), nullable=True)
    ip_address = Column(String(64), nullable=True)
    correlation_id = Column(String(64), nullable=True, index=True)
    timestamp = Column(DateTime, default=utc_now, nullable=False, index=True)

    consent = relationship("Consent", back_populates="data_sharing_logs")
    citizen = relationship("User", foreign_keys=[citizen_id])
    application = relationship("Application", foreign_keys=[application_id])
