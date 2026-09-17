from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel

class ProfileUpdateRequest(BaseModel):
    # Personal
    legal_name: Optional[str] = None
    date_of_birth: Optional[str] = None # YYYY-MM-DD
    gender: Optional[str] = None
    marital_status: Optional[str] = None
    community_caste: Optional[str] = None

    # Address
    state: Optional[str] = None
    district: Optional[str] = None
    city: Optional[str] = None
    division: Optional[str] = None
    taluk: Optional[str] = None
    zone: Optional[str] = None
    full_address: Optional[str] = None
    country: Optional[str] = None

    # Identity
    aadhaar_number: Optional[str] = None # Will be hashed and masked to last 4
    pan_number: Optional[str] = None
    passport_status: Optional[str] = None

    # Family
    father_name: Optional[str] = None
    mother_name: Optional[str] = None
    spouse_name: Optional[str] = None
    guardian_name: Optional[str] = None

    # Contact
    phone: Optional[str] = None
    telephone: Optional[str] = None
    email: Optional[str] = None

    # Education
    educational_qualification: Optional[str] = None

    # Banking
    bank_name: Optional[str] = None
    account_number: Optional[str] = None
    ifsc: Optional[str] = None

class ProfileResponse(BaseModel):
    id: str
    user_id: str

    # Personal
    legal_name: Optional[str] = None
    date_of_birth: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    marital_status: Optional[str] = None
    community_caste: Optional[str] = None

    # Address
    state: Optional[str] = None
    district: Optional[str] = None
    city: Optional[str] = None
    division: Optional[str] = None
    taluk: Optional[str] = None
    zone: Optional[str] = None
    full_address: Optional[str] = None
    country: Optional[str] = None

    # Identity
    aadhaar_last_four: Optional[str] = None
    pan_number: Optional[str] = None
    passport_status: Optional[str] = None

    # Family
    father_name: Optional[str] = None
    mother_name: Optional[str] = None
    spouse_name: Optional[str] = None
    guardian_name: Optional[str] = None

    # Contact
    phone: Optional[str] = None
    telephone: Optional[str] = None
    email: Optional[str] = None

    # Education
    educational_qualification: Optional[str] = None

    # Banking
    bank_name: Optional[str] = None
    account_number_masked: Optional[str] = None
    ifsc: Optional[str] = None

    # Document Reference & Signed URL
    passport_document_url: Optional[str] = None
    passport_download_url: Optional[str] = None

    created_at: datetime
    updated_at: datetime

class CitizenSummaryResponse(BaseModel):
    id: str
    name: str
    email: Optional[str] = None
    mobile: Optional[str] = None
    role: str
    registration_status: str
    profile_completion_percentage: int
    has_profile: bool
    has_passport: bool
    created_at: datetime
