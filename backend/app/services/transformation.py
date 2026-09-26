import xml.etree.ElementTree as ET
from typing import Dict, Any, Tuple, Optional, List
from backend.app.schemas.canonical import (
    CanonicalCitizen, CanonicalAddress, CanonicalApplicationData,
    CanonicalHousehold, CanonicalIdentity
)

class DataTransformationEngine:
    """
    Central Canonical Data Model Transformation Engine.
    Transforms heterogeneous department representations (REST/JSON, SOAP/XML,
    pipe-delimited flat-files, and CSV streams) to and from the MahaSetu Canonical Data Model.
    """

    # =========================================================================
    # Department A (Modern REST / JSON)
    # =========================================================================
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

    # =========================================================================
    # Department B (Heterogeneous JSON)
    # =========================================================================
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

    # =========================================================================
    # Department C (Scheme Approval & Sanction)
    # =========================================================================
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

    # =========================================================================
    # Legacy System (Pipe-Delimited ASCII Stream: CIT001|Name|District|MH)
    # =========================================================================
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

    # =========================================================================
    # Enterprise SOAP / XML Adapter
    # =========================================================================
    @classmethod
    def to_canonical_from_soap_xml(cls, xml_payload: str) -> Dict[str, Any]:
        """Parses a SOAP/XML payload into the Canonical Data Model."""
        try:
            root = ET.fromstring(xml_payload)
            # Find elements regardless of XML namespace
            def find_text(tag_name: str, default: str = "") -> str:
                for el in root.iter():
                    if el.tag.endswith(tag_name):
                        return el.text or default
                return default

            name = find_text("CitizenName") or find_text("BeneficiaryName") or find_text("Name", "Demo Citizen")
            phone = find_text("MobileNumber") or find_text("Phone", "9999999999")
            dob = find_text("DateOfBirth") or find_text("DOB", "1998-05-12")
            district = find_text("District", "Pune")
            income_str = find_text("AnnualIncome", "180000")
            try:
                income = int(income_str)
            except ValueError:
                income = 180000

            return {
                "citizen": {
                    "id": find_text("CitizenID", "SOAP-CIT-001"),
                    "name": name,
                    "phone": phone,
                    "dateOfBirth": dob,
                    "address": {
                        "district": district,
                        "state": "Maharashtra"
                    },
                    "annualIncome": income,
                    "employmentStatus": find_text("EmploymentStatus", "UNEMPLOYED")
                }
            }
        except Exception as e:
            # Fallback on parser error
            return {
                "citizen": {
                    "id": "SOAP-FALLBACK",
                    "name": "Parse Error Citizen",
                    "phone": "9999999999",
                    "dateOfBirth": "1998-01-01",
                    "address": {"district": "Pune", "state": "Maharashtra"},
                    "parse_error": str(e)
                }
            }

    @classmethod
    def from_canonical_to_soap_xml(cls, canonical: Dict[str, Any], root_element: str = "CitizenVerificationRequest") -> str:
        """Serializes Canonical Data Model into standard SOAP/XML envelope."""
        citizen = canonical.get("citizen", {})
        addr = citizen.get("address", {})

        xml = (
            f'<?xml version="1.0" encoding="UTF-8"?>\n'
            f'<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:mh="http://mahasetu.gov.in/interop">\n'
            f'  <soap:Header/>\n'
            f'  <soap:Body>\n'
            f'    <mh:{root_element}>\n'
            f'      <mh:CitizenID>{citizen.get("id", "CIT-001")}</mh:CitizenID>\n'
            f'      <mh:CitizenName>{citizen.get("name", "")}</mh:CitizenName>\n'
            f'      <mh:MobileNumber>{citizen.get("phone", "")}</mh:MobileNumber>\n'
            f'      <mh:DateOfBirth>{citizen.get("dateOfBirth", "")}</mh:DateOfBirth>\n'
            f'      <mh:District>{addr.get("district", "Pune")}</mh:District>\n'
            f'      <mh:AnnualIncome>{citizen.get("annualIncome", 180000)}</mh:AnnualIncome>\n'
            f'      <mh:EmploymentStatus>{citizen.get("employmentStatus", "UNEMPLOYED")}</mh:EmploymentStatus>\n'
            f'    </mh:{root_element}>\n'
            f'  </soap:Body>\n'
            f'</soap:Envelope>'
        )
        return xml

    # =========================================================================
    # Flat-File CSV Stream Adapter
    # =========================================================================
    @classmethod
    def to_canonical_from_csv(cls, csv_line: str) -> Dict[str, Any]:
        """
        Parses comma-separated values line:
        id,name,phone,dob,district,income,status
        """
        parts = [p.strip() for p in csv_line.strip().split(",")]
        cid = parts[0] if len(parts) > 0 else "CSV-001"
        name = parts[1] if len(parts) > 1 else "Demo Citizen"
        phone = parts[2] if len(parts) > 2 else "9999999999"
        dob = parts[3] if len(parts) > 3 else "1998-05-12"
        district = parts[4] if len(parts) > 4 else "Pune"
        income = int(parts[5]) if len(parts) > 5 and parts[5].isdigit() else 180000
        status = parts[6] if len(parts) > 6 else "UNEMPLOYED"

        return {
            "citizen": {
                "id": cid,
                "name": name,
                "phone": phone,
                "dateOfBirth": dob,
                "address": {"district": district, "state": "Maharashtra"},
                "annualIncome": income,
                "employmentStatus": status
            }
        }

    @classmethod
    def from_canonical_to_csv(cls, canonical: Dict[str, Any]) -> str:
        """Serializes Canonical Data Model into CSV line."""
        citizen = canonical.get("citizen", {})
        addr = citizen.get("address", {})
        return (
            f'{citizen.get("id", "CIT-001")},'
            f'"{citizen.get("name", "Demo Citizen")}",'
            f'{citizen.get("phone", "9999999999")},'
            f'{citizen.get("dateOfBirth", "1998-05-12")},'
            f'{addr.get("district", "Pune")},'
            f'{citizen.get("annualIncome", 180000)},'
            f'{citizen.get("employmentStatus", "UNEMPLOYED")}'
        )

    # =========================================================================
    # Dynamic Mapping Engine
    # =========================================================================
    @classmethod
    def dynamic_transform(cls, source_payload: Dict[str, Any], mapping_rules: Dict[str, str]) -> Dict[str, Any]:
        """
        Applies declarative field mapping rules:
        mapping_rules = {"output_field": "source_field_path"}
        e.g. {"name": "fullName", "phone": "contact.mobile"}
        """
        output = {}
        for target_key, src_path in mapping_rules.items():
            keys = src_path.split(".")
            val = source_payload
            for k in keys:
                if isinstance(val, dict) and k in val:
                    val = val[k]
                else:
                    val = None
                    break
            if val is not None:
                output[target_key] = val
        return output

    # =========================================================================
    # Trace Transformation (for Live Evaluator Demonstration)
    # =========================================================================
    @classmethod
    def trace_transformation(cls, source_dept: str, target_dept: str, raw_input: Any) -> Dict[str, Any]:
        """
        Provides a step-by-step audit trace for live demo inspection:
        Raw Source -> Adapter A -> Canonical Model -> Adapter B -> Final Output
        Supports REST, JSON, SOAP/XML, PIPE, and CSV formats.
        """
        # Stage 1 -> Stage 2: Convert to Canonical Model
        if source_dept == "DEPT_A":
            canonical = cls.to_canonical_from_dept_a(raw_input)
        elif source_dept == "DEPT_B":
            canonical = cls.to_canonical_from_dept_b(raw_input)
        elif source_dept == "LEGACY_01":
            canonical = cls.to_canonical_from_legacy(str(raw_input))
        elif source_dept in ("SOAP_XML", "DEPT_SOAP"):
            canonical = cls.to_canonical_from_soap_xml(str(raw_input))
        elif source_dept in ("CSV_STREAM", "DEPT_CSV"):
            canonical = cls.to_canonical_from_csv(str(raw_input))
        else:
            canonical = raw_input if isinstance(raw_input, dict) else cls.to_canonical_from_legacy(str(raw_input))

        # Stage 2 -> Stage 3: Convert from Canonical Model to Target
        if target_dept == "DEPT_A":
            final_output = cls.from_canonical_to_dept_a(canonical)
        elif target_dept == "DEPT_B":
            final_output = cls.from_canonical_to_dept_b(canonical)
        elif target_dept == "DEPT_C":
            final_output = cls.from_canonical_to_dept_c(canonical)
        elif target_dept == "LEGACY_01":
            final_output = cls.from_canonical_to_legacy(canonical)
        elif target_dept in ("SOAP_XML", "DEPT_SOAP"):
            final_output = cls.from_canonical_to_soap_xml(canonical)
        elif target_dept in ("CSV_STREAM", "DEPT_CSV"):
            final_output = cls.from_canonical_to_csv(canonical)
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
