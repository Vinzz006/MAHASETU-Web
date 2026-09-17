from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

class ServiceDefinition(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    name_mr: Optional[str] = None
    department: str
    description: str
    description_mr: Optional[str] = None
    participating_departments: List[str]
    sla_days: int
    is_active: bool = True

class ServiceCreate(BaseModel):
    id: str
    name: str
    name_mr: Optional[str] = None
    department: str
    description: str
    description_mr: Optional[str] = None
    participating_departments: List[str] = Field(default_factory=list)
    sla_days: int = 7
    is_active: bool = True

class ServiceUpdate(BaseModel):
    name: Optional[str] = None
    name_mr: Optional[str] = None
    department: Optional[str] = None
    description: Optional[str] = None
    description_mr: Optional[str] = None
    participating_departments: Optional[List[str]] = None
    sla_days: Optional[int] = None
    is_active: Optional[bool] = None

class ApplicationCreate(BaseModel):
    service_id: str = "employment-support"
    citizen_name: str
    mobile: str
    dob: str
    district: str
    annual_income: Optional[int] = 180000
    employment_status: Optional[str] = "UNEMPLOYED"

class ApplicationSummaryResponse(BaseModel):
    id: str
    application_number: str
    citizen_id: str
    citizen_name: str
    service_id: str
    service_name: str
    status: str
    current_department: str
    rejection_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class ApplicationDetailResponse(BaseModel):
    id: str
    application_number: str
    citizen_id: str
    citizen_name: str
    citizen_mobile: str
    service_id: str
    service_name: str
    status: str
    current_department: str
    citizen_data: Dict[str, Any]
    rejection_reason: Optional[str] = None
    active_consent: Optional[Dict[str, Any]] = None
    workflow_steps: List[Dict[str, Any]] = []
    transactions: List[Dict[str, Any]] = []
    audit_logs: List[Dict[str, Any]] = []
    created_at: datetime
    updated_at: datetime
