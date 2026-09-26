from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.consent import Consent
from backend.app.models.user import User
from backend.app.schemas.consent import (
    ConsentRequestCreate, ConsentResponse,
    ConsentRejectRequest, DataSharingLogResponse
)
from backend.app.services.consent import ConsentManager
from backend.app.auth import get_current_user, require_roles

router = APIRouter(prefix="/api/consents", tags=["Consent Management"])

@router.post("", response_model=ConsentResponse)
def create_consent_request(
    req: ConsentRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Initiates a DPDP-aligned consent request for cross-departmental data exchange."""
    consent = ConsentManager.request_consent(
        db=db,
        application_id=req.application_id,
        citizen_id=current_user.id,
        requested_by=req.requested_by,
        requesting_department=req.requesting_department or "DEPT_C",
        receiving_department=req.receiving_department or "DEPT_B",
        purpose=req.purpose,
        data_categories=req.data_categories,
        scope=req.scope
    )
    return consent

@router.post("/{consent_id}/approve", response_model=ConsentResponse)
def approve_consent(
    consent_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Citizen grants explicit consent; computes SHA-256 integrity hash."""
    consent = ConsentManager.approve_consent(db, consent_id, current_user.id)
    return consent

@router.post("/{consent_id}/reject", response_model=ConsentResponse)
def reject_consent(
    consent_id: str,
    req: ConsentRejectRequest = ConsentRejectRequest(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Citizen explicitly declines consent request."""
    consent = ConsentManager.reject_consent(db, consent_id, current_user.id, reason=req.reason or "Citizen declined")
    return consent

@router.post("/{consent_id}/revoke", response_model=ConsentResponse)
def revoke_consent(
    consent_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Citizen revokes previously granted consent in alignment with DPDP principles."""
    consent = ConsentManager.revoke_consent(db, consent_id, current_user.id)
    return consent

@router.get("/application/{application_id}", response_model=ConsentResponse)
def get_consent_by_application(
    application_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieves consent state for a specific application."""
    consent = db.query(Consent).filter(Consent.application_id == application_id).first()
    if not consent:
        raise HTTPException(status_code=404, detail="Consent not found for application")

    if current_user.role == "CITIZEN" and consent.citizen_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You cannot view another citizen's consent"
        )

    return consent

@router.get("/my-history", response_model=List[ConsentResponse])
def get_my_consent_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Returns the full consent history for the authenticated citizen."""
    consents = db.query(Consent).filter(
        Consent.citizen_id == current_user.id
    ).order_by(Consent.granted_at.desc(), Consent.id.desc()).all()
    return consents

@router.get("/disclosures", response_model=List[DataSharingLogResponse])
def get_my_data_disclosure_log(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns an itemized audit log of every inter-departmental data exchange event
    involving the citizen's personal records, showing which department accessed what attributes.
    """
    return ConsentManager.get_data_sharing_history(db, current_user.id)
