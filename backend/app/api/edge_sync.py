import time
import random
from typing import List, Dict, Any
from pydantic import BaseModel
from fastapi import APIRouter

router = APIRouter(prefix="/api/edge-sync", tags=["Gramin Offline Edge Sync"])

class BatchSyncRequest(BaseModel):
    center_id: str
    taluka_name: str
    district_name: str
    offline_packets_count: int = 5

EDGE_CENTERS = [
    {
        "center_id": "CSC-GAD-012",
        "name": "Bhamragad Setu Suvidha Kendra",
        "taluka": "Bhamragad",
        "district": "Gadchiroli",
        "connectivity": "OFFLINE_QUEUED",
        "pending_offline_applications": 8,
        "last_sync": "4 hours ago",
        "hardware": "MahaSetu Micro-Edge Appliance v1.2"
    },
    {
        "center_id": "CSC-NDB-004",
        "name": "Dhadgaon Tribal Assistance Center",
        "taluka": "Dhadgaon",
        "district": "Nandurbar",
        "connectivity": "ONLINE_SYNCED",
        "pending_offline_applications": 0,
        "last_sync": "Just now",
        "hardware": "MahaSetu Micro-Edge Appliance v1.2"
    },
    {
        "center_id": "CSC-AMR-009",
        "name": "Chikhaldara Hill Agro-Setu Center",
        "taluka": "Chikhaldara",
        "district": "Amravati",
        "connectivity": "ONLINE_SYNCED",
        "pending_offline_applications": 0,
        "last_sync": "12 mins ago",
        "hardware": "MahaSetu Micro-Edge Appliance v1.2"
    }
]

@router.get("/status")
def get_edge_sync_status():
    return {
        "network_mode": "STORE_AND_FORWARD_RESILIENT",
        "active_edge_centers": len(EDGE_CENTERS),
        "centers": EDGE_CENTERS,
        "total_offline_processed": 1420,
        "deduplication_engine": "CANONICAL_HASH_MATCH",
        "conflict_rate": "0.00%"
    }

@router.post("/batch-upload")
def simulate_batch_upload(req: BatchSyncRequest):
    """
    Simulates rural batch store-and-forward sync into central Canonical Hub.
    Deduplicates records and validates DPDP consent proofs.
    """
    time.sleep(0.3)
    processed = []
    for i in range(req.offline_packets_count):
        app_num = f"MH-APP-RURAL-{random.randint(10000, 99999)}"
        processed.append({
            "packet_id": f"PKT-EDGE-{i+1:03d}",
            "generated_application_number": app_num,
            "status": "INGESTED_TO_CANONICAL_HUB",
            "deduplication_result": "NO_CONFLICT",
            "consent_validated": True
        })

    return {
        "sync_status": "BATCH_SYNCHRONIZATION_COMPLETE",
        "center_id": req.center_id,
        "taluka": req.taluka_name,
        "district": req.district_name,
        "packets_processed": len(processed),
        "canonical_hub_ingested": len(processed),
        "items": processed,
        "sync_timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ")
    }
