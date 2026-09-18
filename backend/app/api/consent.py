from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.consent import Consent
from backend.app.models.user import User
from backend.app.schemas.consent import ConsentRequestCreate, ConsentResponse
from backend.app.services.consent import ConsentManager
from backend.app.auth import get_current_user

router = APIRouter(prefix="/api/consents", tags=["Consent Management"])

@router.post("", response_model=ConsentResponse)
def create_consent_request(
    req: ConsentRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    consent = ConsentManager.request_consent(
        db=db,
        application_id=req.application_id,
        citizen_id=current_user.id,
        requested_by=req.requested_by,
        purpose=req.purpose,
        data_categories=req.data_categories
    )
    return consent

@router.post("/{consent_id}/approve", response_model=ConsentResponse)
def approve_consent(
    consent_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    consent = ConsentManager.approve_consent(db, consent_id, current_user.id)
    return consent

@router.post("/{consent_id}/revoke", response_model=ConsentResponse)
def revoke_consent(
    consent_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    consent = ConsentManager.revoke_consent(db, consent_id, current_user.id)
    return consent

@router.get("/application/{application_id}", response_model=ConsentResponse)
def get_consent_by_application(
    application_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    consent = db.query(Consent).filter(Consent.application_id == application_id).first()
    if not consent:
        raise HTTPException(status_code=404, detail="Consent not found for application")

    if current_user.role == "CITIZEN" and consent.citizen_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You cannot view another citizen's consent"
        )

    return consent

@router.get("/my-history", response_model=list[ConsentResponse])
def get_my_consent_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Returns the full consent and data disclosure history for the authenticated citizen."""
    consents = db.query(Consent).filter(
        Consent.citizen_id == current_user.id
    ).order_by(Consent.granted_at.desc(), Consent.id.desc()).all()
    return consents
