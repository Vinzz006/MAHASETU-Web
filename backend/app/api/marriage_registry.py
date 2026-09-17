import random
import hashlib
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from fastapi import APIRouter

router = APIRouter(prefix="/api/marriage-registry", tags=["MahaBandhan — Marriage e-Registry & Joint Entitlements"])

RECENT_MARRIAGES = [
    {
        "registration_id": "MRG-PMC-2026-0814",
        "corporation": "Pune Municipal Corporation",
        "spouse_one_name": "Siddharth Anand Joshi",
        "spouse_two_name": "Priyanka Suresh Deshpande",
        "registration_date": "2026-08-28",
        "joint_ration_card_status": "AUTO_PROVISIONED",
        "pmay_joint_eligibility": "VERIFIED_ACTIVE"
    },
    {
        "registration_id": "MRG-BMC-2026-1192",
        "corporation": "Brihanmumbai Municipal Corporation",
        "spouse_one_name": "Aditya Rajesh Kadam",
        "spouse_two_name": "Neha Milind Sawant",
        "registration_date": "2026-09-01",
        "joint_ration_card_status": "AUTO_PROVISIONED",
        "pmay_joint_eligibility": "VERIFIED_ACTIVE"
    }
]

class RegisterMarriageRequest(BaseModel):
    spouse_one_name: str = "Gaurav Vilas Shinde"
    spouse_one_aadhaar_vault: str = "vault:uidai:981244510923"
    spouse_two_name: str = "Sayali Eknath Patil"
    spouse_two_aadhaar_vault: str = "vault:uidai:771209384512"
    marriage_venue: str = "Shivaji Park Cultural Hall, Dadar, Mumbai"
    corporation: str = "Brihanmumbai Municipal Corporation"

@router.get("/recent-marriages")
def get_recent_marriage_registrations():
    """
    Returns recent paperless municipal marriage registrations and auto-provisioned joint welfare entitlements.
    """
    return {
        "portal": "MahaBandhan — Marriage e-Registry & Joint Entitlements",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "total_marriages_registered": len(RECENT_MARRIAGES),
        "civil_act": "Maharashtra Regulation of Marriage Bureaus & Registration of Marriages Act 1998",
        "records": RECENT_MARRIAGES
    }

@router.post("/register-marriage")
def register_marriage_and_provision_joint_entitlements(req: RegisterMarriageRequest):
    """
    Registers a civil marriage paperlessly and provisions joint ration cards and PMAY housing rights.
    """
    now_iso = datetime.now(timezone.utc).isoformat()
    reg_id = f"MRG-MH-{random.randint(100000, 999999)}"

    sig_payload = f"{reg_id}:{req.spouse_one_name}:{req.spouse_two_name}:{now_iso}"
    cert_hash = f"0xMARRIAGE-CERT-{hashlib.sha256(sig_payload.encode()).hexdigest()[:24]}"

    return {
        "status": "MARRIAGE_DIGITALLY_REGISTERED",
        "registration_id": reg_id,
        "couple_names": f"{req.spouse_one_name} & {req.spouse_two_name}",
        "corporation": req.corporation,
        "digital_certificate_hash": cert_hash,
        "auto_provisioned_welfare": [
            "PDS MahaFood Joint Ration Family Unit generated.",
            "Pradhan Mantri Awas Yojana (PMAY) Joint Subsidy Certificate issued.",
            "Spouse nominee automatically reflected in MSRTC and state pension records."
        ],
        "zero_paperwork_guarantee": "100% Faceless with Aadhaar e-Sign & DigiLocker Delivery",
        "timestamp": now_iso
    }
