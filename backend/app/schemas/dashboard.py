from datetime import datetime

from pydantic import BaseModel


class MetricCard(BaseModel):
    label: str
    value: str
    change: str | None = None
    trend: str | None = "up"
    badge: str | None = None


class DepartmentHealth(BaseModel):
    department_id: str
    name: str
    type: str  # REST API, HETEROGENEOUS JSON, APPROVAL ENGINE, LEGACY MAINFRAME
    status: str  # HEALTHY, DEGRADED, FAILED
    requests_count: int
    success_rate: float
    avg_latency_ms: int
    last_sync: str
    error_count: int


class IntegrationExceptionRecord(BaseModel):
    id: str
    application_id: str
    application_number: str
    department_id: str
    operation: str
    retry_count: int
    status: str  # FAILED, RETRYING, RESOLVED
    error_message: str
    created_at: datetime


class DashboardMetricsResponse(BaseModel):
    total_applications: int
    integration_success_rate: float
    avg_processing_time_days: float
    sla_compliance_rate: float
    active_in_flight: int
    department_health: list[DepartmentHealth]
    recent_exceptions: list[IntegrationExceptionRecord]
