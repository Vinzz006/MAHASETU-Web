from typing import Dict, Any
from backend.app.integrations.base import DepartmentConnector
from backend.app.services.transformation import DataTransformationEngine

class DepartmentAConnector(DepartmentConnector):
    """
    Demo Department A — Modern REST API Integration (Identity Department).
    Demonstrates consumption and transformation of modern REST payloads.
    """

    department_id = "DEPT_A"
    department_name = "Demo Department A (Identity Verification)"
    integration_type = "Modern REST API (OpenAPI 3.0)"

    def verify_identity(self, citizen_canonical: Dict[str, Any]) -> Dict[str, Any]:
        # 1. Transform canonical data into Department A native payload format
        dept_payload = DataTransformationEngine.from_canonical_to_dept_a(citizen_canonical)

        # 2. Simulate native REST API endpoint invocation
        name = dept_payload.get("citizen_name", "")
        mobile = dept_payload.get("mobile_no", "")

        # Check basic identity consistency
        is_verified = bool(name and mobile)

        return {
            "department_id": self.department_id,
            "status": "VERIFIED" if is_verified else "UNVERIFIED",
            "verification_id": f"UIDAI-MOCK-{hash(name + mobile) % 100000:05d}",
            "confidence_score": 0.994 if is_verified else 0.45,
            "native_request_sent": dept_payload,
            "native_response_received": {
                "statusCode": 200,
                "data": {
                    "matched": is_verified,
                    "demographicMatch": True,
                    "districtCode": dept_payload.get("district", "Pune"),
                    "registryRecordFound": True
                }
            }
        }

    def verify_eligibility(self, citizen_canonical: Dict[str, Any], retry_attempt: int = 0, **kwargs: Any) -> Dict[str, Any]:
        return {
            "department_id": self.department_id,
            "status": "NOT_APPLICABLE",
            "message": "Department A specializes in Identity Verification only."
        }

    def submit_application(self, application_canonical: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "department_id": self.department_id,
            "status": "ACKNOWLEDGED",
            "dept_reference": f"DEPTA-REF-{abs(hash(str(application_canonical))) % 90000 + 10000}"
        }

    def get_status(self, application_id: str) -> Dict[str, Any]:
        return {
            "department_id": self.department_id,
            "application_id": application_id,
            "health": "UP",
            "active_connections": 14
        }
