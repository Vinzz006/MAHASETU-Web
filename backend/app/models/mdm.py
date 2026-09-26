import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, JSON, Text
from sqlalchemy.orm import relationship
from backend.app.database import Base, utc_now

class CitizenMasterRecord(Base):
    """
    Citizen Master Record (MDM Golden Record).
    Represents the unified citizen identity in MahaSetu with cross-department identifier linkages,
    confidence scoring, and source-of-truth metadata.
    """
    __tablename__ = "citizen_master_records"

    master_id = Column(String(36), primary_key=True) # e.g. "MS-000123"
    full_name = Column(String(255), nullable=False, index=True)
    date_of_birth = Column(String(32), nullable=True) # YYYY-MM-DD
    gender = Column(String(32), nullable=True) # MALE, FEMALE, TRANSGENDER, OTHER
    primary_mobile = Column(String(32), nullable=False, index=True)
    primary_email = Column(String(255), nullable=True, index=True)
    address_line = Column(Text, nullable=True)
    district = Column(String(64), nullable=True, index=True)
    taluka = Column(String(64), nullable=True)
    state = Column(String(64), default="Maharashtra", nullable=False)
    pincode = Column(String(16), nullable=True)
    confidence_score = Column(Float, default=1.0, nullable=False)
    source_of_truth = Column(String(64), default="CIVIL_REGISTRY", nullable=False)
    record_version = Column(Integer, default=1, nullable=False)
    status = Column(String(32), default="ACTIVE", nullable=False) # ACTIVE, MERGED, REVIEW_REQUIRED
    merged_into_id = Column(String(36), nullable=True)
    attributes_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    identifiers = relationship("IdentifierRegistry", back_populates="master_record", cascade="all, delete-orphan")


class IdentifierRegistry(Base):
    """
    Identifier Registry: Maps departmental local identifiers (Dept A: A-12345, Dept B: B-77891)
    to the MahaSetu Golden Citizen Master ID (MS-000123).
    """
    __tablename__ = "identifier_registry"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    master_id = Column(String(36), ForeignKey("citizen_master_records.master_id", ondelete="CASCADE"), nullable=False, index=True)
    source_system = Column(String(50), nullable=False, index=True) # DEPT_A, DEPT_B, DEPT_C, LEGACY_01, CIVIL_REGISTRY
    source_identifier = Column(String(100), nullable=False, index=True) # e.g. "A-12345", "B-77891", "LEG-991"
    identifier_type = Column(String(50), nullable=False) # CITIZEN_ID, BENEFICIARY_ID, FOLIO_NO, RATION_ID, TAX_ID
    is_active = Column(Boolean, default=True, nullable=False)
    metadata_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    master_record = relationship("CitizenMasterRecord", back_populates="identifiers")


class MDMMatchReview(Base):
    """
    MDM Match Review Queue: Stores ambiguous identity matches (confidence between 0.50 and 0.85)
    for human-in-the-loop officer review, preventing incorrect automated merges.
    """
    __tablename__ = "mdm_match_reviews"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    incoming_record = Column(JSON, nullable=False)
    candidate_master_id = Column(String(36), ForeignKey("citizen_master_records.master_id", ondelete="SET NULL"), nullable=True)
    confidence_score = Column(Float, nullable=False)
    matching_criteria = Column(JSON, nullable=False)
    status = Column(String(32), default="PENDING_REVIEW", nullable=False) # PENDING_REVIEW, RESOLVED_MERGE, RESOLVED_NEW, REJECTED
    reviewed_by = Column(String(100), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    resolution_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    candidate_record = relationship("CitizenMasterRecord", foreign_keys=[candidate_master_id])
