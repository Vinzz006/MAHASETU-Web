import uuid

from backend.app.database import Base, utc_now
from sqlalchemy import Column, DateTime, Float, ForeignKey, String, Text
from sqlalchemy.orm import relationship


class SLAEscalation(Base):
    __tablename__ = "sla_escalations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    application_id = Column(
        String(36),
        ForeignKey("applications.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    service_id = Column(String(64), nullable=False)
    target_department = Column(String(50), nullable=False)  # DEPT_A, DEPT_B, DEPT_C
    sla_days_allotted = Column(Float, nullable=False, default=3.0)
    elapsed_days = Column(Float, nullable=False, default=0.0)
    severity = Column(
        String(50), nullable=False, default="APPROACHING_BREACH"
    )  # APPROACHING_BREACH, BREACHED
    escalation_level = Column(
        String(50), nullable=False, default="DISTRICT_OFFICER"
    )  # DISTRICT_OFFICER, HEAD_OF_DEPARTMENT, STATE_DIRECTOR
    escalated_to = Column(
        String(255), nullable=False, default="District Employment Officer, Pune"
    )
    status = Column(
        String(50), nullable=False, default="PENDING_EXPEDITE"
    )  # PENDING_EXPEDITE, EXPEDITED, RESOLVED
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    expedited_at = Column(DateTime, nullable=True)

    application = relationship("Application")
