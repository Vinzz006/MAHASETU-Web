from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class WorkflowStepResponse(BaseModel):
    id: str
    step_name: str
    department_id: str
    status: str  # PENDING, IN_PROGRESS, COMPLETED, FAILED, RETRYING, REWORK_REQUESTED, FLAGGED
    started_at: datetime | None = None
    completed_at: datetime | None = None
    timestamp: datetime | None = None
    verifier_id: str | None = None
    comments: str | None = None
    rejection_reason: str | None = None
    details: dict[str, Any] | None = None


class WorkflowAdvanceRequest(BaseModel):
    step_name: str | None = None


class AdminReviewRequest(BaseModel):
    decision: str = Field(..., description="APPROVE or REWORK")
    comments: str | None = None
    rejection_reason: str | None = None


class AuditorReviewRequest(BaseModel):
    decision: str = Field(..., description="CONFIRM or FLAG")
    comments: str | None = None


class ApplicationResubmitRequest(BaseModel):
    citizen_data: dict[str, Any] | None = None
    comments: str | None = None


class WorkflowStatusResponse(BaseModel):
    application_id: str
    application_number: str
    current_status: str
    current_department: str
    is_completed: bool
    is_exception: bool
    steps: list[WorkflowStepResponse]
