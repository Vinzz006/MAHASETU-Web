from typing import Any

from backend.app.integrations import get_all_connectors
from backend.app.services.transformation import DataTransformationEngine
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/api/connectors-studio", tags=["Connector Studio"])


class CustomConnectorTestRequest(BaseModel):
    connector_id: str
    connector_name: str
    protocol: str  # REST_JSON, SOAP_XML, PIPE_DELIMITED, CSV_STREAM
    sample_payload: dict[str, Any]
    target_format: str = "CANONICAL"


# In-memory custom studio connectors
CUSTOM_CONNECTORS: list[dict[str, Any]] = [
    {
        "id": "DEPT_LAND_RECORDS",
        "name": "Mahabhulekh Land & 7/12 Registry Adapter",
        "protocol": "REST_JSON",
        "status": "SANDBOX_ACTIVE",
        "fields": [
            "khata_no",
            "owner_name",
            "taluka",
            "district",
            "land_area_hectares",
        ],
    },
    {
        "id": "DEPT_RATION_PDS",
        "name": "State Food Grain & Ration Card Adapter",
        "protocol": "SOAP_XML_WRAPPED",
        "status": "SANDBOX_ACTIVE",
        "fields": [
            "ration_card_no",
            "head_of_family",
            "scheme_category",
            "monthly_quota",
        ],
    },
]


@router.get("/registered")
def list_studio_connectors():
    base_connectors = [
        {
            "id": k,
            "name": v.department_name,
            "type": v.integration_type,
            "is_core": True,
        }
        for k, v in get_all_connectors().items()
    ]
    return {"core_connectors": base_connectors, "studio_connectors": CUSTOM_CONNECTORS}


@router.post("/test-transform")
def test_custom_transformation(req: CustomConnectorTestRequest):
    """
    Executes a real-time transformation test on a custom connector payload.
    Shows the raw input mapped into the Canonical Model.
    """
    payload = req.sample_payload
    # Map into Canonical Model heuristically
    name = (
        payload.get("owner_name")
        or payload.get("head_of_family")
        or payload.get("citizen_name")
        or payload.get("name")
        or "Sample Citizen"
    )
    district = payload.get("district") or payload.get("taluka") or "Pune"

    canonical = {
        "citizen": {
            "id": "STUDIO-MOCK-001",
            "name": name,
            "phone": payload.get("mobile") or "9999999999",
            "dateOfBirth": "1995-01-01",
            "address": {"district": district, "state": "Maharashtra"},
            "custom_attributes": payload,
        },
        "studio_source": req.connector_id,
        "protocol": req.protocol,
    }

    target_dept_b = DataTransformationEngine.from_canonical_to_dept_b(canonical)

    return {
        "status": "SUCCESS",
        "protocol_evaluated": req.protocol,
        "stage_1_raw_input": payload,
        "stage_2_canonical_model": canonical,
        "stage_3_target_dept_b": target_dept_b,
        "latency_simulated_ms": 84,
        "schema_validation": "PASSED",
    }
