import uuid

from backend.app.database import Base, utc_now
from sqlalchemy import Column, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import relationship


class Grievance(Base):
    __tablename__ = "grievances"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    ticket_number = Column(
        String(64), unique=True, nullable=False, index=True
    )  # e.g. MH-GRV-2026-00412
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
    department_id = Column(String(50), nullable=False)  # DEPT_A, DEPT_B, DEPT_C, HUB
    category = Column(
        String(100), nullable=False
    )  # IDENTITY_MISMATCH, ELIGIBILITY_DISCREPANCY, SANCTION_DELAY, TECHNICAL_EXCEPTION
    description = Column(Text, nullable=False)
    status = Column(
        String(50), nullable=False, default="OPEN"
    )  # OPEN, INVESTIGATING, ESCALATED, RESOLVED
    resolution_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    resolved_at = Column(DateTime, nullable=True)

    application = relationship("Application")
    citizen = relationship("User", foreign_keys=[citizen_id])
