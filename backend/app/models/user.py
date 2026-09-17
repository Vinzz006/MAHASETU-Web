import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime
from backend.app.database import Base, utc_now

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    firebase_uid = Column(String(128), unique=True, nullable=True, index=True)
    name = Column(String(255), nullable=False)
    mobile = Column(String(32), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    role = Column(String(50), nullable=False, default="CITIZEN") # CITIZEN, DEPARTMENT_A, DEPARTMENT_B, DEPARTMENT_C, AUDITOR, ADMIN
    department_id = Column(String(50), nullable=True) # e.g. DEPT_A, DEPT_B, DEPT_C, AUDIT
    registration_status = Column(String(50), nullable=False, default="PENDING") # PENDING, APPROVED, REJECTED
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)
