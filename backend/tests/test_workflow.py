import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.app.database import Base
from backend.app.models.user import User
from backend.app.models.application import Application
from backend.app.models.consent import Consent
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

    # Create demo citizen
    user = User(
        id="CIT-TEST-1",
        name="Test Citizen",
        mobile="9111111111",
        email="test@citizen.gov.in",
        role="CITIZEN",
        hashed_password="mock"
    )
    session.add(user)
    session.commit()

    yield session

    session.close()
    Base.metadata.drop_all(bind=engine)

def test_workflow_consent_guard(db_session):
    # Ensure failure mode is off
    DepartmentBFailureController.simulate_failure = False

    # Create application
    app = Application(
        application_number="MH-APP-2026-TEST01",
        citizen_id="CIT-TEST-1",
        service_id="employment-support",
        status="APPLICATION_CREATED",
        current_department="PORTAL",
        citizen_data={"name": "Test Citizen", "mobile": "9111111111", "district": "Pune"}
    )
    db_session.add(app)
    db_session.commit()

    WorkflowEngine.initialize_workflow(db_session, app.id)

    # Consent not authorized yet -> cannot advance to IDENTITY_VERIFICATION without consent
    consent = ConsentManager.request_consent(db_session, app.id, "CIT-TEST-1")
    assert consent.status == "REQUESTED"

    with pytest.raises(Exception):
        # Attempting to advance when consent is only requested should fail
        WorkflowEngine.advance_step(db_session, app.id)

    # Now authorize consent
    ConsentManager.approve_consent(db_session, consent.id, "CIT-TEST-1")
    assert consent.status == "AUTHORIZED"

    # Step: CONSENT_GRANTED
    res1 = WorkflowEngine.advance_step(db_session, app.id)
    assert res1["status"] == "COMPLETED"

    # Step: IDENTITY_VERIFICATION (DEPT_A)
    res2 = WorkflowEngine.advance_step(db_session, app.id)
    assert res2["status"] == "COMPLETED"
    assert res2["result"]["department_id"] == "DEPT_A"

    # Step: ELIGIBILITY_VERIFICATION (DEPT_B)
    res3 = WorkflowEngine.advance_step(db_session, app.id)
    assert res3["status"] == "COMPLETED"
    assert res3["result"]["department_id"] == "DEPT_B"

    # Step: DEPARTMENT_APPROVAL (DEPT_C)
    res4 = WorkflowEngine.advance_step(db_session, app.id)
    assert res4["status"] == "COMPLETED"
    assert res4["result"]["department_id"] == "DEPT_C"
    assert "MH-SANCTION" in res4["result"]["sanction_number"]
