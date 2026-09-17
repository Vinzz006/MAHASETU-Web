from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field

class CanonicalAddress(BaseModel):
    district: str = "Pune"
    state: str = "Maharashtra"
    pincode: Optional[str] = "411001"

class CanonicalCitizen(BaseModel):
    id: str = "CIT-001"
    name: str = "Demo Citizen"
    phone: str = "9999999999"
    dateOfBirth: str = "1998-05-12"
    address: CanonicalAddress = Field(default_factory=CanonicalAddress)
    annualIncome: Optional[int] = 180000
    employmentStatus: Optional[str] = "UNEMPLOYED"
    educationLevel: Optional[str] = "GRADUATE"

class CanonicalApplicationData(BaseModel):
    citizen: CanonicalCitizen = Field(default_factory=CanonicalCitizen)
    serviceId: str = "employment-support"
    applicationNumber: Optional[str] = None
    consentId: Optional[str] = None

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
