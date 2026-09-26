from typing import List, Optional, Any, Dict
from datetime import datetime
from pydantic import BaseModel, Field

class ConsentRequestCreate(BaseModel):
    application_id: str
    requested_by: str = "Employment Department (DEPT_C)"
    requesting_department: Optional[str] = "DEPT_C"
    receiving_department: Optional[str] = "DEPT_B"
    purpose: str = "Eligibility verification under Maharashtra Employment Support Scheme"
    data_categories: List[str] = [
        "Identity information (Name, DOB from Department A)",
        "Address & Residence information (District verification)",
        "Eligibility & Socio-economic classification (Department B)"
    ]
    scope: Optional[List[str]] = [
        "READ_IDENTITY_DEMOGRAPHICS",
        "READ_DOMICILE_STATUS",
        "READ_INCOME_BRACKET"
    ]

class ConsentActionRequest(BaseModel):
    consent_id: str

class ConsentRejectRequest(BaseModel):
    reason: Optional[str] = "Citizen declined consent"

class ConsentResponse(BaseModel):
    id: str
    consent_number: str
    application_id: str
    citizen_id: str
    requested_by: str
    requesting_department: Optional[str] = None
    receiving_department: Optional[str] = None
    purpose: str
    data_categories: List[str]
    scope: Optional[List[str]] = None
    status: str # REQUESTED, AUTHORIZED, DECLINED, REVOKED, EXPIRED
    granted_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    revocation_at: Optional[datetime] = None
    consent_version: Optional[str] = "v1.0"
    consent_hash: Optional[str] = None

class DataSharingLogResponse(BaseModel):
    id: str
    consent_id: Optional[str] = None
    application_id: Optional[str] = None
    requesting_dept: str
    receiving_dept: str
    data_scope_accessed: List[str]
    purpose: str
    status: str
    reason: Optional[str] = None
    correlation_id: Optional[str] = None
    timestamp: str
