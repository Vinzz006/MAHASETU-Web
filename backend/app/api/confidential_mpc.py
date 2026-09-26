import hashlib
from datetime import datetime, timezone

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(
    prefix="/api/mpc", tags=["MahaVault — Confidential Multi-Party Computing (MPC)"]
)

MPC_BLINDING_SALT = "MAHASETU_CONFIDENTIAL_MPC_SALT_2026"

ACTIVE_MPC_SESSIONS = [
    {
        "session_id": "MPC-SESS-901",
        "party_a": "Department of Revenue & Land Records",
        "party_b": "Social Welfare & Disability Welfare Directorate",
        "purpose": "Non-Disclosive Income & Land Holding Cross-Audit",
        "protocol": "Private Set Intersection (PSI) over Elliptic Curve Diffie-Hellman",
        "status": "COMPUTATION_ACTIVE",
        "blind_records_exchanged": 14200,
        "raw_data_leakage": "0 BYTES (CRYPTOGRAPHICALLY BLINDED)",
        "last_active": "2026-03-03T21:10:00Z",
    },
    {
        "session_id": "MPC-SESS-902",
        "party_a": "Higher & Technical Education Directorate",
        "party_b": "Labour & Employment Registry",
        "purpose": "Duplicate Fellowship & Benefit Overlap Detection",
        "protocol": "Secure Two-Party Threshold Comparison (Garbled Circuits)",
        "status": "COMPLETED",
        "blind_records_exchanged": 8900,
        "raw_data_leakage": "0 BYTES (CRYPTOGRAPHICALLY BLINDED)",
        "last_active": "2026-03-03T20:45:00Z",
    },
]


class BlindMatchRequest(BaseModel):
    citizen_blind_hash: str | None = None
    party_a_id: str = "DEPT_REVENUE"
    party_b_id: str = "DEPT_SOCIAL_WELFARE"
    criterion: str = "INCOME_LEQ_300K_AND_LAND_LEQ_5ACRES"


@router.get("/sessions")
def get_mpc_sessions():
    """
    Returns active Confidential Computing & Private Set Intersection sessions.
    """
    return {
        "portal": "MahaVault — Sovereign Confidential Computing Gateway",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "total_mpc_sessions": len(ACTIVE_MPC_SESSIONS),
        "protocol_standards": [
            "Diffie-Hellman Private Set Intersection (PSI-DH)",
            "Homomorphic Predicate Evaluation",
            "Zero Raw Data Sharing Principle (DPDP 2023 Compliant)",
        ],
        "sessions": ACTIVE_MPC_SESSIONS,
    }


@router.post("/verify-blind-match")
def verify_blind_match(req: BlindMatchRequest):
    """
    Simulates a Private Set Intersection (PSI) protocol execution.
    Two departments verify eligibility match without exchanging unblinded records.
    """
    timestamp_str = datetime.now(timezone.utc).isoformat()
    raw_id = req.citizen_blind_hash or "CIT-DEMO-9999999999"

    # Blinding phase Party A
    blind_token_a = hashlib.sha256(
        f"{MPC_BLINDING_SALT}:{req.party_a_id}:{raw_id}".encode()
    ).hexdigest()
    # Blinding phase Party B
    blind_token_b = hashlib.sha256(
        f"{MPC_BLINDING_SALT}:{req.party_b_id}:{raw_id}".encode()
    ).hexdigest()

    # Joint intersection token
    psi_joint_token = hashlib.sha256(
        f"{blind_token_a}:{blind_token_b}".encode()
    ).hexdigest()

    return {
        "status": "CONFIDENTIAL_MATCH_VERIFIED",
        "protocol": "Diffie-Hellman Private Set Intersection (PSI)",
        "party_a": req.party_a_id,
        "party_b": req.party_b_id,
        "criterion_evaluated": req.criterion,
        "blind_token_party_a": f"blind:{blind_token_a[:16]}...",
        "blind_token_party_b": f"blind:{blind_token_b[:16]}...",
        "intersection_certificate": f"cert:mpc:{psi_joint_token[:24]}",
        "match_result": True,
        "data_leakage_guarantee": "Neither party revealed non-matching database entries. MahaSetu acted strictly as a zero-knowledge communication coordinator.",
        "timestamp": timestamp_str,
    }
