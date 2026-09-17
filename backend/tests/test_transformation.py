import pytest
from backend.app.services.transformation import DataTransformationEngine

def test_dept_a_to_canonical():
    dept_a_payload = {
        "citizen_name": "Ramesh Patil",
        "mobile_no": "9822012345",
        "dob": "1995-08-20",
        "district": "Nagpur",
        "annual_income": 220000
    }
    canonical = DataTransformationEngine.to_canonical_from_dept_a(dept_a_payload)
    citizen = canonical["citizen"]

    assert citizen["name"] == "Ramesh Patil"
    assert citizen["phone"] == "9822012345"
    assert citizen["dateOfBirth"] == "1995-08-20"
    assert citizen["address"]["district"] == "Nagpur"
    assert citizen["annualIncome"] == 220000

def test_canonical_to_dept_b():
    canonical = {
        "citizen": {
            "id": "CIT-002",
            "name": "Sunita Deshmukh",
            "phone": "9822099999",
            "dateOfBirth": "1996-03-15",
            "address": {"district": "Nashik", "state": "Maharashtra"},
            "annualIncome": 150000,
            "employmentStatus": "UNEMPLOYED"
        }
    }
    dept_b = DataTransformationEngine.from_canonical_to_dept_b(canonical)

    assert dept_b["fullName"] == "Sunita Deshmukh"
    assert dept_b["phone"] == "9822099999"
    assert dept_b["residence_district"] == "Nashik"
    assert dept_b["income_bracket"] == "BELOW_2L"
    assert dept_b["employment_category"] == "JOB_SEEKER"

def test_legacy_pipe_bidirectional():
    legacy_str = "CIT003|Suresh Shinde|Satara|MH"
    canonical = DataTransformationEngine.to_canonical_from_legacy(legacy_str)

    assert canonical["citizen"]["id"] == "CIT003"
    assert canonical["citizen"]["name"] == "Suresh Shinde"
    assert canonical["citizen"]["address"]["district"] == "Satara"
    assert canonical["citizen"]["address"]["state"] == "Maharashtra"

    # Transform back to legacy
    re_legacy = DataTransformationEngine.from_canonical_to_legacy(canonical)
    assert re_legacy == "CIT003|Suresh Shinde|Satara|MH"

def test_trace_transformation():
    raw_dept_a = {
        "citizen_name": "Demo Citizen",
        "mobile_no": "9999999999",
        "dob": "1998-05-12",
        "district": "Pune"
    }
    trace = DataTransformationEngine.trace_transformation("DEPT_A", "DEPT_B", raw_dept_a)

    assert trace["source_department"] == "DEPT_A"
    assert trace["target_department"] == "DEPT_B"
    assert "stage_1_raw_source" in trace
    assert "stage_2_canonical_model" in trace
    assert "stage_3_transformed_target" in trace
    assert trace["stage_3_transformed_target"]["fullName"] == "Demo Citizen"
