import hashlib
import random
from datetime import datetime, timezone

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(
    prefix="/api/police-cctns",
    tags=["MahaRakshak — Police CCTNS Citizen Digital Station"],
)

SAMPLE_POLICE_RECORDS = [
    {
        "record_id": "CCTNS-NC-MH-2026-8812",
        "record_type": "LOST_PROPERTY_REPORT (NC)",
        "citizen_name": "Rohan M. Kulkarni",
        "item_lost": "Indian Passport & Driving License",
        "police_station": "Kothrud Police Station (Pune City)",
        "digital_status": "CERTIFICATE_ISSUED",
    },
    {
        "record_id": "CCTNS-VERIF-MH-2026-4409",
        "record_type": "TENANT_VERIFICATION_CLEARANCE",
        "citizen_name": "Deepak Ramesh Jadhav",
        "item_lost": "Rental Flat Background Clearance",
        "police_station": "Andheri West Police Station (Mumbai)",
        "digital_status": "CLEARANCE_GRANTED",
    },
]


class FileLostPropertyRequest(BaseModel):
    citizen_name: str = "Pooja Shankar Deshmukh"
    contact_phone: str = "9822019283"
    item_lost: str = "Original University Degree Certificate & Aadhaar Card"
    incident_location: str = "Dadar Railway Station Central Concourse, Mumbai"
    police_station: str = "Dadar Police Station"


@router.get("/recent-records")
def get_recent_cctns_records():
    """
    Returns recent digitally issued police non-cognizable reports and verification certificates.
    """
    return {
        "portal": "MahaRakshak — Police CCTNS Citizen Digital Station",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "total_digital_records_logged": len(SAMPLE_POLICE_RECORDS),
        "police_network": "Crime and Criminal Tracking Network & Systems (CCTNS Maharashtra)",
        "records": SAMPLE_POLICE_RECORDS,
    }


@router.post("/file-lost-property")
def file_lost_property_nc_report(req: FileLostPropertyRequest):
    """
    Instantly issues an official digitally signed Non-Cognizable (NC) Lost Property Certificate.
    """
    now_iso = datetime.now(timezone.utc).isoformat()
    cctns_urn = f"CCTNS-NC-MH-2026-{random.randint(100000, 999999)}"

    sig_payload = f"{cctns_urn}:{req.citizen_name}:{req.item_lost}:{now_iso}"
    qr_signature = (
        f"0xPOLICE-CCTNS-{hashlib.sha256(sig_payload.encode()).hexdigest()[:24]}"
    )

    return {
        "status": "NC_CERTIFICATE_ISSUED_INSTANTLY",
        "cctns_reference_number": cctns_urn,
        "citizen_name": req.citizen_name,
        "item_lost": req.item_lost,
        "incident_location": req.incident_location,
        "jurisdiction_police_station": req.police_station,
        "digital_signature_hash": qr_signature,
        "legal_admissibility": "Valid for duplicate passport/SIM/license issuance under IT Act 2000 & Section 155 CrPC",
        "police_station_visit_required": "NO (100% Faceless Digital Police Station)",
        "timestamp": now_iso,
    }
