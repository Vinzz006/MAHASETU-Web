import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.app.database import Base
from backend.app.models.user import User
from backend.app.models.application import Application
from backend.app.models.consent import Consent
from backend.app.models.grievance import Grievance
from backend.app.models.transaction import DepartmentTransaction

TEST_DB_URL = "sqlite:///:memory:"

@pytest.fixture
def db_session():
    engine = create_engine(TEST_DB_URL)
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    session = Session()

    user = User(
        id="CIT-GRV-TEST",
        name="Anand Kulkarni",
        mobile="9823000000",
        email="anand@citizen.gov.in",
        role="CITIZEN",
        hashed_password="mock"
    )
    session.add(user)
    session.commit()

    yield session

    session.close()
    Base.metadata.drop_all(bind=engine)

def test_grievance_lifecycle(db_session):
    # Setup application
    app = Application(
        application_number="MH-APP-2026-GRV01",
        citizen_id="CIT-GRV-TEST",
        service_id="employment-support",
        status="IDENTITY_VERIFIED",
        current_department="DEPT_B",
        citizen_data={"name": "Anand Kulkarni", "mobile": "9823000000", "district": "Pune"}
    )
    db_session.add(app)
    db_session.commit()

    # 1. Raise Grievance
    grv = Grievance(
        ticket_number="MH-GRV-2026-00999",
        application_id=app.id,
        citizen_id="CIT-GRV-TEST",
        department_id="DEPT_B",
        category="ELIGIBILITY_DISCREPANCY",
        description="Income bracket was computed under old FY slab, please re-evaluate.",
        status="OPEN"
    )
    db_session.add(grv)
    db_session.commit()

    assert grv.ticket_number == "MH-GRV-2026-00999"
    assert grv.status == "OPEN"

    # 2. Resolve Grievance
    grv.status = "RESOLVED"
    grv.resolution_notes = "Updated to current FY slab. Eligibility re-verified successfully."
    db_session.commit()

    fetched = db_session.query(Grievance).filter(Grievance.id == grv.id).first()
    assert fetched.status == "RESOLVED"
    assert "re-verified" in fetched.resolution_notes

def test_passport_generation_attributes(db_session):
    app = Application(
        application_number="MH-APP-2026-PASSPORT01",
        citizen_id="CIT-GRV-TEST",
        service_id="employment-support",
        status="COMPLETED",
        current_department="PORTAL",
        citizen_data={"name": "Anand Kulkarni", "mobile": "9823000000", "district": "Pune"}
    )
    db_session.add(app)
    db_session.commit()

    # Add successful Dept C transaction
    txn = DepartmentTransaction(
        application_id=app.id,
        department_id="DEPT_C",
        operation="submit_application",
        request_payload={},
        response_payload={"sanction_number": "MH-SANCTION-2026-99999"},
        status="SUCCESS"
    )
    db_session.add(txn)
    db_session.commit()

    assert app.status == "COMPLETED"
    assert txn.response_payload["sanction_number"] == "MH-SANCTION-2026-99999"
