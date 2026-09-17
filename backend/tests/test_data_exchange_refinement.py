import os
import tempfile
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from backend.app.database import Base, get_db
from backend.app.main import app
from backend.app.models.user import User
from backend.app.models.application import Application
from backend.app.models.consent import Consent
from backend.app.models.workflow import WorkflowStep
from backend.app.models.transaction import DepartmentTransaction
from backend.app.services.workflow import WorkflowEngine
from backend.app.auth import create_access_token

@pytest.fixture
def exchange_env():
    temp_db = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
    temp_db.close()

    engine = create_engine(f"sqlite:///{temp_db.name}", connect_args={"check_same_thread": False})
    TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)

    def override_get_db():
        db = TestingSession()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    session = TestingSession()

    user = User(
        id="U-EXCH-1",
        name="Exchange Citizen",
        email="exch@mahasetu.gov.in",
        mobile="9823999911",
        role="CITIZEN",
        hashed_password="mock",
        registration_status="APPROVED"
    )
    admin = User(
        id="U-EXCH-ADM",
        name="Exchange Admin",
        email="admin_exch@mahasetu.gov.in",
        mobile="9823999912",
        role="ADMIN",
        hashed_password="mock",
        registration_status="APPROVED"
    )

    app1 = Application(
        id="APP-EXCH-1",
        application_number="MH-EXCH-2026-001",
        citizen_id="U-EXCH-1",
        service_id="employment-support",
        status="APPLICATION_CREATED",
        current_department="PORTAL"
    )

    consent = Consent(
        id="CNS-EXCH-1",
        application_id="APP-EXCH-1",
        citizen_id="U-EXCH-1",
        consent_number="MH-CNS-EXCH-1",
        status="AUTHORIZED",
        requested_by="PORTAL",
        purpose="Scheme verification",
        data_categories=["identity", "eligibility"]
    )

    step0 = WorkflowStep(
        id="STP-0",
        application_id="APP-EXCH-1",
        step_name="APPLICATION_CREATED",
        department_id="PORTAL",
        status="COMPLETED"
    )
    step1 = WorkflowStep(
        id="STP-1",
        application_id="APP-EXCH-1",
        step_name="CONSENT_GRANTED",
        department_id="PORTAL",
        status="COMPLETED"
    )
    step2 = WorkflowStep(
        id="STP-2",
        application_id="APP-EXCH-1",
        step_name="IDENTITY_VERIFICATION",
        department_id="DEPT_A",
        status="PENDING"
    )

    session.add_all([user, admin, app1, consent, step0, step1, step2])
    session.commit()

    client = TestClient(app)

    yield {
        "session": session,
        "client": client,
        "admin_token": create_access_token({"sub": admin.id, "role": admin.role}),
        "db_path": temp_db.name
    }

    app.dependency_overrides.clear()
    session.close()
    if os.path.exists(temp_db.name):
        try:
            os.remove(temp_db.name)
        except Exception:
            pass

def test_workflow_transaction_canonical_routing(exchange_env):
    session = exchange_env["session"]
    client = exchange_env["client"]
    adm_t = exchange_env["admin_token"]

    # Advance to step 2 (IDENTITY_VERIFICATION)
    result = WorkflowEngine.advance_step(session, "APP-EXCH-1", "U-EXCH-ADM")
    assert result["status"] == "COMPLETED"

    # Verify transaction in database
    txn = session.query(DepartmentTransaction).filter(DepartmentTransaction.application_id == "APP-EXCH-1").first()
    assert txn is not None
    assert txn.source_department == "PORTAL"
    assert txn.destination_department == "DEPT_A"
    assert txn.schema_version == "v2.1-canonical"
    assert txn.operation == "verify_identity"

    # Verify GET /api/dashboard/transactions
    r = client.get("/api/dashboard/transactions", headers={"Authorization": f"Bearer {adm_t}"})
    assert r.status_code == 200
    txns = r.json()
    assert len(txns) >= 1
    t0 = next(t for t in txns if t["application_id"] == "APP-EXCH-1")
    assert t0["source_department"] == "PORTAL"
    assert t0["destination_department"] == "DEPT_A"
    assert t0["schema_version"] == "v2.1-canonical"
