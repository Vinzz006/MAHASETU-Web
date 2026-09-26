import hashlib
import hmac
import json
import time
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/api/webhooks", tags=["Interoperability Webhook Mesh"])

HMAC_MASTER_SECRET = "MAHASETU_WEBHOOK_SECRET_KEY_PROD_2026"

WEBHOOK_SUBSCRIPTIONS = [
    {
        "id": "SUB-DEPT-A",
        "department": "Department A (Identity & Civil Registry)",
        "target_url": "https://dept-a.maha.gov.in/api/v1/webhooks/identity-events",
        "subscribed_events": [
            "IDENTITY_VERIFIED",
            "CONSENT_REVOKED",
            "PASSPORT_ISSUED",
        ],
        "auth_method": "HMAC-SHA256",
        "status": "ACTIVE",
        "success_rate_pct": 99.8,
        "average_latency_ms": 42,
        "last_delivery": "2026-03-03T18:45:10Z",
    },
    {
        "id": "SUB-DEPT-B",
        "department": "Department B (Labour & Eligibility Directorate)",
        "target_url": "https://dept-b.maha.gov.in/hooks/eligibility-callback",
        "subscribed_events": [
            "ELIGIBILITY_EVALUATION_REQUESTED",
            "EXCEPTION_ESCALATED",
        ],
        "auth_method": "HMAC-SHA256",
        "status": "ACTIVE",
        "success_rate_pct": 98.4,
        "average_latency_ms": 118,
        "last_delivery": "2026-03-03T19:12:05Z",
    },
    {
        "id": "SUB-DEPT-C",
        "department": "Department C (Social Welfare & DBT Sanctions)",
        "target_url": "https://dept-c.maha.gov.in/api/disbursal/webhook",
        "subscribed_events": [
            "APPLICATION_APPROVED",
            "DBT_DISBURSED",
            "PAYMENT_FAILED",
        ],
        "auth_method": "HMAC-SHA256",
        "status": "ACTIVE",
        "success_rate_pct": 99.9,
        "average_latency_ms": 65,
        "last_delivery": "2026-03-03T19:50:33Z",
    },
    {
        "id": "SUB-MAHADBT",
        "department": "MahaDBT Central Portal Federation Gateway",
        "target_url": "https://mahadbt.maharashtra.gov.in/federation/events",
        "subscribed_events": ["DBT_DISBURSED", "PASSPORT_ISSUED"],
        "auth_method": "HMAC-SHA256",
        "status": "ACTIVE",
        "success_rate_pct": 99.2,
        "average_latency_ms": 84,
        "last_delivery": "2026-03-03T20:10:12Z",
    },
]

DELIVERY_LOGS: list[dict[str, Any]] = [
    {
        "delivery_id": "DLV-2026-9011",
        "subscription_id": "SUB-DEPT-C",
        "event_type": "DBT_DISBURSED",
        "payload_snippet": '{"application_id": "MH-APP-2026-000184", "amount_inr": 25000, "utr": "RBI202603039128"}',
        "http_status": 200,
        "latency_ms": 58,
        "hmac_signature_verified": True,
        "timestamp": "2026-03-03T19:50:33Z",
        "status": "DELIVERED",
    },
    {
        "delivery_id": "DLV-2026-9012",
        "subscription_id": "SUB-DEPT-A",
        "event_type": "IDENTITY_VERIFIED",
        "payload_snippet": '{"application_id": "MH-APP-2026-000184", "aadhaar_vault_ref": "REF-5892"}',
        "http_status": 200,
        "latency_ms": 39,
        "hmac_signature_verified": True,
        "timestamp": "2026-03-03T18:45:10Z",
        "status": "DELIVERED",
    },
]


class TestWebhookDispatchRequest(BaseModel):
    subscription_id: str
    event_type: str = "INTEROP_PACKET_VERIFIED"
    sample_payload: dict[str, Any] | None = None


@router.get("/subscriptions")
def get_webhook_subscriptions():
    """
    Returns active departmental webhook subscriptions, delivery health, and telemetry.
    """
    return {
        "portal": "MahaSetu Interoperability Webhook Mesh",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "total_subscriptions": len(WEBHOOK_SUBSCRIPTIONS),
        "active_mesh_endpoints": sum(
            1 for s in WEBHOOK_SUBSCRIPTIONS if s["status"] == "ACTIVE"
        ),
        "average_mesh_latency_ms": round(
            sum(s["average_latency_ms"] for s in WEBHOOK_SUBSCRIPTIONS)
            / len(WEBHOOK_SUBSCRIPTIONS),
            1,
        ),
        "subscriptions": WEBHOOK_SUBSCRIPTIONS,
        "recent_deliveries": DELIVERY_LOGS[:10],
    }


@router.post("/dispatch-test")
def dispatch_test_webhook_event(req: TestWebhookDispatchRequest):
    """
    Simulates sending a high-security signed webhook packet to a government department.
    Computes cryptographic HMAC-SHA256 signature for verification by receiver.
    """
    sub = next(
        (s for s in WEBHOOK_SUBSCRIPTIONS if s["id"] == req.subscription_id), None
    )
    if not sub:
        raise HTTPException(status_code=404, detail="Webhook subscription not found.")

    payload = req.sample_payload or {
        "event": req.event_type,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "target_department": sub["department"],
        "service_passport": "MH-APP-2026-TEST-EVENT",
        "interop_hub_version": "v1.0.0-PROD",
        "canonical_fields_count": 8,
    }

    serialized_payload = json.dumps(payload, sort_keys=True)
    hmac_digest = hmac.new(
        HMAC_MASTER_SECRET.encode(), serialized_payload.encode(), hashlib.sha256
    ).hexdigest()

    delivery_id = f"DLV-2026-{int(time.time()) % 90000 + 10000}"
    simulated_latency = round(time.time() % 40 + 25, 1)

    log_entry = {
        "delivery_id": delivery_id,
        "subscription_id": sub["id"],
        "event_type": req.event_type,
        "payload_snippet": serialized_payload[:120] + "...",
        "http_status": 200,
        "latency_ms": simulated_latency,
        "hmac_signature_verified": True,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "status": "DELIVERED",
    }
    DELIVERY_LOGS.insert(0, log_entry)

    return {
        "status": "SUCCESS_DISPATCHED",
        "delivery_id": delivery_id,
        "target_url": sub["target_url"],
        "event_type": req.event_type,
        "http_status": 200,
        "latency_ms": simulated_latency,
        "headers_emitted": {
            "X-MahaSetu-Signature": f"sha256={hmac_digest}",
            "X-MahaSetu-Event-ID": delivery_id,
            "X-MahaSetu-Timestamp": datetime.now(timezone.utc).isoformat(),
            "Content-Type": "application/json",
        },
        "payload_delivered": payload,
        "verification_result": "HMAC_VERIFIED_AUTHENTIC",
        "circuit_breaker_status": "CLOSED (HEALTHY)",
    }
