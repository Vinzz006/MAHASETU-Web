import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.app.database import Base
from backend.app.models.user import User
from backend.app.models.application import Application
from backend.app.api.audit_report import get_executive_audit_report
from backend.app.api.data_lineage import get_application_data_lineage
from backend.app.api.edge_sync import get_edge_sync_status, simulate_batch_upload, BatchSyncRequest

TEST_DB_URL = "sqlite:///:memory:"

@pytest.fixture
def db_session():
    engine = create_engine(TEST_DB_URL)
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    session = Session()

    user = User(
        id="CIT-P4-TEST",
        name="Vikram Gaikwad",
        mobile="9823222222",
        email="vikram@citizen.gov.in",
        role="CITIZEN",
        hashed_password="mock"
    )
    session.add(user)
    session.commit()

    yield session

    session.close()
    Base.metadata.drop_all(bind=engine)

def test_executive_audit_report(db_session):
    report = get_executive_audit_report(db=db_session)
    assert "executive_summary" in report
    assert report["executive_summary"]["total_state_economic_savings_crores"] >= 4.0
    assert report["dpdp_compliance_certification"]["consent_authorization_rate"] == 100.0
    assert len(report["district_federation_readiness"]) >= 5

def test_data_lineage_provenance(db_session):
    app = Application(
        application_number="MH-APP-2026-LIN01",
        citizen_id="CIT-P4-TEST",
        service_id="employment-support",
        status="COMPLETED",
        citizen_data={"name": "Vikram Gaikwad", "mobile": "9823222222", "dob": "1994-08-20", "district": "Pune"}
    )
    db_session.add(app)
    db_session.commit()

    lineage = get_application_data_lineage(application_id=app.id, db=db_session)
    assert lineage["universal_application_id"] == "MH-APP-2026-LIN01"
    assert len(lineage["lineage_records"]) >= 5
    assert lineage["lineage_summary"]["zero_storage_architecture"] is True

def test_gramin_edge_sync():
    status = get_edge_sync_status()
    assert status["network_mode"] == "STORE_AND_FORWARD_RESILIENT"
    assert len(status["centers"]) >= 3

    req = BatchSyncRequest(
        center_id="CSC-GAD-012",
        taluka_name="Bhamragad",
        district_name="Gadchiroli",
        offline_packets_count=3
    )
    result = simulate_batch_upload(req)
    assert result["sync_status"] == "BATCH_SYNCHRONIZATION_COMPLETE"
    assert result["packets_processed"] == 3
