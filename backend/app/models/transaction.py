import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, JSON, Text
from sqlalchemy.orm import relationship
from backend.app.database import Base, utc_now

class DepartmentTransaction(Base):
    __tablename__ = "department_transactions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    application_id = Column(String(36), ForeignKey("applications.id", ondelete="CASCADE"), nullable=False, index=True)
    department_id = Column(String(50), nullable=False, index=True) # DEPT_A, DEPT_B, DEPT_C, LEGACY_01
    source_department = Column(String(50), nullable=True, default="PORTAL")
    destination_department = Column(String(50), nullable=True)
    schema_version = Column(String(32), nullable=False, default="v2.1-canonical")
    operation = Column(String(100), nullable=False) # verify_identity, verify_eligibility, submit_application, get_status
    request_payload = Column(JSON, nullable=False)
    response_payload = Column(JSON, nullable=True)
    status = Column(String(50), nullable=False, index=True) # SUCCESS, FAILED, RETRYING, RESOLVED
    retry_count = Column(Integer, default=0, nullable=False)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False, index=True)

    application = relationship("Application", back_populates="transactions")
