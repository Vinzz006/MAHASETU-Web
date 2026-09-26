import uuid

from backend.app.database import Base, utc_now
from sqlalchemy import JSON, Column, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import relationship


class Application(Base):
    __tablename__ = "applications"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    application_number = Column(
        String(64), unique=True, nullable=False, index=True
    )  # e.g. MH-APP-2026-000184
    citizen_id = Column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    service_id = Column(String(64), nullable=False, default="employment-support")
    status = Column(
        String(50), nullable=False, default="APPLICATION_CREATED", index=True
    )  # APPLICATION_CREATED, CONSENT_GRANTED, IDENTITY_VERIFIED, ELIGIBILITY_VERIFIED, APPROVAL_STARTED, ADMIN_APPROVED, AUDITOR_CONFIRMED, COMPLETED, EXCEPTION, REJECTED, REWORK
    current_department = Column(
        String(50), nullable=False, default="PORTAL"
    )  # PORTAL, DEPT_A, DEPT_B, DEPT_C, ADMIN, AUDIT
    citizen_data = Column(
        JSON, nullable=True
    )  # Stores captured or enriched citizen attributes
    rejection_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False, index=True)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    citizen = relationship("User", foreign_keys=[citizen_id])
    consents = relationship(
        "Consent", back_populates="application", cascade="all, delete-orphan"
    )
    workflow_steps = relationship(
        "WorkflowStep", back_populates="application", cascade="all, delete-orphan"
    )
    transactions = relationship(
        "DepartmentTransaction",
        back_populates="application",
        cascade="all, delete-orphan",
    )
    audit_logs = relationship(
        "AuditLog", back_populates="application", cascade="all, delete-orphan"
    )
