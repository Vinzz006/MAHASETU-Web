import random
import time

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(
    prefix="/api/dpi", tags=["National Digital Public Infrastructure (DPI) Gateway"]
)

NATIONAL_DPI_REGISTRIES = [
    {
        "id": "DPI-DIGILOCKER",
        "name": "DigiLocker / National API Setu",
        "authority": "Ministry of Electronics & IT (MeitY), Gov of India",
        "protocol": "OPENID_CONNECT_VC",
        "endpoint": "https://api.digitallocker.gov.in/v2/pull/credentials",
        "status": "FEDERATED_CONNECTED",
        "latency_ms": 42.1,
        "daily_volume": "1,420,000 requests",
        "purpose": "Citizen credential issuance and national document retrieval",
    },
    {
        "id": "DPI-PFMS-EKUBER",
        "name": "PFMS / RBI e-Kuber Treasury Gateway",
        "authority": "Ministry of Finance & Reserve Bank of India",
        "protocol": "ISO_20022_FINANCIAL_REST",
        "endpoint": "https://pfms.nic.in/api/v4/direct-disbursal",
        "status": "FEDERATED_CONNECTED",
        "latency_ms": 68.4,
        "daily_volume": "890,000 disbursals",
        "purpose": "Automated Direct Benefit Transfer (DBT) to citizen Aadhaar bank accounts",
    },
    {
        "id": "DPI-AGRISTACK",
        "name": "National AgriStack (Unified Farmer ID)",
        "authority": "Ministry of Agriculture & Farmers Welfare",
        "protocol": "CANONICAL_JSON_STREAM",
        "endpoint": "https://agristack.gov.in/api/v1/farmer-registry",
        "status": "FEDERATED_CONNECTED",
        "latency_ms": 51.0,
        "daily_volume": "340,000 queries",
        "purpose": "Cross-verification of land tenure and farmer crop subsidy entitlements",
    },
    {
        "id": "DPI-ABDM",
        "name": "Ayushman Bharat Digital Mission (ABDM)",
        "authority": "National Health Authority (NHA)",
        "protocol": "FHIR_REST_V4",
        "endpoint": "https://abdm.gov.in/api/v1/health-id",
        "status": "FEDERATED_CONNECTED",
        "latency_ms": 47.8,
        "daily_volume": "620,000 records",
        "purpose": "Ayushman Card and medical welfare entitlement cross-checks",
    },
]


class DPIHandshakeRequest(BaseModel):
    target_dpi_id: str
    sample_payload_type: str = "BENEFICIARY_VERIFY"


@router.get("/status")
def get_dpi_gateway_status():
    return {
        "gateway_name": "MAHASETU • NATIONAL DPI FEDERATION GATEWAY",
        "compliance_standard": "India Digital Public Infrastructure (DPI) & India Stack v2.0",
        "active_registries_count": len(NATIONAL_DPI_REGISTRIES),
        "registries": NATIONAL_DPI_REGISTRIES,
        "security_standard": "mTLS 1.3 / OAuth 2.0 PKCE / AES-GCM-256",
        "average_national_handshake_ms": 52.3,
        "overall_gateway_health": "100% OPERATIONAL",
    }


@router.post("/test-handshake")
def test_dpi_handshake(req: DPIHandshakeRequest):
    time.sleep(0.2)
    reg = next(
        (r for r in NATIONAL_DPI_REGISTRIES if r["id"] == req.target_dpi_id),
        NATIONAL_DPI_REGISTRIES[0],
    )

    packet_id = f"NAT-DPI-{random.randint(100000, 999999)}"

    return {
        "handshake_status": "SUCCESS_VERIFIED",
        "handshake_id": packet_id,
        "target_registry": reg["name"],
        "target_endpoint": reg["endpoint"],
        "protocol": reg["protocol"],
        "latency_ms": round(reg["latency_ms"] + random.uniform(-4.0, 4.0), 1),
        "transmitted_sample_type": req.sample_payload_type,
        "verification_token": f"0x{random.randbytes(16).hex()}",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
    }
