from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.auth import require_roles, get_current_user
from backend.app.models.user import User
from backend.app.services.mdm import MasterDataManagementService

router = APIRouter(prefix="/api/mdm", tags=["Master Data Management (MDM)"])

class MatchOrRegisterRequest(BaseModel):
    citizen_data: Dict[str, Any]
    source_system: str = "DEPT_A"
    source_identifier: str
    identifier_type: str = "LOCAL_DEPT_ID"

class ResolveReviewRequest(BaseModel):
    decision: str = "MERGE" # MERGE, CREATE_NEW, REJECT
    notes: Optional[str] = None

@router.get("/citizens", dependencies=[Depends(require_roles(["OFFICER", "SYSTEM_ADMIN", "AUDITOR"]))])
def list_citizen_master_records(limit: int = 50, db: Session = Depends(get_db)):
    """Returns Golden Citizen Master Records with cross-department identifier mapping."""
    return MasterDataManagementService.list_master_records(db, limit=limit)

@router.get("/citizens/{master_id}", dependencies=[Depends(require_roles(["OFFICER", "SYSTEM_ADMIN", "AUDITOR"]))])
def get_citizen_master_record(master_id: str, db: Session = Depends(get_db)):
    """Fetches a specific Golden Record and all linked source-system identifiers."""
    return MasterDataManagementService.get_master_record(db, master_id.upper())

@router.post("/match", dependencies=[Depends(require_roles(["OFFICER", "SYSTEM_ADMIN", "DEPARTMENT_A", "DEPARTMENT_B", "DEPARTMENT_C"]))])
def match_or_register_citizen(
    req: MatchOrRegisterRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Evaluates incoming departmental citizen demographic attributes using multi-attribute
    confidence scoring. Auto-links if score >= 0.85; routes to review queue if 0.50-0.84;
    provisions new Golden Record if < 0.50.
    """
    return MasterDataManagementService.match_or_register_citizen(
        db=db,
        incoming=req.citizen_data,
        source_system=req.source_system.upper(),
        source_identifier=req.source_identifier,
        identifier_type=req.identifier_type,
        actor_id=current_user.id
    )

@router.get("/reviews", dependencies=[Depends(require_roles(["OFFICER", "SYSTEM_ADMIN"]))])
def list_ambiguous_match_reviews(db: Session = Depends(get_db)):
    """Returns pending ambiguous match records awaiting human officer verification."""
    return MasterDataManagementService.list_pending_reviews(db)

@router.post("/reviews/{review_id}/resolve", dependencies=[Depends(require_roles(["OFFICER", "SYSTEM_ADMIN"]))])
def resolve_ambiguous_match(
    review_id: str,
    req: ResolveReviewRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Authorizes an officer decision (MERGE into candidate or CREATE_NEW master record)."""
    return MasterDataManagementService.resolve_review(
        db=db,
        review_id=review_id,
        decision=req.decision,
        officer_id=current_user.id,
        notes=req.notes
    )
