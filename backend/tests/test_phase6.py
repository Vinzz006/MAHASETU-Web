import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.app.database import Base
from backend.app.api.vaani_voice import process_vaani_voice_query, VaaniQueryRequest
from backend.app.api.dpi_gateway import get_dpi_gateway_status, test_dpi_handshake as run_dpi_handshake, DPIHandshakeRequest
from backend.app.api.disbursal_ledger import get_dbt_transactions
from backend.app.api.field_verification import submit_field_inspection, get_field_inspections, FieldInspectionRequest

TEST_DB_URL = "sqlite:///:memory:"

@pytest.fixture
def db_session():
    engine = create_engine(TEST_DB_URL)
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()
    Base.metadata.drop_all(bind=engine)

def test_vaani_voice_assistant(db_session):
    # Marathi Status Query
    req_mr = VaaniQueryRequest(
        query_text="माझ्या अर्जाची स्थिती काय आहे?",
        language="mr"
    )
    res_mr = process_vaani_voice_query(req=req_mr, db=db_session)
    assert res_mr["intent"] == "STATUS_INQUIRY"
    assert "नमस्कार" in res_mr["spoken_response"]
    assert res_mr["audio_synthesis_ready"] is True

    # English Farmer Query
    req_en = VaaniQueryRequest(
        query_text="Tell me about farmer subsidy scheme",
        language="en"
    )
    res_en = process_vaani_voice_query(req=req_en, db=db_session)
    assert res_en["intent"] == "FARMER_SCHEME_INQUIRY"
    assert "MahaDBT" in res_en["spoken_response"]

def test_national_dpi_gateway():
    status = get_dpi_gateway_status()
    assert status["active_registries_count"] >= 4
    assert status["overall_gateway_health"] == "100% OPERATIONAL"

    # Test Handshake with PFMS
    req = DPIHandshakeRequest(target_dpi_id="DPI-PFMS-EKUBER")
    hs = run_dpi_handshake(req)
    assert hs["handshake_status"] == "SUCCESS_VERIFIED"
    assert "PFMS" in hs["target_registry"]
    assert hs["latency_ms"] > 0

def test_dbt_disbursal_ledger():
    ledger = get_dbt_transactions()
    assert "summary" in ledger
    assert ledger["summary"]["total_disbursed_inr"] > 0
    assert len(ledger["transactions"]) >= 2
    assert ledger["transactions"][0]["utr_number"].startswith("RBI")

def test_field_verification():
    req = FieldInspectionRequest(
        application_number="MH-APP-2026-000186",
        beneficiary_name="Demo Citizen",
        inspector_name="Prakash Patil (Talathi)",
        taluka="Haveli",
        district="Pune",
        latitude=18.5204,
        longitude=73.8567,
        inspection_notes="Crop boundary and drip irrigation verified physically."
    )
    insp = submit_field_inspection(req)
    assert insp["status"] == "SUCCESS"
    assert insp["inspection_record"]["gps_coordinates"] == "18.5204° N, 73.8567° E"

    all_insps = get_field_inspections()
    assert all_insps["total_field_inspections"] >= 2
