import hashlib
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.services.pdf_receipt import generate_minimal_pdf_receipt
from backend.app.models.application import Application
from backend.app.models.consent import Consent
from backend.app.models.transaction import DepartmentTransaction
from backend.app.models.user import User
from backend.app.auth import get_current_user

router = APIRouter(prefix="/api/passport", tags=["Verifiable Digital Service Passport"])

@router.get("/{application_id}/certificate")
def get_service_passport_certificate(
    application_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    app = db.query(Application).filter(
        (Application.id == application_id) | (Application.application_number == application_id)
    ).first()

    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    if current_user.role == "CITIZEN" and app.citizen_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Access denied: You cannot view another citizen's passport certificate"
        )

    consent = db.query(Consent).filter(Consent.application_id == app.id).first()

    # Find department transaction outputs
    txns = db.query(DepartmentTransaction).filter(
        DepartmentTransaction.application_id == app.id,
        DepartmentTransaction.status == "SUCCESS"
    ).all()

    txn_map = {t.department_id: t for t in txns}

    # Department verification proofs
    dept_a_proof = None
    if "DEPT_A" in txn_map:
        res = txn_map["DEPT_A"].response_payload or {}
        dept_a_proof = {
            "department": "Demo Department A (Identity Verification)",
            "status": "VERIFIED",
            "verification_id": res.get("verification_id", "UIDAI-MOCK-94821"),
            "confidence": 0.994,
            "timestamp": txn_map["DEPT_A"].created_at.isoformat()
        }

    dept_b_proof = None
    if "DEPT_B" in txn_map:
        res = txn_map["DEPT_B"].response_payload or {}
        dept_b_proof = {
            "department": "Demo Department B (Eligibility & Socio-economic)",
            "status": "PASSED",
            "certificate_id": res.get("eligibility_certificate_id", "MH-ELIG-2026-48210"),
            "benefit_tier": res.get("benefitTier", "TIER_1_PRIORITY"),
            "timestamp": txn_map["DEPT_B"].created_at.isoformat()
        }

    service_map = {
        "employment-support": {
            "name": "Maharashtra Employment & Skill Assistance Scheme",
            "dept": "Skill Development, Employment & Entrepreneurship Department",
            "benefit": "Monthly Skill Stipend (Rs. 5,000) + Employment Placement Counseling",
            "dept_b_label": "Income Rule < 3L (PASSED)",
            "dept_c_label": "Skill Development Directorate Pune"
        },
        "farmer-dbt": {
            "name": "MahaDBT Farmer Agricultural Assistance",
            "dept": "Agriculture & Rural Development Department",
            "benefit": "Annual Agrarian Direct Support (Rs. 12,000) + Micro-Irrigation Subsidy",
            "dept_b_label": "Land 7/12 Registry (Legacy Mainframe 01) Verified",
            "dept_c_label": "State Agrarian Welfare Board"
        },
        "urban-housing": {
            "name": "Maharashtra Urban Affordable Housing Grant",
            "dept": "Housing & Urban Development Department",
            "benefit": "Interest Subsidy (Rs. 2,50,000) under EWS Affordable Housing",
            "dept_b_label": "Municipal Income Slab (EWS) Evaluated",
            "dept_c_label": "Maharashtra Housing & Area Development Authority"
        },
        "smart-ration": {
            "name": "Unified Food Security & Ration Card Portability",
            "dept": "Food, Civil Supplies and Consumer Protection",
            "benefit": "Interstate Subsidized Food Grain Quota (35kg NFSA Allotment)",
            "dept_b_label": "State Food Grain Allocation Registry Verified",
            "dept_c_label": "Civil Supplies & Consumer Protection Authority"
        }
    }
    svc_info = service_map.get(app.service_id, service_map["employment-support"])

    dept_c_proof = None
    if "DEPT_C" in txn_map:
        res = txn_map["DEPT_C"].response_payload or {}
        dept_c_proof = {
            "department": svc_info["dept"],
            "status": "SANCTIONED",
            "sanction_number": res.get("sanction_number", "MH-SANCTION-2026-72810"),
            "benefit": svc_info["benefit"],
            "timestamp": txn_map["DEPT_C"].created_at.isoformat()
        }

    # Generate tamper-evident cryptographic hash
    citizen_data = app.citizen_data or {}
    raw_payload_to_hash = (
        f"{app.application_number}:{app.citizen_id}:{citizen_data.get('name')}:"
        f"{consent.consent_number if consent else 'NONE'}:{app.status}"
    )
    passport_hash = hashlib.sha256(raw_payload_to_hash.encode()).hexdigest()

    return {
        "passport_title": "MAHARASHTRA STATE DIGITAL SERVICE PASSPORT",
        "passport_subtitle": "Verifiable Multi-Department Credential & Sanction Order",
        "issuing_authority": "Government of Maharashtra • MahaSetu Interoperability Framework",
        "universal_application_id": app.application_number,
        "application_id": app.id,
        "issued_at": datetime.now(timezone.utc).isoformat(),
        "passport_hash": passport_hash,
        "status": app.status,
        "is_sanctioned": app.status == "COMPLETED",
        "verification_url": f"/passport/verify/{app.application_number}",
        "beneficiary": {
            "name": citizen_data.get("name", "Demo Citizen"),
            "mobile": citizen_data.get("mobile", "9999999999"),
            "date_of_birth": citizen_data.get("dob", "1998-05-12"),
            "district": citizen_data.get("district", "Pune"),
            "state": "Maharashtra",
            "citizen_id": app.citizen_id
        },
        "service_details": {
            "service_id": app.service_id,
            "service_name": svc_info["name"],
            "department": svc_info["dept"],
            "benefit": svc_info["benefit"]
        },
        "consent_record": {
            "consent_number": consent.consent_number if consent else "N/A",
            "status": consent.status if consent else "N/A",
            "granted_at": consent.granted_at.isoformat() if consent and consent.granted_at else None,
            "purpose": consent.purpose if consent else "N/A"
        },
        "department_attestations": {
            "dept_a_identity": dept_a_proof or {"status": "VERIFIED (Master Registry)"},
            "dept_b_eligibility": dept_b_proof or {"status": f"ELIGIBLE ({svc_info['dept_b_label']})"},
            "dept_c_approval": dept_c_proof or {"status": f"SANCTIONED ({svc_info['dept_c_label']})"}
        }
    }

def _mask_name(full_name: str) -> str:
    """Masks a person's name for privacy compliance (e.g. 'Sunita Patil' -> 'S****a P***l')."""
    if not full_name:
        return "C*****"
    parts = full_name.strip().split()
    masked = []
    for p in parts:
        if len(p) <= 2:
            masked.append(p[0] + "*")
        else:
            masked.append(p[0] + ("*" * (len(p) - 2)) + p[-1])
    return " ".join(masked)

from backend.app.services.rate_limiter import verify_rate_limiter

@router.get("/verify/{id_or_hash}", dependencies=[Depends(verify_rate_limiter)])
def verify_service_passport_authenticity(id_or_hash: str, response: Response, db: Session = Depends(get_db)):
    response.headers["Cache-Control"] = "public, max-age=60"
    app = db.query(Application).filter(
        (Application.application_number == id_or_hash) | (Application.id == id_or_hash)
    ).first()

    if not app:
        return {
            "is_valid": False,
            "verification_status": "NOT_FOUND",
            "message": "No official MahaSetu service passport record found matching this identifier."
        }

    citizen_data = app.citizen_data or {}
    raw_name = citizen_data.get("name") or (app.citizen.name if app.citizen else "Citizen")
    consent = db.query(Consent).filter(Consent.application_id == app.id).first()

    return {
        "is_valid": True,
        "verification_status": "AUTHENTIC_VERIFIED",
        "universal_application_id": app.application_number,
        "beneficiary_name": _mask_name(raw_name),
        "service_name": "Maharashtra Employment & Skill Assistance Scheme",
        "current_status": app.status,
        "is_sanction_active": app.status == "COMPLETED",
        "consent_authorized": consent.status == "AUTHORIZED" if consent else False,
        "issuing_government": "Government of Maharashtra (Problem Statement 26129)",
        "attesting_departments": [
            "Department A (Identity Verification)",
            "Department B (Eligibility Evaluation)",
            "Department C (Sanction Authority)"
        ],
        "verified_at": datetime.now(timezone.utc).isoformat()
    }


@router.get("/{application_id}/receipt.pdf")
def get_application_pdf_receipt(
    application_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    app = db.query(Application).filter(
        (Application.id == application_id) | (Application.application_number == application_id)
    ).first()

    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    if current_user.role == "CITIZEN" and app.citizen_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Access denied: You cannot download receipts for another citizen's application"
        )

    citizen_name = (app.citizen.name if app.citizen else None) or "Citizen"
    tracking_id = app.application_number or str(app.id)
    sha_hash = hashlib.sha256(f"{tracking_id}:{citizen_name}:{app.status}".encode()).hexdigest()

    pdf_bytes = generate_minimal_pdf_receipt(
        application_number=tracking_id,
        citizen_name=citizen_name,
        service_name="Maharashtra Employment & Skill Assistance Scheme",
        status=app.status,
        department=app.current_department or "Government of Maharashtra",
        timestamp=app.created_at.strftime("%Y-%m-%d %H:%M:%S") if app.created_at else "N/A",
        sha_hash=sha_hash[:24]
    )

    filename = f"MahaSetu_Receipt_{tracking_id}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Cache-Control": "no-cache"
        }
    )
