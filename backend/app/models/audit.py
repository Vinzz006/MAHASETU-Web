import uuid

from backend.app.database import Base, utc_now
from sqlalchemy import JSON, Column, DateTime, ForeignKey, String
from sqlalchemy.orm import relationship


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    application_id = Column(
        String(36),
        ForeignKey("applications.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    actor_id = Column(String(100), nullable=False)  # citizen ID, officer ID, or SYSTEM
    action = Column(
        String(100), nullable=False
    )  # APPLICATION_CREATED, CONSENT_REQUESTED, CONSENT_GRANTED, DEPT_A_CALLED, etc.
    resource = Column(
        String(100), nullable=False
    )  # e.g. APPLICATION, CONSENT, CONNECTOR_DEPT_A, WORKFLOW
    metadata_json = Column(JSON, nullable=True)
    tamper_hash = Column(String(64), nullable=True, index=True)
    timestamp = Column(DateTime, default=utc_now, nullable=False, index=True)

    application = relationship("Application", back_populates="audit_logs")


from sqlalchemy import event


@event.listens_for(AuditLog, "before_update")
def audit_log_block_update(mapper, connection, target):
    raise RuntimeError(
        f"Security & Compliance Violation: AuditLog records are strictly append-only and cannot be modified! (Record ID: {target.id})"
    )


@event.listens_for(AuditLog, "before_delete")
def audit_log_block_delete(mapper, connection, target):
    raise RuntimeError(
        f"Security & Compliance Violation: AuditLog records are strictly append-only and cannot be deleted! (Record ID: {target.id})"
    )
