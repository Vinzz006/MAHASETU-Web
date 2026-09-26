from pydantic import BaseModel, Field

# ==============================================================================
# MAHASETU CANONICAL DATA MODEL (CDM) — Core Government Interoperability Entities
# ==============================================================================


class CanonicalAddress(BaseModel):
    address_line1: str | None = None
    address_line2: str | None = None
    city: str | None = None
    district: str = "Pune"
    taluka: str | None = None
    division: str | None = None
    state: str = "Maharashtra"
    pincode: str | None = "411001"
    country: str = "India"


class CanonicalIdentity(BaseModel):
    identifier_type: str = (
        "LOCAL_CITIZEN_ID"  # AADHAAR_MASKED, PAN, VOTER_ID, RATION_ID, LOCAL_CITIZEN_ID
    )
    identifier_value_masked: str = "****"
    identifier_hash: str | None = None
    verification_status: str = "PENDING"  # PENDING, VERIFIED, REJECTED
    issuer_authority: str | None = None


class CanonicalCitizen(BaseModel):
    id: str = "CIT-001"
    master_id: str | None = "MS-000001"
    name: str = "Demo Citizen"
    phone: str = "9999999999"
    email: str | None = "citizen@mahasetu.gov.in"
    dateOfBirth: str = "1998-05-12"
    gender: str | None = "MALE"  # MALE, FEMALE, TRANSGENDER, OTHER
    maritalStatus: str | None = "SINGLE"
    address: CanonicalAddress = Field(default_factory=CanonicalAddress)
    annualIncome: int | None = 180000
    employmentStatus: str | None = "UNEMPLOYED"
    educationLevel: str | None = "GRADUATE"
    casteCommunity: str | None = "GENERAL"
    identities: list[CanonicalIdentity] = Field(default_factory=list)


class CanonicalHousehold(BaseModel):
    household_id: str = "HH-2026-0001"
    head_of_family_name: str = "Demo Citizen"
    ration_card_number: str | None = None
    ration_card_category: str | None = "BPL"  # APL, BPL, ANTYODAYA
    total_members: int = 1
    district: str = "Pune"


class CanonicalDepartment(BaseModel):
    department_id: str
    name: str
    code: str
    protocol: str = "REST_JSON"  # REST_JSON, SOAP_XML, PIPE_DELIMITED, CSV_STREAM
    schema_version: str = "v1.0"
    status: str = "ACTIVE"
    health_status: str = "HEALTHY"


class CanonicalService(BaseModel):
    service_id: str
    name: str
    department_id: str
    description: str | None = None
    sla_days: int = 7
    participating_departments: list[str] = Field(default_factory=list)
    is_active: bool = True


class CanonicalDocument(BaseModel):
    document_id: str
    document_type: (
        str  # DOMICILE_CERTIFICATE, INCOME_CERTIFICATE, CASTE_CERTIFICATE, PHOTO
    )
    document_name: str
    issuer_department: str
    verification_status: str = "VERIFIED"
    file_hash: str | None = None
    mime_type: str = "application/pdf"


class CanonicalConsent(BaseModel):
    consent_number: str
    citizen_id: str
    application_id: str
    requesting_department: str
    receiving_department: str
    purpose: str
    data_categories: list[str] = Field(default_factory=list)
    scope: list[str] = Field(default_factory=list)
    status: str = "REQUESTED"  # REQUESTED, AUTHORIZED, DECLINED, REVOKED, EXPIRED
    granted_at: str | None = None
    expires_at: str | None = None
    consent_hash: str | None = None


class CanonicalBenefit(BaseModel):
    benefit_id: str
    scheme_code: str
    beneficiary_citizen_id: str
    amount_inr: float
    disbursement_mode: str = "DIRECT_BENEFIT_TRANSFER"  # DBT_PFMS, ESCR_VOUCHER, CHEQUE
    status: str = "SANCTIONED"  # SANCTIONED, DISBURSED, FAILED
    sanction_reference: str


class CanonicalWorkflow(BaseModel):
    application_id: str
    service_id: str
    current_step: str
    current_department: str
    status: str  # IN_PROGRESS, COMPLETED, EXCEPTION, REJECTED
    sla_status: str = "ON_TRACK"  # ON_TRACK, WARNING, BREACHED
    steps_completed: int = 1
    total_steps: int = 8


class CanonicalGrievance(BaseModel):
    grievance_id: str
    citizen_id: str
    application_id: str | None = None
    department_id: str
    subject: str
    description: str
    status: str = "OPEN"  # OPEN, IN_PROGRESS, RESOLVED, CLOSED
    priority: str = "MEDIUM"


class CanonicalNotification(BaseModel):
    notification_id: str
    recipient_user_id: str
    channel: str = "SMS"  # SMS, EMAIL, IN_APP, WHATSAPP
    subject: str
    message: str
    sent_timestamp: str | None = None
    delivery_status: str = "SENT"


class CanonicalApplicationData(BaseModel):
    citizen: CanonicalCitizen = Field(default_factory=CanonicalCitizen)
    serviceId: str = "employment-support"
    applicationNumber: str | None = None
    consentId: str | None = None


# ==============================================================================
# Department-Specific Adapters & Payloads (Backward Compatibility)
# ==============================================================================


class DepartmentAPayload(BaseModel):
    citizen_name: str
    mobile_no: str
    dob: str
    district: str
    annual_income: int | None = None


class DepartmentBPayload(BaseModel):
    fullName: str
    phone: str
    date_of_birth: str
    residence_district: str
    income_bracket: str | None = None
    employment_category: str | None = None


class DepartmentCPayload(BaseModel):
    applicant_name: str
    contact_number: str
    birth_date: str
    home_district: str
    scheme_code: str
    identity_verified: bool
    eligibility_verified: bool
    sanction_requested: bool = True
