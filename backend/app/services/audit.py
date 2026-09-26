import hashlib
import json
import uuid
from datetime import datetime, timezone
from typing import Any

from backend.app.models.audit import AuditLog
from sqlalchemy.orm import Session


def compute_audit_hash(
    log_id: str,
    actor_id: str,
    action: str,
    resource: str,
    timestamp_iso: str,
    application_id: str | None = None,
    metadata: dict[str, Any] | None = None,
) -> str:
    """Computes a SHA-256 cryptographic digest over immutable audit entry attributes."""
    raw_payload = f"{log_id}|{actor_id}|{action}|{resource}|{application_id or ''}|{timestamp_iso}|{json.dumps(metadata or {}, sort_keys=True)}"
    return hashlib.sha256(raw_payload.encode("utf-8")).hexdigest()


def verify_audit_log_integrity(log: AuditLog) -> bool:
    """Cryptographically verifies that an audit log entry has not been altered."""
    if not getattr(log, "tamper_hash", None):
        return True
    expected_hash = compute_audit_hash(
        log_id=log.id,
        actor_id=log.actor_id,
        action=log.action,
        resource=log.resource,
        timestamp_iso=log.timestamp.isoformat(),
        application_id=log.application_id,
        metadata=log.metadata_json,
    )
    return log.tamper_hash == expected_hash


def create_audit_log(
    db: Session,
    actor_id: str,
    action: str,
    resource: str,
    application_id: str | None = None,
    metadata: dict[str, Any] | None = None,
) -> AuditLog:
    """Records an immutable, tamper-evident audit log entry."""
    log_id = str(uuid.uuid4())
    ts = datetime.now(timezone.utc).replace(tzinfo=None)
    tamper_hash = compute_audit_hash(
        log_id=log_id,
        actor_id=actor_id,
        action=action,
        resource=resource,
        timestamp_iso=ts.isoformat(),
        application_id=application_id,
        metadata=metadata,
    )
    log = AuditLog(
        id=log_id,
        application_id=application_id,
        actor_id=actor_id,
        action=action,
        resource=resource,
        metadata_json=metadata or {},
        tamper_hash=tamper_hash,
        timestamp=ts,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log
