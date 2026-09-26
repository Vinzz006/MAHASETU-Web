from typing import Any

from backend.app.integrations.base import DepartmentConnector
from backend.app.services.transformation import DataTransformationEngine


class DepartmentBFailureController:
    """Controls simulated failure behavior for Department B demo."""

    simulate_failure: bool = False
    failure_reason: str = (
        "HTTP 503 Service Unavailable: Department B Eligibility Database Connection Pool Exhausted"
    )


class DepartmentBConnector(DepartmentConnector):
    """
    Demo Department B — Heterogeneous JSON Schema (Eligibility Department).
    Demonstrates handling disparate naming conventions (fullName, phone, income_bracket)
    and supports failure simulation + automated retries.
    """

    department_id = "DEPT_B"
    department_name = "Demo Department B (Eligibility & Socio-economic)"
    integration_type = "Heterogeneous JSON (Custom Schema v2.1)"

    def verify_identity(self, citizen_canonical: dict[str, Any]) -> dict[str, Any]:
        return {
            "department_id": self.department_id,
            "status": "NOT_APPLICABLE",
            "message": "Department B evaluates Eligibility criteria, not primary identity.",
        }

    def verify_eligibility(
        self, citizen_canonical: dict[str, Any], retry_attempt: int = 0
    ) -> dict[str, Any]:
        # 1. Transform canonical data into Department B native schema
        dept_payload = DataTransformationEngine.from_canonical_to_dept_b(
            citizen_canonical
        )

        # 2. Check if simulated failure is triggered
        if DepartmentBFailureController.simulate_failure:
            raise RuntimeError(
                f"{DepartmentBFailureController.failure_reason} (Retry Attempt {retry_attempt})"
            )

        # 3. Simulate business evaluation logic
        citizen = citizen_canonical.get("citizen", {})
        income = citizen.get("annualIncome", 180000)
        status = citizen.get("employmentStatus", "UNEMPLOYED")

        # Eligibility condition for Employment Support Scheme:
        # Income under 300,000 INR and Unemployed status
        is_eligible = (income <= 300000) and (status in ["UNEMPLOYED", "JOB_SEEKER"])

        return {
            "department_id": self.department_id,
            "status": "ELIGIBLE" if is_eligible else "INELIGIBLE",
            "criteria_evaluated": {
                "income_criterion": "PASSED (Income <= 3,00,000 INR)",
                "domicile_criterion": "PASSED (Maharashtra Resident)",
                "age_criterion": "PASSED (Between 18 and 45 years)",
            },
            "eligibility_certificate_id": f"MH-ELIG-2026-{abs(hash(str(dept_payload))) % 90000 + 10000}",
            "native_request_sent": dept_payload,
            "native_response_received": {
                "evalStatus": "SUCCESS",
                "rulesEngine": "MahaEligibility-v4",
                "isEligible": is_eligible,
                "benefitTier": "TIER_1_PRIORITY",
            },
        }

    def submit_application(
        self, application_canonical: dict[str, Any]
    ) -> dict[str, Any]:
        return {
            "department_id": self.department_id,
            "status": "REGISTERED_IN_SCHEME_DB",
            "scheme_enrollment_id": f"SCH-B-{abs(hash(str(application_canonical))) % 80000 + 10000}",
        }

    def get_status(self, application_id: str) -> dict[str, Any]:
        return {
            "department_id": self.department_id,
            "application_id": application_id,
            "health": (
                "DOWN" if DepartmentBFailureController.simulate_failure else "HEALTHY"
            ),
            "simulated_failure_active": DepartmentBFailureController.simulate_failure,
        }
