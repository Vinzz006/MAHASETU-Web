import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, JSON, Text
from sqlalchemy.orm import relationship
from backend.app.database import Base, utc_now

class DepartmentRegistryEntry(Base):
    """
    Department Registry: Central registry of government departments participating in MahaSetu.
    Tracks department identifiers, protocols, base URLs, auth methods, schema versions, and live health.
    """
    __tablename__ = "department_registry"

    department_id = Column(String(50), primary_key=True) # e.g. "DEPT_A", "DEPT_B", "DEPT_C", "LEGACY_01"
    name = Column(String(255), nullable=False) # e.g. "Civil Registration & Identity Department"
    code = Column(String(50), unique=True, nullable=False, index=True) # e.g. "MH-UID-01"
    status = Column(String(50), default="ACTIVE", nullable=False) # ACTIVE, INACTIVE, DEGRADED
    api_base_url = Column(String(255), nullable=False) # e.g. "http://dept-a.internal.gov.in"
    protocol = Column(String(50), default="REST_JSON", nullable=False) # REST_JSON, SOAP_XML, PIPE_DELIMITED, CSV_STREAM, MOCK_SANDBOX
    auth_method = Column(String(50), default="OAUTH2_BEARER", nullable=False) # OAUTH2_BEARER, API_KEY, MUTUAL_TLS, BASIC_AUTH
    schema_version = Column(String(32), default="v1.0", nullable=False)
    service_list = Column(JSON, nullable=False, default=list) # ["identity_verification", "demographic_lookup"]
    owner_contact = Column(JSON, nullable=True) # {"name": "Officer Sharma", "email": "sharma@dept.gov.in", "phone": "022-22001122"}
    health_status = Column(String(50), default="HEALTHY", nullable=False) # HEALTHY, DEGRADED, UNREACHABLE
    last_sync_time = Column(DateTime, default=utc_now, nullable=False)
    metadata_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    connectors = relationship("ConnectorRegistryEntry", back_populates="department", cascade="all, delete-orphan")


class ConnectorRegistryEntry(Base):
    """
    Connector Registry: Reusable adapter configurations supporting REST/JSON, SOAP/XML,
    legacy flat-files, and CSV streams with timeout, retry policies, and schema mappings.
    """
    __tablename__ = "connector_registry"

    connector_id = Column(String(50), primary_key=True) # e.g. "CONN_DEPT_A_REST", "CONN_LEGACY_01_PIPE"
    name = Column(String(255), nullable=False)
    department_id = Column(String(50), ForeignKey("department_registry.department_id", ondelete="CASCADE"), nullable=False, index=True)
    connector_type = Column(String(50), default="REST_JSON", nullable=False) # REST_JSON, SOAP_XML, PIPE_DELIMITED, CSV_STREAM, MOCK_SANDBOX
    connection_config = Column(JSON, nullable=False, default=dict) # {"base_url": "...", "timeout": 10}
    auth_config = Column(JSON, nullable=False, default=dict) # {"auth_type": "API_KEY", "token_url": "..."}
    request_mapping = Column(JSON, nullable=False, default=dict) # Field mapping rules from CDM to Department Native
    response_mapping = Column(JSON, nullable=False, default=dict) # Field mapping rules from Department Native to CDM
    schema_mapping = Column(JSON, nullable=False, default=dict) # Validation rules
    timeout_seconds = Column(Integer, default=10, nullable=False)
    max_retries = Column(Integer, default=3, nullable=False)
    retry_backoff_factor = Column(Float, default=1.5, nullable=False)
    health_check_endpoint = Column(String(255), nullable=True)
    version = Column(String(32), default="1.0.0", nullable=False)
    is_enabled = Column(Boolean, default=True, nullable=False)
    is_sandbox = Column(Boolean, default=True, nullable=False)
    last_health_status = Column(String(50), default="HEALTHY", nullable=False)
    last_health_at = Column(DateTime, default=utc_now, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    department = relationship("DepartmentRegistryEntry", back_populates="connectors")
