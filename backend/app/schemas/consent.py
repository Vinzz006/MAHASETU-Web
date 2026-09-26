from datetime import datetime

from pydantic import BaseModel


class ConsentRequestCreate(BaseModel):
    application_id: str
    requested_by: str = "Employment Department (DEPT_C)"
    purpose: str = (
        "Eligibility verification under Maharashtra Employment Support Scheme"
    )
    data_categories: list[str] = [
        "Identity information (Name, DOB from Department A)",
        "Address & Residence information (District verification)",
        "Eligibility & Socio-economic classification (Department B)",
    ]


class ConsentActionRequest(BaseModel):
    consent_id: str


class ConsentResponse(BaseModel):
    id: str
    consent_number: str
    application_id: str
    citizen_id: str
    requested_by: str
    purpose: str
    data_categories: list[str]
    status: str  # REQUESTED, AUTHORIZED, DECLINED, REVOKED
    granted_at: datetime | None = None
    expires_at: datetime | None = None
    consent_hash: str | None = None
