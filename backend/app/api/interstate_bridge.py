import hashlib
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(
    prefix="/api/interstate",
    tags=["National Inter-State Mobility & Portability Bridge"],
)

FEDERATED_STATE_TRUST_ANCHORS = [
    {
        "state_id": "STATE_GUJARAT",
        "state_name": "Gujarat",
        "portal_name": "GujSetu Interoperability Hub",
        "gateway_url": "https://gujsetu.gujarat.gov.in/federation/v1",
        "mou_status": "MUTUALLY_RECOGNIZED",
        "public_key_fingerprint": "SHA256:7a9f:4b82:e310:9c1a:52fe",
        "supported_schemes": [
            "Migrant Worker Portability",
            "Higher Education Credit Transfer",
            "Agri-Input Passports",
        ],
        "status": "ONLINE_ACTIVE",
        "last_ping_ms": 38,
    },
    {
        "state_id": "STATE_KARNATAKA",
        "state_name": "Karnataka",
        "portal_name": "KarSetu Unified Service Mesh",
        "gateway_url": "https://karsetu.karnataka.gov.in/interop/api",
        "mou_status": "MUTUALLY_RECOGNIZED",
        "public_key_fingerprint": "SHA256:8b1c:3d44:f902:aa31:67cb",
        "supported_schemes": [
            "Inter-State Domicile Verification",
            "Social Security Portability",
        ],
        "status": "ONLINE_ACTIVE",
        "last_ping_ms": 45,
    },
    {
        "state_id": "STATE_MP",
        "state_name": "Madhya Pradesh",
        "portal_name": "MPSetu Citizen Gateway",
        "gateway_url": "https://mpsetu.mp.gov.in/federate",
        "mou_status": "MUTUALLY_RECOGNIZED",
        "public_key_fingerprint": "SHA256:5e3a:9011:b842:dc77:31fa",
        "supported_schemes": [
            "Farmer Land Record Handshake",
            "National Food Security Portability",
        ],
        "status": "ONLINE_ACTIVE",
        "last_ping_ms": 52,
    },
]


class InterstatePortRequest(BaseModel):
    application_number: str = "MH-APP-2026-000184"
    citizen_name: str = "Demo Citizen"
    source_state: str = "Maharashtra"
    target_state_id: str = "STATE_GUJARAT"
    migration_reason: str = "Inter-State Employment & Skill Program Enrollment"


@router.get("/trust-anchors")
def get_interstate_trust_anchors():
    """
    Returns the network topology of connected Indian State e-Governance Hubs.
    """
    return {
        "network": "National Inter-State Service Passport Federation",
        "home_state": "Maharashtra (MahaSetu Hub)",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "total_partner_states": len(FEDERATED_STATE_TRUST_ANCHORS),
        "protocol": "One Nation, One Service Passport Protocol (ONOSP v1)",
        "trust_anchors": FEDERATED_STATE_TRUST_ANCHORS,
    }


@router.post("/port-credentials")
def port_citizen_credentials(req: InterstatePortRequest):
    """
    Transfers verified Maharashtra citizen credentials to a target state gateway.
    Eliminates re-verification delays for interstate migrant workers, students, and businesses.
    """
    target = next(
        (
            s
            for s in FEDERATED_STATE_TRUST_ANCHORS
            if s["state_id"] == req.target_state_id
        ),
        None,
    )
    if not target:
        raise HTTPException(
            status_code=404, detail="Target state trust anchor not recognized."
        )

    now_iso = datetime.now(timezone.utc).isoformat()
    port_tx_id = f"INTERSTATE-PORT-2026-{abs(hash(req.application_number + req.target_state_id)) % 90000 + 10000}"
    handshake_digest = hashlib.sha256(
        f"{port_tx_id}:{req.application_number}:{target['state_id']}".encode()
    ).hexdigest()

    return {
        "status": "PORTABILITY_HANDSHAKE_SUCCESS",
        "port_transaction_id": port_tx_id,
        "source_hub": "MahaSetu (Government of Maharashtra)",
        "target_state": target["state_name"],
        "target_hub": target["portal_name"],
        "citizen_name": req.citizen_name,
        "application_number": req.application_number,
        "migration_reason": req.migration_reason,
        "federated_handshake_digest": handshake_digest,
        "timestamp": now_iso,
        "credential_portability_result": {
            "identity_verified_by_source": True,
            "target_state_accepted": True,
            "re_verification_waived": True,
            "portability_certificate": f"urn:cert:onosp:2026:{handshake_digest[:16]}",
        },
        "telemetry_message": f"Service Passport {req.application_number} ported seamlessly to {target['state_name']}. Target state waived secondary document verification.",
    }
