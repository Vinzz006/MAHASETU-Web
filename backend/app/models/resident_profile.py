import uuid
from datetime import datetime, timezone

from backend.app.database import Base, utc_now
from sqlalchemy import Column, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import relationship


class ResidentProfile(Base):
    __tablename__ = "resident_profiles"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )

    # 1. Personal Group
    legal_name = Column(String(255), nullable=True)
    date_of_birth = Column(String(32), nullable=True)  # YYYY-MM-DD
    gender = Column(String(32), nullable=True)  # MALE, FEMALE, TRANSGENDER, OTHER
    marital_status = Column(
        String(32), nullable=True
    )  # SINGLE, MARRIED, DIVORCED, WIDOWED
    community_caste = Column(
        String(64), nullable=True
    )  # GENERAL, OBC, SC, ST, EWS, VJNT

    # 2. Address Group
    state = Column(String(64), nullable=True, default="Maharashtra")
    district = Column(String(64), nullable=True)
    city = Column(String(64), nullable=True)
    division = Column(String(64), nullable=True)
    taluk = Column(String(64), nullable=True)
    zone = Column(String(64), nullable=True)
    full_address = Column(Text, nullable=True)
    country = Column(String(64), nullable=True, default="India")

    # 3. Identity Group (Aadhaar masked at rest: hashed + last 4 digits visible)
    aadhaar_hash = Column(String(128), nullable=True)
    aadhaar_last_four = Column(String(4), nullable=True)
    pan_number = Column(String(20), nullable=True)
    passport_status = Column(
        String(50), nullable=True, default="NOT_ISSUED"
    )  # NOT_ISSUED, APPLIED, ACTIVE, EXPIRED

    # 4. Family Group
    father_name = Column(String(255), nullable=True)
    mother_name = Column(String(255), nullable=True)
    spouse_name = Column(String(255), nullable=True)
    guardian_name = Column(String(255), nullable=True)

    # 5. Contact Group
    phone = Column(String(32), nullable=True)
    telephone = Column(String(32), nullable=True)
    email = Column(String(255), nullable=True)

    # 6. Education Group
    educational_qualification = Column(
        String(128), nullable=True
    )  # SSC, HSC, GRADUATE, POST_GRADUATE, DIPLOMA, DOCTORATE

    # 7. Banking Group (Account number masked at rest)
    bank_name = Column(String(128), nullable=True)
    account_number_masked = Column(String(64), nullable=True)
    ifsc = Column(String(32), nullable=True)

    # 8. Document Storage (Private Firebase Storage Reference)
    passport_document_url = Column(String(512), nullable=True)

    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    user = relationship("User", foreign_keys=[user_id])

    @property
    def age(self) -> int | None:
        """Dynamically computes age from date_of_birth to prevent redundant or stale storage."""
        if not self.date_of_birth:
            return None
        try:
            # Handle YYYY-MM-DD
            dob = (
                datetime.strptime(self.date_of_birth[:10], "%Y-%m-%d")
                .replace(tzinfo=timezone.utc)
                .date()
            )
            today = datetime.now(timezone.utc).date()
            return (
                today.year
                - dob.year
                - ((today.month, today.day) < (dob.month, dob.day))
            )
        except (TypeError, ValueError):
            return None
