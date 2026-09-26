import hashlib
from datetime import datetime, timedelta, timezone

from backend.app.models.application import Application
from backend.app.models.consent import Consent
from backend.app.services.audit import create_audit_log
from fastapi import HTTPException, status
from sqlalchemy.orm import Session


class ConsentManager:
    """
    Manages citizen consent lifecycle and enforces consent validation before
    any inter-department data exchange can take place.
    """

    @classmethod
    def request_consent(
        cls,
        db: Session,
        application_id: str,
        citizen_id: str,
        requested_by: str = "Employment Department (DEPT_C)",
        purpose: str = "Eligibility verification under Maharashtra Employment Support Scheme",
        data_categories: list[str] | None = None,
    ) -> Consent:
        if data_categories is None:
            data_categories = [
                "Identity Information (Name, Date of Birth, District from Department A)",
                "Address & Domicile Proof (Maharashtra Resident Verification)",
                "Socio-Economic & Income Classification (Department B)",
            ]

        # Generate unique consent number: CON-2026-XXXXXX
        now_utc = datetime.now(timezone.utc)
        suffix = abs(hash(f"{application_id}-{now_utc.isoformat()}")) % 900000 + 100000
        consent_num = f"CON-2026-{suffix}"

        consent = Consent(
            consent_number=consent_num,
            application_id=application_id,
            citizen_id=citizen_id,
            requested_by=requested_by,
            purpose=purpose,
            data_categories=data_categories,
            status="REQUESTED",
            expires_at=now_utc.replace(tzinfo=None) + timedelta(days=90),
        )
        db.add(consent)
        db.commit()
        db.refresh(consent)

        create_audit_log(
            db=db,
            actor_id=citizen_id,
            action="CONSENT_REQUESTED",
            resource="CONSENT",
            application_id=application_id,
            metadata={"consent_number": consent_num, "requested_by": requested_by},
        )

        return consent

    @classmethod
    def approve_consent(cls, db: Session, consent_id: str, citizen_id: str) -> Consent:
        consent = db.query(Consent).filter(Consent.id == consent_id).first()
        if not consent:
            raise HTTPException(status_code=404, detail="Consent record not found")

        if consent.citizen_id != citizen_id:
            raise HTTPException(
                status_code=403, detail="Unauthorized: You cannot approve this consent"
            )

        consent.status = "AUTHORIZED"
        consent.granted_at = datetime.now(timezone.utc).replace(tzinfo=None)
        # Generate tamper-evident cryptographic hash simulation
        raw_sig = f"{consent.consent_number}:{consent.application_id}:{consent.granted_at.isoformat()}:{citizen_id}"
        consent.consent_hash = hashlib.sha256(raw_sig.encode()).hexdigest()

        # Update application status
        app = (
            db.query(Application)
            .filter(Application.id == consent.application_id)
            .first()
        )
        if app and app.status == "APPLICATION_CREATED":
            app.status = "CONSENT_GRANTED"

        db.commit()
        db.refresh(consent)

        create_audit_log(
            db=db,
            actor_id=citizen_id,
            action="CONSENT_GRANTED",
            resource="CONSENT",
            application_id=consent.application_id,
            metadata={
                "consent_number": consent.consent_number,
                "consent_hash": consent.consent_hash,
                "status": "AUTHORIZED",
            },
        )

        return consent

    @classmethod
    def revoke_consent(cls, db: Session, consent_id: str, citizen_id: str) -> Consent:
        consent = db.query(Consent).filter(Consent.id == consent_id).first()
        if not consent:
            raise HTTPException(status_code=404, detail="Consent record not found")

        if consent.citizen_id != citizen_id:
            raise HTTPException(status_code=403, detail="Unauthorized")

        consent.status = "REVOKED"
        db.commit()
        db.refresh(consent)

        create_audit_log(
            db=db,
            actor_id=citizen_id,
            action="CONSENT_REVOKED",
            resource="CONSENT",
            application_id=consent.application_id,
            metadata={"consent_number": consent.consent_number, "status": "REVOKED"},
        )

        return consent

    @classmethod
    def validate_consent(cls, db: Session, application_id: str) -> bool:
        """Enforces that an active, AUTHORIZED consent exists before any data exchange."""
        consent = (
            db.query(Consent)
            .filter(
                Consent.application_id == application_id, Consent.status == "AUTHORIZED"
            )
            .first()
        )

        if not consent:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Interoperability Error: Protected information exchange blocked. Valid citizen consent has not been granted.",
            )

        now_naive = datetime.now(timezone.utc).replace(tzinfo=None)
        exp = (
            consent.expires_at.replace(tzinfo=None)
            if consent.expires_at and consent.expires_at.tzinfo
            else consent.expires_at
        )
        if exp and exp < now_naive:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Interoperability Error: Citizen consent has expired.",
            )

        return True
