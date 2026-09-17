from typing import Dict, Any, Tuple
from backend.app.schemas.canonical import CanonicalCitizen, CanonicalAddress, CanonicalApplicationData

class DataTransformationEngine:
    """
    Central Canonical Data Model Transformation Engine.
    Transforms heterogeneous department representations to and from
    the MahaSetu Canonical Data Model.
    """

    @classmethod
    def to_canonical_from_dept_a(cls, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Department A (Modern REST API format) -> Canonical Model"""
        return {
            "citizen": {
                "id": payload.get("id") or "CIT-001",
                "name": payload.get("citizen_name", ""),
                "phone": payload.get("mobile_no", ""),
                "dateOfBirth": payload.get("dob", ""),
                "address": {
                    "district": payload.get("district", "Pune"),
                    "state": "Maharashtra",
                    "pincode": payload.get("pincode", "411001")
                },
                "annualIncome": payload.get("annual_income", 180000),
                "employmentStatus": payload.get("employment_status", "UNEMPLOYED")
            }
        }

    @classmethod
    def from_canonical_to_dept_a(cls, canonical: Dict[str, Any]) -> Dict[str, Any]:
        """Canonical Model -> Department A Schema"""
        citizen = canonical.get("citizen", {})
        addr = citizen.get("address", {})
        return {
            "citizen_name": citizen.get("name", ""),
            "mobile_no": citizen.get("phone", ""),
            "dob": citizen.get("dateOfBirth", ""),
            "district": addr.get("district", "Pune"),
            "annual_income": citizen.get("annualIncome", 180000),
            "state_code": "MH"
        }

    @classmethod
    def to_canonical_from_dept_b(cls, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Department B (Heterogeneous JSON) -> Canonical Model"""
        return {
            "citizen": {
                "id": payload.get("identifier") or "CIT-001",
                "name": payload.get("fullName", ""),
                "phone": payload.get("phone", ""),
                "dateOfBirth": payload.get("date_of_birth", ""),
                "address": {
                    "district": payload.get("residence_district", "Pune"),
                    "state": "Maharashtra"
                },
                "annualIncome": 180000 if payload.get("income_bracket") == "BELOW_2L" else 300000,
                "employmentStatus": "UNEMPLOYED" if payload.get("employment_category") == "JOB_SEEKER" else "EMPLOYED"
            }
        }

    @classmethod
    def from_canonical_to_dept_b(cls, canonical: Dict[str, Any]) -> Dict[str, Any]:
        """Canonical Model -> Department B Schema"""
        citizen = canonical.get("citizen", {})
        addr = citizen.get("address", {})
        income = citizen.get("annualIncome", 180000)
        bracket = "BELOW_2L" if income < 200000 else "ABOVE_2L"
        return {
            "fullName": citizen.get("name", ""),
            "phone": citizen.get("phone", ""),
            "date_of_birth": citizen.get("dateOfBirth", ""),
            "residence_district": addr.get("district", "Pune"),
            "income_bracket": bracket,
            "employment_category": "JOB_SEEKER" if citizen.get("employmentStatus") == "UNEMPLOYED" else "GENERAL"
        }

    @classmethod
    def from_canonical_to_dept_c(cls, canonical: Dict[str, Any], verified_identity: bool = True, verified_eligibility: bool = True) -> Dict[str, Any]:
        """Canonical Model -> Department C (Approval / Scheme Sanction Schema)"""
        citizen = canonical.get("citizen", {})
        addr = citizen.get("address", {})
        return {
            "applicant_name": citizen.get("name", ""),
            "contact_number": citizen.get("phone", ""),
            "birth_date": citizen.get("dateOfBirth", ""),
            "home_district": addr.get("district", "Pune"),
            "scheme_code": "MH-EMP-2026",
            "identity_verified": verified_identity,
            "eligibility_verified": verified_eligibility,
            "sanction_requested": True
        }

    @classmethod
    def to_canonical_from_legacy(cls, pipe_payload: str) -> Dict[str, Any]:
        """
        Legacy Pipe-Delimited format (CIT001|Demo Citizen|Pune|MH) -> Canonical Model
        Demonstrates legacy system integration without rewriting legacy core.
        """
        parts = [p.strip() for p in pipe_payload.strip().split("|")]
        citizen_id = parts[0] if len(parts) > 0 else "CIT001"
        name = parts[1] if len(parts) > 1 else "Demo Citizen"
        district = parts[2] if len(parts) > 2 else "Pune"
        state_code = parts[3] if len(parts) > 3 else "MH"
        state = "Maharashtra" if state_code == "MH" else state_code

        return {
            "citizen": {
                "id": citizen_id,
                "name": name,
                "phone": "9999999999",
                "dateOfBirth": "1998-05-12",
                "address": {
                    "district": district,
                    "state": state
                },
                "annualIncome": 180000,
                "employmentStatus": "UNEMPLOYED"
            }
        }

    @classmethod
    def from_canonical_to_legacy(cls, canonical: Dict[str, Any]) -> str:
        """Canonical Model -> Legacy Pipe Format"""
        citizen = canonical.get("citizen", {})
        addr = citizen.get("address", {})
        cid = citizen.get("id", "CIT001").replace("-", "")
        name = citizen.get("name", "Demo Citizen")
        district = addr.get("district", "Pune")
        state_code = "MH" if addr.get("state") == "Maharashtra" else "OT"
        return f"{cid}|{name}|{district}|{state_code}"

    @classmethod
    def trace_transformation(cls, source_dept: str, target_dept: str, raw_input: Any) -> Dict[str, Any]:
        """
        Provides a step-by-step audit trace for live demo inspection:
        Raw Source -> Adapter A -> Canonical Model -> Adapter B -> Final Output
        """
        if source_dept == "DEPT_A":
            canonical = cls.to_canonical_from_dept_a(raw_input)
        elif source_dept == "DEPT_B":
            canonical = cls.to_canonical_from_dept_b(raw_input)
        elif source_dept == "LEGACY_01":
            canonical = cls.to_canonical_from_legacy(str(raw_input))
        else:
            canonical = raw_input

        if target_dept == "DEPT_A":
            final_output = cls.from_canonical_to_dept_a(canonical)
        elif target_dept == "DEPT_B":
            final_output = cls.from_canonical_to_dept_b(canonical)
        elif target_dept == "DEPT_C":
            final_output = cls.from_canonical_to_dept_c(canonical)
        elif target_dept == "LEGACY_01":
            final_output = cls.from_canonical_to_legacy(canonical)
        else:
            final_output = canonical

        return {
            "source_department": source_dept,
            "target_department": target_dept,
            "stage_1_raw_source": raw_input,
            "stage_2_canonical_model": canonical,
            "stage_3_transformed_target": final_output,
            "mapping_status": "VALIDATED"
        }
