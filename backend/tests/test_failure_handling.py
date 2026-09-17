import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.app.database import Base
from backend.app.models.user import User
from backend.app.models.application import Application
from backend.app.models.transaction import DepartmentTransaction
from backend.app.services.workflow import WorkflowEngine
from backend.app.services.consent import ConsentManager
from backend.app.integrations.department_b import DepartmentBFailureController

TEST_DB_URL = "sqlite:///:memory:"

@pytest.fixture
def db_session():
    engine = create_engine(TEST_DB_URL)
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    session = Session()

    user = User(
        id="CIT-FAIL-1",
        name="Fail Citizen",
        mobile="9222222222",
        email="fail@citizen.gov.in",
        role="CITIZEN",
        hashed_password="mock"
    )
    session.add(user)
    session.commit()

    yield session

    session.close()
    Base.metadata.drop_all(bind=engine)

def test_department_b_failure_and_retry_recovery(db_session):
    # Setup application and approve consent
    app = Application(
        application_number="MH-APP-2026-FAIL01",
        citizen_id="CIT-FAIL-1",
        service_id="employment-support",
        status="APPLICATION_CREATED",
        current_department="PORTAL",
        citizen_data={"name": "Fail Citizen", "mobile": "9222222222", "district": "Pune"}
    )
    db_session.add(app)
    db_session.commit()

    WorkflowEngine.initialize_workflow(db_session, app.id)
    consent = ConsentManager.request_consent(db_session, app.id, "CIT-FAIL-1")
    ConsentManager.approve_consent(db_session, consent.id, "CIT-FAIL-1")

    # Advance through consent and identity verification
    WorkflowEngine.advance_step(db_session, app.id) # Consent
    WorkflowEngine.advance_step(db_session, app.id) # Dept A (Identity)

    # Now SIMULATE DEPARTMENT B FAILURE
    DepartmentBFailureController.simulate_failure = True

    fail_res = WorkflowEngine.advance_step(db_session, app.id) # Dept B (Eligibility)

    # Assert exception state was captured
    assert fail_res["status"] == "EXCEPTION"
    assert fail_res["retries"] == 2
    assert "Connection Pool Exhausted" in fail_res["error"]

    # Verify application status in DB is EXCEPTION
    db_session.refresh(app)
    assert app.status == "EXCEPTION"

    # Verify failed transaction was logged
    failed_txn = db_session.query(DepartmentTransaction).filter(
        DepartmentTransaction.application_id == app.id,
        DepartmentTransaction.department_id == "DEPT_B"
    ).first()
    assert failed_txn is not None
    assert failed_txn.status == "FAILED"
    assert failed_txn.retry_count == 2

    # Now RESOLVE FAILURE (Officer toggles off failure and retries)
    DepartmentBFailureController.simulate_failure = False

    recovery_res = WorkflowEngine.retry_exception(db_session, app.id, actor_id="OFFICER-001")
    assert recovery_res["status"] == "COMPLETED"
    assert recovery_res["result"]["department_id"] == "DEPT_B"

    # Advance to Department C
    final_res = WorkflowEngine.advance_step(db_session, app.id)
    assert final_res["status"] == "COMPLETED"
    assert final_res["result"]["department_id"] == "DEPT_C"
