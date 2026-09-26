from abc import ABC, abstractmethod
from typing import Any


class DepartmentConnector(ABC):
    """
    Abstract Department Connector interface.
    All department adapters implement this contract, shielding the core
    MahaSetu Hub from heterogeneous backend implementations.
    """

    department_id: str
    department_name: str
    integration_type: str  # REST API, JSON, LEGACY_MAINFRAME, APPROVAL_ENGINE

    @abstractmethod
    def verify_identity(self, citizen_canonical: dict[str, Any]) -> dict[str, Any]:
        """Verify citizen identity against departmental registry."""

    @abstractmethod
    def verify_eligibility(
        self, citizen_canonical: dict[str, Any], retry_attempt: int = 0, **kwargs: Any
    ) -> dict[str, Any]:
        """Verify citizen eligibility rules according to departmental criteria."""

    @abstractmethod
    def submit_application(
        self, application_canonical: dict[str, Any]
    ) -> dict[str, Any]:
        """Submit application payload to department workflow."""

    @abstractmethod
    def get_status(self, application_id: str) -> dict[str, Any]:
        """Poll or query status from departmental system."""
