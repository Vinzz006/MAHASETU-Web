import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, Integer, Boolean, DateTime, JSON
from backend.app.database import Base, utc_now

class Service(Base):
    __tablename__ = "services"

    id = Column(String(64), primary_key=True) # e.g. "employment-support"
    name = Column(String(255), nullable=False)
    name_mr = Column(String(255), nullable=True)
    department = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    description_mr = Column(Text, nullable=True)
    participating_departments = Column(JSON, nullable=False, default=list)
    sla_days = Column(Integer, nullable=False, default=7)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)
