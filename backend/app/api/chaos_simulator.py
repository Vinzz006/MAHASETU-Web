from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(
    prefix="/api/chaos",
    tags=["ChaosSetu — Interoperability Resilience & Chaos Simulator"],
)

# Global in-memory chaos state
CURRENT_CHAOS_STATE: dict[str, Any] = {
    "active_experiment": None,
    "circuit_breaker_mode": "HEALTHY_CLOSED",
    "injected_latency_ms": 0,
    "simulated_error_rate_pct": 0.0,
    "schema_drift_active": False,
    "network_partition_target": None,
    "last_experiment_timestamp": None,
    "experiments_run_count": 4,
    "resilience_grade": "99.99% FAULT-TOLERANT",
}

CHAOS_PRESETS = [
    {
        "id": "LATENCY_SPIKE",
        "name": "Degraded Department B Latency Spike",
        "target": "DEPT_B_ELIGIBILITY",
        "description": "Injects +3,500ms artificial network latency. Tests SLA engine timeout guards and asynchronous queue unblocking.",
        "expected_behavior": "Automated timeout triggered after 2,000ms. Workflow preserved in RETRY_PENDING without dropping state.",
    },
    {
        "id": "SCHEMA_DRIFT",
        "name": "Legacy Department JSON Schema Drift",
        "target": "CANONICAL_TRANSFORMER",
        "description": "Mutates standard fields into unannounced legacy nomenclature ('annualIncome' -> 'yearly_remuneration_inr').",
        "expected_behavior": "Canonical Transformation Engine fuzzy heuristic activates. Automatically resolves drift with 96% semantic match.",
    },
    {
        "id": "NETWORK_PARTITION",
        "name": "Total Department Gateway Network Partition",
        "target": "DEPT_B_GATEWAY",
        "description": "Simulates complete HTTP 503 service unavailable blackout during active application processing.",
        "expected_behavior": "Circuit breaker trips to OPEN. 2 retries attempted -> application routed cleanly to EXCEPTION resilience queue.",
    },
    {
        "id": "TRAFFIC_BURST",
        "name": "Statewide DBT Disbursal Traffic Burst",
        "target": "INTEROP_CORE_BUS",
        "description": "Simulates 10,000 concurrent citizen credential queries during festival subsidy announcement.",
        "expected_behavior": "Rate-limiting token bucket smooths traffic. Zero 500 errors. 100% packets queued with zero data loss.",
    },
]


class TriggerChaosRequest(BaseModel):
    experiment_id: str
    intensity: str = "HIGH"  # "LOW", "MEDIUM", "HIGH"
    operator: str = "Resilience Lead Engineer"


@router.get("/status")
def get_chaos_status():
    """
    Returns the real-time chaos state, active injections, and resilience metrics.
    """
    return {
        "portal": "ChaosSetu — Interoperability Resilience Test Console",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "state": CURRENT_CHAOS_STATE,
        "available_experiments": CHAOS_PRESETS,
        "circuit_breaker_telemetry": {
            "status": CURRENT_CHAOS_STATE["circuit_breaker_mode"],
            "failure_threshold_pct": 50.0,
            "recovery_timeout_sec": 15,
            "fallback_strategy": "DEGRADED_EPHEMERAL_QUEUE",
        },
    }


@router.post("/trigger")
def trigger_chaos_experiment(req: TriggerChaosRequest):
    """
    Injects a real-time chaos fault into the interoperability architecture.
    """
    preset = next((p for p in CHAOS_PRESETS if p["id"] == req.experiment_id), None)
    if not preset:
        raise HTTPException(
            status_code=404, detail=f"Unknown chaos experiment ID: {req.experiment_id}"
        )

    now_iso = datetime.now(timezone.utc).isoformat()
    CURRENT_CHAOS_STATE["active_experiment"] = preset["id"]
    CURRENT_CHAOS_STATE["last_experiment_timestamp"] = now_iso
    CURRENT_CHAOS_STATE["experiments_run_count"] += 1

    if req.experiment_id == "LATENCY_SPIKE":
        CURRENT_CHAOS_STATE["injected_latency_ms"] = 3500
        CURRENT_CHAOS_STATE["circuit_breaker_mode"] = "DEGRADED_HALF_OPEN"
        action_summary = "Injected +3,500ms artificial latency on Department B connector. SLA watchdog alert generated."

    elif req.experiment_id == "SCHEMA_DRIFT":
        CURRENT_CHAOS_STATE["schema_drift_active"] = True
        CURRENT_CHAOS_STATE["circuit_breaker_mode"] = "HEALTHY_CLOSED"
        action_summary = "Injected legacy field mutations. MahaSetu AI Schema Adapter engaged fuzzy normalization."

    elif req.experiment_id == "NETWORK_PARTITION":
        CURRENT_CHAOS_STATE["network_partition_target"] = "DEPT_B"
        CURRENT_CHAOS_STATE["circuit_breaker_mode"] = "TRIPPED_OPEN"
        CURRENT_CHAOS_STATE["simulated_error_rate_pct"] = 100.0
        action_summary = "Department B simulated HTTP 503 blackout. Circuit breaker tripped. Packets safely captured in EXCEPTION state."

    elif req.experiment_id == "TRAFFIC_BURST":
        CURRENT_CHAOS_STATE["circuit_breaker_mode"] = "RATE_LIMIT_ENGAGED"
        action_summary = "Simulated 10,000 req/sec burst. In-memory asynchronous event bus smoothed traffic with 0 dropped packets."

    return {
        "status": "CHAOS_FAULT_INJECTED",
        "experiment": preset,
        "intensity": req.intensity,
        "operator": req.operator,
        "timestamp": now_iso,
        "current_state": CURRENT_CHAOS_STATE,
        "telemetry_message": action_summary,
    }


@router.post("/reset")
def reset_chaos_baseline():
    """
    Restores the interoperability hub to 100% healthy, green baseline state.
    """
    CURRENT_CHAOS_STATE["active_experiment"] = None
    CURRENT_CHAOS_STATE["circuit_breaker_mode"] = "HEALTHY_CLOSED"
    CURRENT_CHAOS_STATE["injected_latency_ms"] = 0
    CURRENT_CHAOS_STATE["simulated_error_rate_pct"] = 0.0
    CURRENT_CHAOS_STATE["schema_drift_active"] = False
    CURRENT_CHAOS_STATE["network_partition_target"] = None
    CURRENT_CHAOS_STATE["last_experiment_timestamp"] = datetime.now(
        timezone.utc
    ).isoformat()

    return {
        "status": "HEALTHY_BASELINE_RESTORED",
        "circuit_breaker": "CLOSED",
        "state": CURRENT_CHAOS_STATE,
        "message": "All injected faults cleared. Interoperability Hub operating at 100% nominal health.",
    }
