from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class ServiceDefinition(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    name_mr: str | None = None
    department: str
    description: str
    description_mr: str | None = None
    participating_departments: list[str]
    sla_days: int
    is_active: bool = True


class ServiceCreate(BaseModel):
    id: str
    name: str
    name_mr: str | None = None
    department: str
    description: str
    description_mr: str | None = None
    participating_departments: list[str] = Field(default_factory=list)
    sla_days: int = 7
    is_active: bool = True


class ServiceUpdate(BaseModel):
    name: str | None = None
    name_mr: str | None = None
    department: str | None = None
    description: str | None = None
    description_mr: str | None = None
    participating_departments: list[str] | None = None
    sla_days: int | None = None
    is_active: bool | None = None


class ApplicationCreate(BaseModel):
    service_id: str = "employment-support"
    citizen_name: str
    mobile: str
    dob: str
    district: str
    annual_income: int | None = 180000
    employment_status: str | None = "UNEMPLOYED"


class ApplicationSummaryResponse(BaseModel):
    id: str
    application_number: str
    citizen_id: str
    citizen_name: str
    service_id: str
    service_name: str
    status: str
    current_department: str
    rejection_reason: str | None = None
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
    citizen_data: dict[str, Any]
    rejection_reason: str | None = None
    active_consent: dict[str, Any] | None = None
    workflow_steps: list[dict[str, Any]] = []
    transactions: list[dict[str, Any]] = []
    audit_logs: list[dict[str, Any]] = []
    created_at: datetime
    updated_at: datetime
