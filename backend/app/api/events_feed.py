import hashlib
import random
import time
from datetime import datetime, timedelta, timezone
from typing import Any

from backend.app.database import get_db
from backend.app.models.audit import AuditLog
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

router = APIRouter(
    prefix="/api/events", tags=["Real-Time Interoperability Event Radar"]
)

NODE_MAP = {
    "APPLICATION_CREATED": ("CITIZEN_PORTAL", "MAHASETU_HUB"),
    "CONSENT_GRANTED": ("CITIZEN_PORTAL", "MAHASETU_HUB"),
    "IDENTITY_VERIFIED": ("MAHASETU_HUB", "DEPT_A_REST"),
    "CANONICAL_TRANSFORMED": ("DEPT_A_REST", "MAHASETU_HUB"),
    "ELIGIBILITY_VERIFIED": ("MAHASETU_HUB", "DEPT_B_JSON"),
    "APPROVAL_STARTED": ("MAHASETU_HUB", "DEPT_C_SANCTION"),
    "APPLICATION_COMPLETED": ("DEPT_C_SANCTION", "CITIZEN_PORTAL"),
    "INTEGRATION_FAILED": ("MAHASETU_HUB", "DEPT_B_JSON"),
    "SLA_EXPEDITED": ("MAHASETU_HUB", "DEPT_B_JSON"),
    "GRIEVANCE_RAISED": ("CITIZEN_PORTAL", "MAHASETU_HUB"),
    "GRIEVANCE_RESOLVED": ("MAHASETU_HUB", "CITIZEN_PORTAL"),
}


@router.get("/live-feed")
def get_live_events_telemetry(limit: int = 25, db: Session = Depends(get_db)):
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(limit).all()

    telemetry: list[dict[str, Any]] = []

    for log in logs:
        action = log.action
        source, target = NODE_MAP.get(action, ("MAHASETU_HUB", "EXTERNAL_SYSTEM"))
        latency = random.randint(35, 120)
        packet_size = random.randint(640, 2450)
        p_hash = hashlib.sha256(
            f"{log.id}-{log.action}-{log.timestamp}".encode()
        ).hexdigest()[:16]

        telemetry.append(
            {
                "id": log.id,
                "event_type": log.action,
                "source_node": source,
                "target_node": target,
                "application_id": log.application_id or "MH-APP-GLOBAL",
                "actor": log.actor_id,
                "latency_ms": latency,
                "packet_size_bytes": packet_size,
                "packet_hash": f"0x{p_hash}",
                "timestamp": log.timestamp.isoformat(),
                "metadata": log.metadata_json or {},
            }
        )

    # If no logs exist, provide benchmark seed pulses
    if not telemetry:
        now = datetime.now(timezone.utc)
        benchmark_events = [
            ("APPLICATION_COMPLETED", "DEPT_C_SANCTION", "CITIZEN_PORTAL", 45),
            ("APPROVAL_STARTED", "MAHASETU_HUB", "DEPT_C_SANCTION", 78),
            ("ELIGIBILITY_VERIFIED", "MAHASETU_HUB", "DEPT_B_JSON", 92),
            ("CANONICAL_TRANSFORMED", "DEPT_A_REST", "MAHASETU_HUB", 38),
            ("IDENTITY_VERIFIED", "MAHASETU_HUB", "DEPT_A_REST", 62),
            ("CONSENT_GRANTED", "CITIZEN_PORTAL", "MAHASETU_HUB", 41),
            ("APPLICATION_CREATED", "CITIZEN_PORTAL", "MAHASETU_HUB", 50),
        ]
        for idx, (evt, src, tgt, lat) in enumerate(benchmark_events):
            t_stamp = (now - timedelta(seconds=idx * 8)).isoformat()
            telemetry.append(
                {
                    "id": f"telemetry-seed-{idx}",
                    "event_type": evt,
                    "source_node": src,
                    "target_node": tgt,
                    "application_id": "MH-APP-2026-000184",
                    "actor": "Demo System",
                    "latency_ms": lat,
                    "packet_size_bytes": 1120 + idx * 80,
                    "packet_hash": f"0x{hashlib.sha256(f'{evt}-{idx}'.encode()).hexdigest()[:16]}",
                    "timestamp": t_stamp,
                    "metadata": {"status": "SUCCESS", "protocol": "REST/JSON"},
                }
            )

    return {
        "nodes": [
            {
                "id": "CITIZEN_PORTAL",
                "label": "Citizen Portal",
                "type": "CLIENT",
                "x": 100,
                "y": 200,
            },
            {
                "id": "MAHASETU_HUB",
                "label": "MahaSetu Hub",
                "type": "HUB",
                "x": 350,
                "y": 200,
            },
            {
                "id": "DEPT_A_REST",
                "label": "Dept A (Identity)",
                "type": "DEPT_REST",
                "x": 600,
                "y": 80,
            },
            {
                "id": "DEPT_B_JSON",
                "label": "Dept B (Eligibility)",
                "type": "DEPT_JSON",
                "x": 600,
                "y": 200,
            },
            {
                "id": "DEPT_C_SANCTION",
                "label": "Dept C (Sanctions)",
                "type": "DEPT_SANCTION",
                "x": 600,
                "y": 320,
            },
            {
                "id": "LEGACY_MAINFRAME",
                "label": "Legacy Mainframe",
                "type": "LEGACY",
                "x": 350,
                "y": 380,
            },
        ],
        "active_telemetry": telemetry,
        "total_packets_processed": 14820,
        "avg_hub_latency_ms": 58.4,
        "network_status": "OPTIMAL",
    }


@router.post("/simulate-pulse")
def simulate_telemetry_pulse(db: Session = Depends(get_db)):
    """Simulates an instantaneous packet pulse across the node graph for hackathon demonstration."""
    actions = [
        "IDENTITY_VERIFIED",
        "CANONICAL_TRANSFORMED",
        "ELIGIBILITY_VERIFIED",
        "APPROVAL_STARTED",
    ]
    chosen = random.choice(actions)
    src, tgt = NODE_MAP.get(chosen, ("MAHASETU_HUB", "DEPT_B_JSON"))
    return {
        "pulse_id": f"pulse-{int(time.time() * 1000)}",
        "event_type": chosen,
        "source_node": src,
        "target_node": tgt,
        "latency_ms": random.randint(30, 85),
        "status": "DISPATCHED",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
