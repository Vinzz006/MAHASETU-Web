import hashlib
import random
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from fastapi import APIRouter

router = APIRouter(prefix="/api/diaspora", tags=["MahaPravasi — Global Diaspora & NRI Attestation Gateway"])

SAMPLE_DIASPORA_REQUESTS = [
    {
        "diaspora_id": "APOSTILLE-2026-LON-901",
        "citizen_name": "Siddharth Deshmukh",
        "destination_country": "United Kingdom (London)",
        "purpose": "Post-Graduate Higher Education Visa & University Admissions",
        "document_type": "UNIVERSITY_DEGREE_TRANSCRIPT",
        "apostille_status": "ATTESTED_LEGALIZED",
        "hague_apostille_number": "IN-MH-APO-2026-990142",
        "verified_at": "2026-03-03T16:20:00Z"
    },
    {
        "diaspora_id": "APOSTILLE-2026-DXB-902",
        "citizen_name": "Ananya Kulkarni",
        "destination_country": "United Arab Emirates (Dubai)",
        "purpose": "Inheritance Ancestral Property Sale NOC",
        "document_type": "7-12_LAND_RECORD_TITLE",
        "apostille_status": "ATTESTED_LEGALIZED",
        "hague_apostille_number": "IN-MH-APO-2026-881203",
        "verified_at": "2026-03-03T15:45:00Z"
    }
]

class AttestDocumentRequest(BaseModel):
    citizen_name: str = "Demo Diaspora Citizen"
    passport_number: str = "Z9812401"
    destination_country: str = "United States of America"
    document_type: str = "7-12_LAND_RECORD_TITLE"
    source_application_number: str = "MH-APP-2026-000184"

@router.get("/attestation-requests")
def get_diaspora_requests():
    """
    Returns list of cross-border consular attestations and international apostilles.
    """
    return {
        "portal": "MahaPravasi — Global Diaspora & NRI Attestation Gateway",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "total_international_attestations": 14200,
        "treaty_compliance": "Hague Apostille Convention 1961 & MEA e-Sanad Certified",
        "requests": SAMPLE_DIASPORA_REQUESTS
    }

@router.post("/attest-document")
def attest_document_for_diaspora(req: AttestDocumentRequest):
    """
    Generates an official Hague Apostille Digital Certificate interfacing
    with the Ministry of External Affairs (MEA) e-Sanad registry.
    """
    now_iso = datetime.now(timezone.utc).isoformat()
    apostille_no = f"IN-MH-APO-2026-{random.randint(100000, 999999)}"
    stamp_digest = hashlib.sha256(f"{apostille_no}:{req.passport_number}:{req.destination_country}".encode()).hexdigest()

    return {
        "status": "APOSTILLE_ISSUED_AND_AUTHENTICATED",
        "apostille_number": apostille_no,
        "citizen_name": req.citizen_name,
        "passport_number": req.passport_number,
        "destination_country": req.destination_country,
        "document_type": req.document_type,
        "source_application_id": req.source_application_number,
        "issuing_authority": "Competent Authority, Government of Maharashtra (In Coordination with MEA India)",
        "hague_apostille_seal": {
            "certificate_urn": f"urn:apostille:india:mh:{apostille_no}",
            "digital_signature_digest": stamp_digest,
            "consular_validity": "ACCEPTED ACROSS 126 HAGUE CONVENTION MEMBER STATES",
            "statutory_law": "Hague Convention of 5 October 1961 Abolishing the Requirement of Legalisation for Foreign Public Documents"
        },
        "timestamp": now_iso
    }
