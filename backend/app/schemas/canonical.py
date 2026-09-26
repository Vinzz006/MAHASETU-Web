from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field

# ==============================================================================
# MAHASETU CANONICAL DATA MODEL (CDM) — Core Government Interoperability Entities
# ==============================================================================

class CanonicalAddress(BaseModel):
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    district: str = "Pune"
    taluka: Optional[str] = None
    division: Optional[str] = None
    state: str = "Maharashtra"
    pincode: Optional[str] = "411001"
    country: str = "India"


class CanonicalIdentity(BaseModel):
    identifier_type: str = "LOCAL_CITIZEN_ID" # AADHAAR_MASKED, PAN, VOTER_ID, RATION_ID, LOCAL_CITIZEN_ID
    identifier_value_masked: str = "****"
    identifier_hash: Optional[str] = None
    verification_status: str = "PENDING" # PENDING, VERIFIED, REJECTED
    issuer_authority: Optional[str] = None


class CanonicalCitizen(BaseModel):
    id: str = "CIT-001"
    master_id: Optional[str] = "MS-000001"
    name: str = "Demo Citizen"
    phone: str = "9999999999"
    email: Optional[str] = "citizen@mahasetu.gov.in"
    dateOfBirth: str = "1998-05-12"
    gender: Optional[str] = "MALE" # MALE, FEMALE, TRANSGENDER, OTHER
    maritalStatus: Optional[str] = "SINGLE"
    address: CanonicalAddress = Field(default_factory=CanonicalAddress)
    annualIncome: Optional[int] = 180000
    employmentStatus: Optional[str] = "UNEMPLOYED"
    educationLevel: Optional[str] = "GRADUATE"
    casteCommunity: Optional[str] = "GENERAL"
    identities: List[CanonicalIdentity] = Field(default_factory=list)


class CanonicalHousehold(BaseModel):
    household_id: str = "HH-2026-0001"
    head_of_family_name: str = "Demo Citizen"
    ration_card_number: Optional[str] = None
    ration_card_category: Optional[str] = "BPL" # APL, BPL, ANTYODAYA
    total_members: int = 1
    district: str = "Pune"


class CanonicalDepartment(BaseModel):
    department_id: str
    name: str
    code: str
    protocol: str = "REST_JSON" # REST_JSON, SOAP_XML, PIPE_DELIMITED, CSV_STREAM
    schema_version: str = "v1.0"
    status: str = "ACTIVE"
    health_status: str = "HEALTHY"


class CanonicalService(BaseModel):
    service_id: str
    name: str
    department_id: str
    description: Optional[str] = None
    sla_days: int = 7
    participating_departments: List[str] = Field(default_factory=list)
    is_active: bool = True


class CanonicalDocument(BaseModel):
    document_id: str
    document_type: str # DOMICILE_CERTIFICATE, INCOME_CERTIFICATE, CASTE_CERTIFICATE, PHOTO
    document_name: str
    issuer_department: str
    verification_status: str = "VERIFIED"
    file_hash: Optional[str] = None
    mime_type: str = "application/pdf"


class CanonicalConsent(BaseModel):
    consent_number: str
    citizen_id: str
    application_id: str
    requesting_department: str
    receiving_department: str
    purpose: str
    data_categories: List[str] = Field(default_factory=list)
    scope: List[str] = Field(default_factory=list)
    status: str = "REQUESTED" # REQUESTED, AUTHORIZED, DECLINED, REVOKED, EXPIRED
    granted_at: Optional[str] = None
    expires_at: Optional[str] = None
    consent_hash: Optional[str] = None


class CanonicalBenefit(BaseModel):
    benefit_id: str
    scheme_code: str
    beneficiary_citizen_id: str
    amount_inr: float
    disbursement_mode: str = "DIRECT_BENEFIT_TRANSFER" # DBT_PFMS, ESCR_VOUCHER, CHEQUE
    status: str = "SANCTIONED" # SANCTIONED, DISBURSED, FAILED
    sanction_reference: str


class CanonicalWorkflow(BaseModel):
    application_id: str
    service_id: str
    current_step: str
    current_department: str
    status: str # IN_PROGRESS, COMPLETED, EXCEPTION, REJECTED
    sla_status: str = "ON_TRACK" # ON_TRACK, WARNING, BREACHED
    steps_completed: int = 1
    total_steps: int = 8


class CanonicalGrievance(BaseModel):
    grievance_id: str
    citizen_id: str
    application_id: Optional[str] = None
    department_id: str
    subject: str
    description: str
    status: str = "OPEN" # OPEN, IN_PROGRESS, RESOLVED, CLOSED
    priority: str = "MEDIUM"


class CanonicalNotification(BaseModel):
    notification_id: str
    recipient_user_id: str
    channel: str = "SMS" # SMS, EMAIL, IN_APP, WHATSAPP
    subject: str
    message: str
    sent_timestamp: Optional[str] = None
    delivery_status: str = "SENT"


class CanonicalApplicationData(BaseModel):
    citizen: CanonicalCitizen = Field(default_factory=CanonicalCitizen)
    serviceId: str = "employment-support"
    applicationNumber: Optional[str] = None
    consentId: Optional[str] = None


# ==============================================================================
# Department-Specific Adapters & Payloads (Backward Compatibility)
# ==============================================================================

class DepartmentAPayload(BaseModel):
    citizen_name: str
    mobile_no: str
    dob: str
    district: str
    annual_income: Optional[int] = None


class DepartmentBPayload(BaseModel):
    fullName: str
    phone: str
    date_of_birth: str
    residence_district: str
    income_bracket: Optional[str] = None
    employment_category: Optional[str] = None


class DepartmentCPayload(BaseModel):
    applicant_name: str
    contact_number: str
    birth_date: str
    home_district: str
    scheme_code: str
    identity_verified: bool
    eligibility_verified: bool
    sanction_requested: bool = True
