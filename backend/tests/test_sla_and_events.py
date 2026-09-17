import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.app.database import Base
from backend.app.models.user import User
from backend.app.models.application import Application
from backend.app.models.escalation import SLAEscalation
from backend.app.api.sla_engine import get_sla_monitoring_telemetry
from backend.app.api.events_feed import get_live_events_telemetry, simulate_telemetry_pulse

TEST_DB_URL = "sqlite:///:memory:"

@pytest.fixture
def db_session():
    engine = create_engine(TEST_DB_URL)
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    session = Session()

    user = User(
        id="CIT-SLA-TEST",
        name="Suresh Deshmukh",
        mobile="9823111111",
        email="suresh@citizen.gov.in",
        role="CITIZEN",
        hashed_password="mock"
    )
    session.add(user)
    session.commit()

    yield session

    session.close()
    Base.metadata.drop_all(bind=engine)

def test_sla_monitoring_and_escalation(db_session):
    # Setup in-flight application
    app = Application(
        application_number="MH-APP-2026-SLA01",
        citizen_id="CIT-SLA-TEST",
        service_id="employment-support",
        status="IDENTITY_VERIFIED",
        current_department="DEPT_B",
        citizen_data={"name": "Suresh Deshmukh", "mobile": "9823111111", "district": "Nashik"}
    )
    db_session.add(app)
    db_session.commit()

    # Query monitoring telemetry
    telemetry = get_sla_monitoring_telemetry(db=db_session)
    assert telemetry.total_in_flight >= 1
    assert telemetry.compliance_rate >= 0.0

    # Escalate application
    escalation = SLAEscalation(
        application_id=app.id,
        service_id=app.service_id,
        target_department="DEPT_B",
        sla_days_allotted=3.0,
        elapsed_days=2.7,
        severity="APPROACHING_BREACH",
        escalation_level="DISTRICT_OFFICER",
        escalated_to="District Employment Officer, Nashik",
        status="EXPEDITED"
    )
    db_session.add(escalation)
    db_session.commit()

    assert escalation.status == "EXPEDITED"
    assert "Nashik" in escalation.escalated_to

def test_events_feed_and_pulse(db_session):
    feed = get_live_events_telemetry(limit=10, db=db_session)
    assert "nodes" in feed
    assert len(feed["nodes"]) >= 5
    assert "active_telemetry" in feed
    assert feed["network_status"] == "OPTIMAL"

    pulse = simulate_telemetry_pulse(db=db_session)
    assert pulse["status"] == "DISPATCHED"
    assert "source_node" in pulse
    assert "target_node" in pulse
