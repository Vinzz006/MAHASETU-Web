from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.auth import require_roles, get_current_user
from backend.app.models.user import User
from backend.app.services.interoperability import (
    DepartmentRegistryService, ConnectorRegistryService
)

router = APIRouter(prefix="/api/interoperability", tags=["Interoperability Registry"])

# Schemas
class DepartmentRegisterRequest(BaseModel):
    department_id: str
    name: str
    code: str
    status: str = "ACTIVE"
    api_base_url: str
    protocol: str = "REST_JSON"
    auth_method: str = "OAUTH2_BEARER"
    schema_version: str = "v1.0"
    service_list: List[str] = Field(default_factory=list)
    owner_contact: Optional[Dict[str, Any]] = None

class ConnectorRegisterRequest(BaseModel):
    connector_id: str
    name: str
    department_id: str
    connector_type: str = "REST_JSON"
    connection_config: Dict[str, Any] = Field(default_factory=dict)
    auth_config: Dict[str, Any] = Field(default_factory=dict)
    request_mapping: Dict[str, Any] = Field(default_factory=dict)
    response_mapping: Dict[str, Any] = Field(default_factory=dict)
    schema_mapping: Dict[str, Any] = Field(default_factory=dict)
    timeout_seconds: int = 10
    max_retries: int = 3
    retry_backoff_factor: float = 1.5
    health_check_endpoint: Optional[str] = None
    version: str = "1.0.0"
    is_enabled: bool = True
    is_sandbox: bool = True

class ConnectorTestRequest(BaseModel):
    sample_payload: Any

class ConnectorToggleRequest(BaseModel):
    is_enabled: bool

# ==============================================================================
# Department Registry Endpoints
# ==============================================================================

@router.get("/departments")
def list_registered_departments(db: Session = Depends(get_db)):
    """Returns all government departments registered in MahaSetu with protocols and live status."""
    departments = DepartmentRegistryService.list_departments(db)
    return [
        {
            "department_id": d.department_id,
            "name": d.name,
            "code": d.code,
            "status": d.status,
            "api_base_url": d.api_base_url,
            "protocol": d.protocol,
            "auth_method": d.auth_method,
            "schema_version": d.schema_version,
            "service_list": d.service_list,
            "owner_contact": d.owner_contact,
            "health_status": d.health_status,
            "last_sync_time": d.last_sync_time.isoformat() if d.last_sync_time else None
        }
        for d in departments
    ]

@router.get("/departments/{department_id}")
def get_registered_department(department_id: str, db: Session = Depends(get_db)):
    """Fetches full specifications for a registered government department."""
    d = DepartmentRegistryService.get_department(db, department_id.upper())
    return {
        "department_id": d.department_id,
        "name": d.name,
        "code": d.code,
        "status": d.status,
        "api_base_url": d.api_base_url,
        "protocol": d.protocol,
        "auth_method": d.auth_method,
        "schema_version": d.schema_version,
        "service_list": d.service_list,
        "owner_contact": d.owner_contact,
        "health_status": d.health_status,
        "last_sync_time": d.last_sync_time.isoformat() if d.last_sync_time else None,
        "connectors": [
            {"connector_id": c.connector_id, "name": c.name, "type": c.connector_type, "enabled": c.is_enabled}
            for c in d.connectors
        ]
    }

@router.post("/departments", dependencies=[Depends(require_roles(["OFFICER", "SYSTEM_ADMIN"]))])
def register_department(req: DepartmentRegisterRequest, db: Session = Depends(get_db)):
    """Registers or updates a departmental node in MahaSetu's Department Registry."""
    dept = DepartmentRegistryService.register_department(db, req.model_dump())
    return {
        "status": "SUCCESS",
        "message": f"Department '{dept.department_id}' registered successfully.",
        "department_id": dept.department_id
    }

@router.post("/departments/{department_id}/health-check")
def check_department_health(department_id: str, db: Session = Depends(get_db)):
    """Executes an active connectivity and protocol probe against the department."""
    return DepartmentRegistryService.probe_department_health(db, department_id.upper())

# ==============================================================================
# Connector Registry Endpoints
# ==============================================================================

@router.get("/connectors")
def list_registered_connectors(db: Session = Depends(get_db)):
    """Returns all reusable protocol connectors (REST, SOAP/XML, Pipe, CSV)."""
    connectors = ConnectorRegistryService.list_connectors(db)
    return [
        {
            "connector_id": c.connector_id,
            "name": c.name,
            "department_id": c.department_id,
            "connector_type": c.connector_type,
            "timeout_seconds": c.timeout_seconds,
            "max_retries": c.max_retries,
            "retry_backoff_factor": c.retry_backoff_factor,
            "version": c.version,
            "is_enabled": c.is_enabled,
            "is_sandbox": c.is_sandbox,
            "last_health_status": c.last_health_status,
            "last_health_at": c.last_health_at.isoformat() if c.last_health_at else None
        }
        for c in connectors
    ]

@router.get("/connectors/{connector_id}")
def get_registered_connector(connector_id: str, db: Session = Depends(get_db)):
    """Fetches configuration and schema mappings for a reusable connector."""
    c = ConnectorRegistryService.get_connector(db, connector_id)
    return {
        "connector_id": c.connector_id,
        "name": c.name,
        "department_id": c.department_id,
        "connector_type": c.connector_type,
        "connection_config": c.connection_config,
        "auth_config": c.auth_config,
        "request_mapping": c.request_mapping,
        "response_mapping": c.response_mapping,
        "schema_mapping": c.schema_mapping,
        "timeout_seconds": c.timeout_seconds,
        "max_retries": c.max_retries,
        "retry_backoff_factor": c.retry_backoff_factor,
        "health_check_endpoint": c.health_check_endpoint,
        "version": c.version,
        "is_enabled": c.is_enabled,
        "is_sandbox": c.is_sandbox,
        "last_health_status": c.last_health_status,
        "last_health_at": c.last_health_at.isoformat() if c.last_health_at else None
    }

@router.post("/connectors", dependencies=[Depends(require_roles(["SYSTEM_ADMIN"]))])
def register_connector(req: ConnectorRegisterRequest, db: Session = Depends(get_db)):
    """Registers or reconfigures a reusable connector."""
    conn = ConnectorRegistryService.register_connector(db, req.model_dump())
    return {
        "status": "SUCCESS",
        "message": f"Connector '{conn.connector_id}' configured successfully.",
        "connector_id": conn.connector_id
    }

@router.post("/connectors/{connector_id}/test")
def test_connector_execution(connector_id: str, req: ConnectorTestRequest, db: Session = Depends(get_db)):
    """
    Executes a test transaction through the connector with sample data.
    Returns the Canonical Data Model intermediate state and translated target format.
    """
    return ConnectorRegistryService.execute_connector_test(db, connector_id, req.sample_payload)

@router.post("/connectors/{connector_id}/toggle", dependencies=[Depends(require_roles(["SYSTEM_ADMIN"]))])
def toggle_connector(connector_id: str, req: ConnectorToggleRequest, db: Session = Depends(get_db)):
    """Enables or disables a connector instance."""
    conn = ConnectorRegistryService.get_connector(db, connector_id)
    conn.is_enabled = req.is_enabled
    db.commit()
    status_str = "ENABLED" if conn.is_enabled else "DISABLED"
    return {
        "status": "SUCCESS",
        "message": f"Connector '{conn.connector_id}' is now {status_str}.",
        "is_enabled": conn.is_enabled
    }
