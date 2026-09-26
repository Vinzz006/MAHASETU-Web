import random
from datetime import datetime, timezone

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(
    prefix="/api/field", tags=["Talathi & Gram Sevak Field Verification"]
)


class FieldInspectionRequest(BaseModel):
    application_number: str
    beneficiary_name: str
    inspector_name: str = "Prakash Patil (Talathi, Haveli)"
    taluka: str = "Haveli"
    district: str = "Pune"
    latitude: float = 18.5204
    longitude: float = 73.8567
    inspection_notes: str
    recommendation: str = (
        "RECOMMENDED_FOR_SANCTION"  # "RECOMMENDED_FOR_SANCTION", "REJECTED_LAND_DISPUTE"
    )
    offline_sync_queued: bool = True


INSPECTIONS_LOG = [
    {
        "id": "INSP-2026-001",
        "application_number": "MH-APP-2026-000186",
        "beneficiary_name": "Demo Citizen",
        "inspector_name": "Prakash Patil (Talathi, Haveli)",
        "village": "Uruli Kanchan",
        "taluka": "Haveli",
        "district": "Pune",
        "gps_coordinates": "18.5204° N, 73.8567° E",
        "inspection_notes": "Physical 7/12 land boundary verified. Micro-irrigation equipment installed and functioning.",
        "recommendation": "RECOMMENDED_FOR_SANCTION",
        "timestamp": "2026-09-02T16:00:00Z",
        "edge_sync_status": "SYNCED_TO_CANONICAL_HUB",
    }
]


@router.get("/inspections")
def get_field_inspections():
    return {
        "total_field_inspections": len(INSPECTIONS_LOG),
        "inspections": INSPECTIONS_LOG,
    }


@router.post("/verify-inspection")
def submit_field_inspection(req: FieldInspectionRequest):
    insp_id = f"INSP-2026-{random.randint(100, 999)}"
    record = {
        "id": insp_id,
        "application_number": req.application_number,
        "beneficiary_name": req.beneficiary_name,
        "inspector_name": req.inspector_name,
        "village": "Local Gram Panchayat",
        "taluka": req.taluka,
        "district": req.district,
        "gps_coordinates": f"{req.latitude:.4f}° N, {req.longitude:.4f}° E",
        "inspection_notes": req.inspection_notes,
        "recommendation": req.recommendation,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "edge_sync_status": (
            "INGESTED_VIA_GRAMIN_EDGE" if req.offline_sync_queued else "DIRECT_ONLINE"
        ),
    }
    INSPECTIONS_LOG.append(record)

    return {"status": "SUCCESS", "inspection_id": insp_id, "inspection_record": record}
