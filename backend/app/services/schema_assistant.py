import difflib
from typing import List, Dict, Any

class SchemaMappingAssistant:
    """
    AI / Heuristic Schema Mapping Assistant.
    Analyzes heterogeneous departmental fields and computes semantic field similarity
    and type compatibility to assist administrators in configuring new connectors.
    Enforces that AI recommendations require explicit human approval before being applied.
    """

    KNOWN_SYNONYMS = {
        "citizen_name": ["full_name", "fullName", "name", "applicant_name", "candidate_name"],
        "mobile_no": ["phone", "mobile", "contact_number", "cell_phone", "contact"],
        "dob": ["date_of_birth", "birth_date", "birthdate", "dob_iso"],
        "district": ["residence_district", "home_district", "district_code", "city_district"],
        "annual_income": ["income_bracket", "family_income", "salary", "earnings"],
        "employment_status": ["employment_category", "job_status", "work_status"]
    }

    @classmethod
    def suggest_mappings(
        cls,
        source_fields: List[str],
        target_fields: List[str]
    ) -> List[Dict[str, Any]]:
        suggestions = []

        for src in source_fields:
            src_norm = src.lower().replace("-", "_").replace(" ", "_")
            best_match = None
            best_score = 0.0
            rationale = "String similarity"

            # 1. Direct match
            if src in target_fields:
                best_match = src
                best_score = 1.0
                rationale = "Exact name match"
            else:
                # 2. Check known ontological synonyms
                for canon_key, synonyms in cls.KNOWN_SYNONYMS.items():
                    all_syns = [canon_key] + synonyms
                    if any(s.lower() == src_norm for s in all_syns):
                        for tgt in target_fields:
                            tgt_norm = tgt.lower().replace("-", "_").replace(" ", "_")
                            if any(s.lower() == tgt_norm for s in all_syns):
                                best_match = tgt
                                best_score = 0.98 if "phone" in src_norm or "dob" in src_norm else 0.96
                                rationale = f"Semantic ontology match under '{canon_key}'"
                                break

                # 3. Fallback to sequence matcher
                if not best_match:
                    for tgt in target_fields:
                        tgt_norm = tgt.lower().replace("-", "_").replace(" ", "_")
                        ratio = difflib.SequenceMatcher(None, src_norm, tgt_norm).ratio()
                        if ratio > best_score and ratio >= 0.4:
                            best_score = round(ratio, 2)
                            best_match = tgt
                            rationale = f"Levenshtein syntactic proximity ({int(ratio*100)}%)"

            if best_match:
                suggestions.append({
                    "source_field": src,
                    "target_field": best_match,
                    "confidence": round(best_score, 2),
                    "confidence_percentage": f"{int(best_score * 100)}%",
                    "rationale": rationale,
                    "status": "PROPOSED", # Requires human approval
                    "suggested_transformation": "direct_copy" if best_score > 0.8 else "type_cast_string"
                })

        return suggestions

    @classmethod
    def get_demo_schemas(cls) -> Dict[str, Any]:
        """Provides sample source and target schemas for demo evaluation."""
        dept_a_fields = ["citizen_name", "mobile_no", "dob", "district", "annual_income"]
        dept_b_fields = ["fullName", "phone", "date_of_birth", "residence_district", "income_bracket", "employment_category"]
        dept_c_fields = ["applicant_name", "contact_number", "birth_date", "home_district", "scheme_code"]

        return {
            "dept_a": {"name": "Department A (Identity)", "fields": dept_a_fields},
            "dept_b": {"name": "Department B (Eligibility)", "fields": dept_b_fields},
            "dept_c": {"name": "Department C (Employment)", "fields": dept_c_fields},
            "canonical": {
                "name": "MahaSetu Canonical Model",
                "fields": ["name", "phone", "dateOfBirth", "address.district", "annualIncome", "employmentStatus"]
            }
        }
