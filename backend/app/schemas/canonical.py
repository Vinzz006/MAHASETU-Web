from pydantic import BaseModel, Field


class CanonicalAddress(BaseModel):
    district: str = "Pune"
    state: str = "Maharashtra"
    pincode: str | None = "411001"


class CanonicalCitizen(BaseModel):
    id: str = "CIT-001"
    name: str = "Demo Citizen"
    phone: str = "9999999999"
    dateOfBirth: str = "1998-05-12"
    address: CanonicalAddress = Field(default_factory=CanonicalAddress)
    annualIncome: int | None = 180000
    employmentStatus: str | None = "UNEMPLOYED"
    educationLevel: str | None = "GRADUATE"


class CanonicalApplicationData(BaseModel):
    citizen: CanonicalCitizen = Field(default_factory=CanonicalCitizen)
    serviceId: str = "employment-support"
    applicationNumber: str | None = None
    consentId: str | None = None


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
