from backend.app.integrations.base import DepartmentConnector
from backend.app.integrations.department_a import DepartmentAConnector
from backend.app.integrations.department_b import (
    DepartmentBConnector,
    DepartmentBFailureController,
)
from backend.app.integrations.department_c import DepartmentCConnector
from backend.app.integrations.legacy import LegacyDepartmentConnector

_CONNECTORS: dict[str, DepartmentConnector] = {
    "DEPT_A": DepartmentAConnector(),
    "DEPT_B": DepartmentBConnector(),
    "DEPT_C": DepartmentCConnector(),
    "LEGACY_01": LegacyDepartmentConnector(),
}


def get_connector(department_id: str) -> DepartmentConnector:
    """Returns the registered connector for a given department ID."""
    if department_id not in _CONNECTORS:
        raise ValueError(f"No connector registered for department: {department_id}")
    return _CONNECTORS[department_id]


def get_all_connectors() -> dict[str, DepartmentConnector]:
    return _CONNECTORS


__all__ = [
    "DepartmentAConnector",
    "DepartmentBConnector",
    "DepartmentBFailureController",
    "DepartmentCConnector",
    "DepartmentConnector",
    "LegacyDepartmentConnector",
    "get_all_connectors",
    "get_connector",
]
