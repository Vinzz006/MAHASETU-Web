from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel

class MetricCard(BaseModel):
    label: str
    value: str
    change: Optional[str] = None
    trend: Optional[str] = "up"
    badge: Optional[str] = None

class DepartmentHealth(BaseModel):
    department_id: str
    name: str
    type: str # REST API, HETEROGENEOUS JSON, APPROVAL ENGINE, LEGACY MAINFRAME
    status: str # HEALTHY, DEGRADED, FAILED
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
    status: str # FAILED, RETRYING, RESOLVED
    error_message: str
    created_at: datetime

class DashboardMetricsResponse(BaseModel):
    total_applications: int
    integration_success_rate: float
    avg_processing_time_days: float
    sla_compliance_rate: float
    active_in_flight: int
    department_health: List[DepartmentHealth]
    recent_exceptions: List[IntegrationExceptionRecord]
