from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel, Field

class WorkflowStepResponse(BaseModel):
    id: str
    step_name: str
    department_id: str
    status: str # PENDING, IN_PROGRESS, COMPLETED, FAILED, RETRYING, REWORK_REQUESTED, FLAGGED
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    timestamp: Optional[datetime] = None
    verifier_id: Optional[str] = None
    comments: Optional[str] = None
    rejection_reason: Optional[str] = None
    details: Optional[Dict[str, Any]] = None

class WorkflowAdvanceRequest(BaseModel):
    step_name: Optional[str] = None

class AdminReviewRequest(BaseModel):
    decision: str = Field(..., description="APPROVE or REWORK")
    comments: Optional[str] = None
    rejection_reason: Optional[str] = None

class AuditorReviewRequest(BaseModel):
    decision: str = Field(..., description="CONFIRM or FLAG")
    comments: Optional[str] = None

class ApplicationResubmitRequest(BaseModel):
    citizen_data: Optional[Dict[str, Any]] = None
    comments: Optional[str] = None

class WorkflowStatusResponse(BaseModel):
    application_id: str
    application_number: str
    current_status: str
    current_department: str
    is_completed: bool
    is_exception: bool
    steps: List[WorkflowStepResponse]
