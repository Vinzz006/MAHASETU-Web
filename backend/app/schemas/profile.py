from datetime import datetime

from pydantic import BaseModel


class ProfileUpdateRequest(BaseModel):
    # Personal
    legal_name: str | None = None
    date_of_birth: str | None = None  # YYYY-MM-DD
    gender: str | None = None
    marital_status: str | None = None
    community_caste: str | None = None

    # Address
    state: str | None = None
    district: str | None = None
    city: str | None = None
    division: str | None = None
    taluk: str | None = None
    zone: str | None = None
    full_address: str | None = None
    country: str | None = None

    # Identity
    aadhaar_number: str | None = None  # Will be hashed and masked to last 4
    pan_number: str | None = None
    passport_status: str | None = None

    # Family
    father_name: str | None = None
    mother_name: str | None = None
    spouse_name: str | None = None
    guardian_name: str | None = None

    # Contact
    phone: str | None = None
    telephone: str | None = None
    email: str | None = None

    # Education
    educational_qualification: str | None = None

    # Banking
    bank_name: str | None = None
    account_number: str | None = None
    ifsc: str | None = None


class ProfileResponse(BaseModel):
    id: str
    user_id: str

    # Personal
    legal_name: str | None = None
    date_of_birth: str | None = None
    age: int | None = None
    gender: str | None = None
    marital_status: str | None = None
    community_caste: str | None = None

    # Address
    state: str | None = None
    district: str | None = None
    city: str | None = None
    division: str | None = None
    taluk: str | None = None
    zone: str | None = None
    full_address: str | None = None
    country: str | None = None

    # Identity
    aadhaar_last_four: str | None = None
    pan_number: str | None = None
    passport_status: str | None = None

    # Family
    father_name: str | None = None
    mother_name: str | None = None
    spouse_name: str | None = None
    guardian_name: str | None = None

    # Contact
    phone: str | None = None
    telephone: str | None = None
    email: str | None = None

    # Education
    educational_qualification: str | None = None

    # Banking
    bank_name: str | None = None
    account_number_masked: str | None = None
    ifsc: str | None = None

    # Document Reference & Signed URL
    passport_document_url: str | None = None
    passport_download_url: str | None = None

    created_at: datetime
    updated_at: datetime


class CitizenSummaryResponse(BaseModel):
    id: str
    name: str
    email: str | None = None
    mobile: str | None = None
    role: str
    registration_status: str
    profile_completion_percentage: int
    has_profile: bool
    has_passport: bool
    created_at: datetime
