from typing import Any

from backend.app.integrations.base import DepartmentConnector
from backend.app.services.transformation import DataTransformationEngine


class LegacyDepartmentConnector(DepartmentConnector):
    """
    Demo Legacy System Adapter (Legacy Registry).
    Simulates a 25-year-old mainframe/COBOL-style departmental registry that only
    accepts and emits pipe-delimited flat file strings (CIT001|Demo Citizen|Pune|MH).
    Shows how legacy systems participate seamlessly via MahaSetu's connector abstraction
    without replacing them.
    """

    department_id = "LEGACY_01"
    department_name = "Demo Legacy Registry (Civil Registration & Land Records)"
    integration_type = "Legacy Mainframe (Pipe-Delimited ASCII Stream)"

    def verify_identity(self, citizen_canonical: dict[str, Any]) -> dict[str, Any]:
        # 1. Transform canonical data into legacy pipe-delimited stream
        legacy_stream = DataTransformationEngine.from_canonical_to_legacy(
            citizen_canonical
        )

        # 2. Simulate legacy mainframe processing
        # CIT001|Demo Citizen|Pune|MH
        parts = legacy_stream.split("|")
        citizen_id = parts[0] if len(parts) > 0 else "CIT001"

        legacy_response_stream = f"ACK|{citizen_id}|VERIFIED|FOUND_IN_BOOK_1998_PAGE_42"

        # 3. Parse legacy output back into canonical structure
        parsed_canonical = DataTransformationEngine.to_canonical_from_legacy(
            legacy_stream
        )

        return {
            "department_id": self.department_id,
            "status": "LEGACY_RECORD_VERIFIED",
            "legacy_request_sent": legacy_stream,
            "legacy_response_raw": legacy_response_stream,
            "parsed_back_to_canonical": parsed_canonical,
            "registry_folio": "BOOK-1998/P-42",
            "message": "Successfully verified against legacy mainframe without replacing legacy hardware.",
        }

    def verify_eligibility(
        self, citizen_canonical: dict[str, Any], retry_attempt: int = 0, **kwargs: Any
    ) -> dict[str, Any]:
        return {
            "department_id": self.department_id,
            "status": "NOT_APPLICABLE",
            "message": "Legacy registry only provides baseline demographic archives.",
        }

    def submit_application(
        self, application_canonical: dict[str, Any]
    ) -> dict[str, Any]:
        legacy_stream = DataTransformationEngine.from_canonical_to_legacy(
            application_canonical
        )
        return {
            "department_id": self.department_id,
            "status": "LEGACY_QUEUED",
            "legacy_stream": legacy_stream,
            "mainframe_tape_batch": f"BATCH-{abs(hash(legacy_stream)) % 10000:04d}",
        }

    def get_status(self, application_id: str) -> dict[str, Any]:
        return {
            "department_id": self.department_id,
            "application_id": application_id,
            "health": "HEALTHY",
            "terminal_sessions": 2,
        }
