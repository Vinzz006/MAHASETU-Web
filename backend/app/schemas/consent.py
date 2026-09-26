from datetime import datetime

from pydantic import BaseModel, Field


class ConsentRequestCreate(BaseModel):
    application_id: str
    requested_by: str = "Employment Department (DEPT_C)"
    requesting_department: str | None = "DEPT_C"
    receiving_department: str | None = "DEPT_B"
    purpose: str = (
        "Eligibility verification under Maharashtra Employment Support Scheme"
    )
    data_categories: list[str] = [
        "Identity information (Name, DOB from Department A)",
        "Address & Residence information (District verification)",
        "Eligibility & Socio-economic classification (Department B)",
    ]
    scope: list[str] | None = [
        "READ_IDENTITY_DEMOGRAPHICS",
        "READ_DOMICILE_STATUS",
        "READ_INCOME_BRACKET",
    ]


class ConsentActionRequest(BaseModel):
    consent_id: str


class ConsentRejectRequest(BaseModel):
    reason: str | None = "Citizen declined consent"


class ConsentResponse(BaseModel):
    id: str
    consent_number: str
    application_id: str
    citizen_id: str
    requested_by: str
    requesting_department: str | None = None
    receiving_department: str | None = None
    purpose: str
    data_categories: list[str]
    scope: list[str] | None = None
    status: str  # REQUESTED, AUTHORIZED, DECLINED, REVOKED, EXPIRED
    granted_at: datetime | None = None
    expires_at: datetime | None = None
    revocation_at: datetime | None = None
    consent_version: str | None = "v1.0"
    consent_hash: str | None = None


class DataSharingLogResponse(BaseModel):
    id: str
    consent_id: str | None = None
    application_id: str | None = None
    requesting_dept: str
    receiving_dept: str
    data_scope_accessed: list[str] = Field(default_factory=list)
    purpose: str
    status: str
    reason: str | None = None
    correlation_id: str | None = None
    timestamp: str
