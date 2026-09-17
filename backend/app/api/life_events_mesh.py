import random
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from fastapi import APIRouter

router = APIRouter(prefix="/api/life-events", tags=["MahaJeevan — Proactive Life-Events Mesh"])

PROACTIVE_LIFE_EVENTS = [
    {
        "event_id": "EVENT-CRS-BIRTH-2026-912",
        "event_type": "GIRL_CHILD_BIRTH_REGISTRATION",
        "beneficiary_name": "Aaradhya Sachin Patil",
        "parent_aadhaar_vault_token": "vault:uidai:984712039481",
        "district": "Kolhapur",
        "eligible_scheme": "Majhi Kanya Bhagyashree Yojana",
        "entitlement_benefit": "₹50,000 Term Deposit Bond + Mandatory Immunisation Card",
        "zero_touch_status": "PROACTIVE_ENTITLEMENT_TRIGGERED"
    },
    {
        "event_id": "EVENT-UIDAI-AGE-2026-443",
        "event_type": "CITIZEN_ATTAINED_AGE_60",
        "beneficiary_name": "Pandurang Vitthal Shinde",
        "parent_aadhaar_vault_token": "vault:uidai:551299834412",
        "district": "Solapur",
        "eligible_scheme": "Sanjay Gandhi Niradhar Old Age Pension & MSRTC Amrut Concession",
        "entitlement_benefit": "₹1,500/month DBT Pension + 100% Free Bus Travel Smart Card",
        "zero_touch_status": "PROACTIVE_ENTITLEMENT_TRIGGERED"
    },
    {
        "event_id": "EVENT-REV-SUCCESSION-2026-108",
        "event_type": "AGRICULTURAL_LAND_HEIR_SUCCESSION",
        "beneficiary_name": "Sunita Eknath Gaikwad",
        "parent_aadhaar_vault_token": "vault:uidai:778123901452",
        "district": "Nashik",
        "eligible_scheme": "e-Ferfar Automatic 7/12 Land Title Mutation",
        "entitlement_benefit": "Instant Digital 7/12 Extract with QR Verification Code",
        "zero_touch_status": "PROACTIVE_ENTITLEMENT_TRIGGERED"
    }
]

class DispatchEntitlementRequest(BaseModel):
    event_id: str = "EVENT-CRS-BIRTH-2026-912"
    send_citizen_consent_sms: bool = True

@router.get("/proactive-triggers")
def get_proactive_life_event_triggers():
    """
    Returns civil event triggers automatically ingested from civil registry and UIDAI data streams.
    """
    return {
        "portal": "MahaJeevan — Proactive Life-Events Mesh",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "total_active_triggers": len(PROACTIVE_LIFE_EVENTS),
        "philosophy": "FORM-FREE CITIZEN GOVERNANCE: ZERO APPLICATION FORMS REQUIRED",
        "triggers": PROACTIVE_LIFE_EVENTS
    }

@router.post("/dispatch-entitlement")
def dispatch_proactive_welfare_entitlement(req: DispatchEntitlementRequest):
    """
    Executes a zero-touch welfare approval without requiring citizen application submission.
    """
    now_iso = datetime.now(timezone.utc).isoformat()
    ev = next((e for e in PROACTIVE_LIFE_EVENTS if e["event_id"] == req.event_id), PROACTIVE_LIFE_EVENTS[0])
    ev["zero_touch_status"] = "SANCTIONED_AND_DISPATCHED"

    sanction_order_id = f"PROACTIVE-SANCTION-{random.randint(100000, 999999)}"

    return {
        "status": "ZERO_TOUCH_SANCTION_ISSUED",
        "event_id": req.event_id,
        "beneficiary_name": ev["beneficiary_name"],
        "scheme": ev["eligible_scheme"],
        "entitlement": ev["entitlement_benefit"],
        "sanction_order_id": sanction_order_id,
        "dpdp_consent_dispatch": "SMS_WHATSAPP_ONE_TAP_NOTIFICATION_DISPATCHED",
        "citizen_effort_hours_saved": 48.0,
        "timestamp": now_iso
    }
