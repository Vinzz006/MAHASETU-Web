import uuid

from backend.app.database import Base, utc_now
from sqlalchemy import JSON, Boolean, Column, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import relationship


class WorkflowStep(Base):
    __tablename__ = "workflow_steps"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    application_id = Column(
        String(36),
        ForeignKey("applications.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    step_name = Column(
        String(100), nullable=False
    )  # APPLICATION_CREATED, CONSENT_GRANTED, IDENTITY_VERIFICATION, ELIGIBILITY_VERIFICATION, DEPARTMENT_APPROVAL, ADMIN_REVIEW, AUDITOR_REVIEW, APPLICATION_COMPLETED
    department_id = Column(
        String(50), nullable=False
    )  # PORTAL, DEPT_A, DEPT_B, DEPT_C, ADMIN, AUDIT
    status = Column(
        String(50), nullable=False, default="PENDING"
    )  # PENDING, IN_PROGRESS, COMPLETED, FAILED, RETRYING, REWORK_REQUESTED
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    timestamp = Column(DateTime, default=utc_now, nullable=True)
    verifier_id = Column(String(100), nullable=True)
    comments = Column(Text, nullable=True)
    rejection_reason = Column(Text, nullable=True)
    details = Column(JSON, nullable=True)

    application = relationship("Application", back_populates="workflow_steps")


class WorkflowDefinition(Base):
    """
    Workflow Definition: Declarative, configurable state-machine pipeline for government schemes.
    Defines steps, department ownership, required verifier roles, SLA durations, conditions,
    and retry/escalation policies.
    """

    __tablename__ = "workflow_definitions"

    id = Column(
        String(64), primary_key=True
    )  # e.g. "WF-DEF-EMPLOYMENT", "WF-DEF-SCHOLARSHIP"
    service_id = Column(
        String(64), nullable=False, unique=True, index=True
    )  # e.g. "employment-support"
    name = Column(String(255), nullable=False)
    version = Column(String(32), default="1.0.0", nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    definition_json = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)
