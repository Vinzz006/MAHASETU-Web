import re
import uuid
from typing import Any

from backend.app.database import utc_now
from backend.app.models.mdm import (
    CitizenMasterRecord,
    IdentifierRegistry,
    MDMMatchReview,
)
from backend.app.services.audit import create_audit_log
from fastapi import HTTPException
from sqlalchemy.orm import Session


class MasterDataManagementService:
    """
    Master Data Management (MDM) Service.
    Maintains Golden Records for citizens across disparate departmental systems.
    Executes multi-attribute confidence scoring deduplication and maintains
    the Identifier Mapping Layer (e.g. Dept A: A-12345, Dept B: B-77891 -> MahaSetu: MS-000123).
    """

    AUTO_MATCH_THRESHOLD = 0.85
    AMBIGUOUS_THRESHOLD = 0.50

    @classmethod
    def calculate_match_confidence(
        cls, incoming: dict[str, Any], candidate: CitizenMasterRecord
    ) -> tuple[float, dict[str, Any]]:
        """
        Calculates multi-attribute match confidence score between incoming record and existing master record.
        Weights:
        - Mobile exact match: 0.35
        - Primary Email match: 0.20
        - Full Name match (token/exact): 0.20
        - Date of Birth match: 0.15
        - District/Pincode match: 0.10
        """
        score = 0.0
        breakdown = {}

        # 1. Mobile Phone (0.35)
        inc_phone = re.sub(
            r"\D", "", incoming.get("phone") or incoming.get("mobile") or ""
        )
        cand_phone = re.sub(r"\D", "", candidate.primary_mobile or "")
        if inc_phone and cand_phone and inc_phone[-10:] == cand_phone[-10:]:
            score += 0.35
            breakdown["mobile_match"] = {"weight": 0.35, "matched": True}
        else:
            breakdown["mobile_match"] = {"weight": 0.35, "matched": False}

        # 2. Email Address (0.20)
        inc_email = (incoming.get("email") or "").strip().lower()
        cand_email = (candidate.primary_email or "").strip().lower()
        if inc_email and cand_email and inc_email == cand_email:
            score += 0.20
            breakdown["email_match"] = {"weight": 0.20, "matched": True}
        else:
            breakdown["email_match"] = {"weight": 0.20, "matched": False}

        # 3. Name (0.20)
        inc_name = (
            (
                incoming.get("name")
                or incoming.get("full_name")
                or incoming.get("citizen_name")
                or ""
            )
            .strip()
            .lower()
        )
        cand_name = (candidate.full_name or "").strip().lower()
        if inc_name and cand_name:
            if inc_name == cand_name:
                score += 0.20
                breakdown["name_match"] = {
                    "weight": 0.20,
                    "type": "EXACT",
                    "matched": True,
                }
            else:
                inc_tokens = set(inc_name.split())
                cand_tokens = set(cand_name.split())
                common = inc_tokens.intersection(cand_tokens)
                if common:
                    partial = 0.20 * (
                        len(common) / max(len(inc_tokens), len(cand_tokens))
                    )
                    score += partial
                    breakdown["name_match"] = {
                        "weight": round(partial, 2),
                        "type": "PARTIAL",
                        "matched": True,
                    }
                else:
                    breakdown["name_match"] = {
                        "weight": 0.0,
                        "type": "NONE",
                        "matched": False,
                    }
        else:
            breakdown["name_match"] = {"weight": 0.0, "matched": False}

        # 4. Date of Birth (0.15)
        inc_dob = (
            incoming.get("dateOfBirth")
            or incoming.get("dob")
            or incoming.get("date_of_birth")
            or ""
        )[:10]
        cand_dob = (candidate.date_of_birth or "")[:10]
        if inc_dob and cand_dob and inc_dob == cand_dob:
            score += 0.15
            breakdown["dob_match"] = {"weight": 0.15, "matched": True}
        else:
            breakdown["dob_match"] = {"weight": 0.15, "matched": False}

        # 5. District / Location (0.10)
        inc_addr = (
            incoming.get("address") if isinstance(incoming.get("address"), dict) else {}
        )
        inc_dist = (
            (inc_addr.get("district") or incoming.get("district") or "").strip().lower()
        )
        cand_dist = (candidate.district or "").strip().lower()
        if inc_dist and cand_dist and inc_dist == cand_dist:
            score += 0.10
            breakdown["district_match"] = {"weight": 0.10, "matched": True}
        else:
            breakdown["district_match"] = {"weight": 0.10, "matched": False}

        final_score = round(min(score, 1.0), 3)
        return final_score, breakdown

    @classmethod
    def match_or_register_citizen(
        cls,
        db: Session,
        incoming: dict[str, Any],
        source_system: str,
        source_identifier: str,
        identifier_type: str = "LOCAL_DEPT_ID",
        actor_id: str = "SYSTEM",
    ) -> dict[str, Any]:
        """
        Core MDM resolution method:
        1. Checks if source_identifier is already linked in IdentifierRegistry.
        2. Evaluates candidates using multi-attribute scoring.
        3. High confidence (>=0.85): links identifier to existing golden record.
        4. Ambiguous (0.50 - 0.84): flags for human officer review; creates pending review item.
        5. Low confidence (<0.50): provisions a new Golden Record (MS-XXXXXX) and links identifier.
        """
        # Step 1: Check existing identifier mapping
        existing_mapping = (
            db.query(IdentifierRegistry)
            .filter(
                IdentifierRegistry.source_system == source_system,
                IdentifierRegistry.source_identifier == source_identifier,
                IdentifierRegistry.is_active == True,
            )
            .first()
        )

        if existing_mapping:
            master = (
                db.query(CitizenMasterRecord)
                .filter(CitizenMasterRecord.master_id == existing_mapping.master_id)
                .first()
            )
            return {
                "action": "EXISTING_LINKAGE",
                "master_id": master.master_id if master else existing_mapping.master_id,
                "confidence_score": 1.0,
                "golden_record": cls._format_master_record(master) if master else None,
                "source_system": source_system,
                "source_identifier": source_identifier,
            }

        # Step 2: Search potential candidates
        phone = re.sub(r"\D", "", incoming.get("phone") or incoming.get("mobile") or "")
        email = (incoming.get("email") or "").strip().lower()
        name = (
            incoming.get("name")
            or incoming.get("full_name")
            or incoming.get("citizen_name")
            or ""
        ).strip()

        candidates = (
            db.query(CitizenMasterRecord)
            .filter(CitizenMasterRecord.status == "ACTIVE")
            .all()
        )

        best_score = 0.0
        best_candidate: CitizenMasterRecord | None = None
        best_breakdown = {}

        for cand in candidates:
            score, breakdown = cls.calculate_match_confidence(incoming, cand)
            if score > best_score:
                best_score = score
                best_candidate = cand
                best_breakdown = breakdown

        # Step 3: Branching on score
        # 3A. Strong Match (>= 0.85) -> Link
        if best_candidate and best_score >= cls.AUTO_MATCH_THRESHOLD:
            mapping = IdentifierRegistry(
                master_id=best_candidate.master_id,
                source_system=source_system,
                source_identifier=source_identifier,
                identifier_type=identifier_type,
                is_active=True,
                metadata_json={
                    "match_score": best_score,
                    "matched_at": utc_now().isoformat(),
                },
            )
            db.add(mapping)
            best_candidate.record_version += 1
            best_candidate.updated_at = utc_now()
            db.commit()

            create_audit_log(
                db,
                actor_id,
                "MDM_IDENTIFIER_LINKED",
                "MDM",
                metadata={
                    "master_id": best_candidate.master_id,
                    "source_system": source_system,
                    "source_identifier": source_identifier,
                    "score": best_score,
                },
            )

            return {
                "action": "AUTO_MATCHED_AND_LINKED",
                "master_id": best_candidate.master_id,
                "confidence_score": best_score,
                "matching_breakdown": best_breakdown,
                "golden_record": cls._format_master_record(best_candidate),
                "source_system": source_system,
                "source_identifier": source_identifier,
            }

        # 3B. Ambiguous Match (0.50 <= score < 0.85) -> Review Queue
        elif best_candidate and best_score >= cls.AMBIGUOUS_THRESHOLD:
            review = MDMMatchReview(
                incoming_record=incoming,
                candidate_master_id=best_candidate.master_id,
                confidence_score=best_score,
                matching_criteria=best_breakdown,
                status="PENDING_REVIEW",
            )
            db.add(review)
            db.commit()
            db.refresh(review)

            create_audit_log(
                db,
                actor_id,
                "MDM_AMBIGUOUS_MATCH_FLAGGED",
                "MDM",
                metadata={
                    "review_id": review.id,
                    "candidate_master_id": best_candidate.master_id,
                    "score": best_score,
                },
            )

            return {
                "action": "AMBIGUOUS_MATCH_FLAGGED_FOR_REVIEW",
                "review_id": review.id,
                "candidate_master_id": best_candidate.master_id,
                "confidence_score": best_score,
                "matching_breakdown": best_breakdown,
                "message": "Potential match found with partial confidence. Sent to Officer Review Queue to prevent accidental merge.",
            }

        # 3C. No Match (< 0.50) -> Create New Golden Record
        else:
            # Generate new Golden Master ID: MS-XXXXXX
            seq = db.query(CitizenMasterRecord).count() + 1
            master_id = f"MS-{seq:06d}"

            addr = (
                incoming.get("address")
                if isinstance(incoming.get("address"), dict)
                else {}
            )
            district = addr.get("district") or incoming.get("district") or "Pune"

            new_master = CitizenMasterRecord(
                master_id=master_id,
                full_name=name or "New Citizen",
                date_of_birth=(
                    incoming.get("dateOfBirth") or incoming.get("dob") or "1998-01-01"
                )[:10],
                gender=incoming.get("gender", "MALE"),
                primary_mobile=phone or "9999999999",
                primary_email=email or f"citizen_{master_id.lower()}@mahasetu.gov.in",
                district=district,
                state=addr.get("state", "Maharashtra"),
                pincode=addr.get("pincode", "411001"),
                confidence_score=1.0,
                source_of_truth=source_system,
                record_version=1,
                status="ACTIVE",
            )
            db.add(new_master)

            mapping = IdentifierRegistry(
                master_id=master_id,
                source_system=source_system,
                source_identifier=source_identifier,
                identifier_type=identifier_type,
                is_active=True,
            )
            db.add(mapping)
            db.commit()
            db.refresh(new_master)

            create_audit_log(
                db,
                actor_id,
                "MDM_MASTER_RECORD_CREATED",
                "MDM",
                metadata={
                    "master_id": master_id,
                    "source_system": source_system,
                    "source_identifier": source_identifier,
                },
            )

            return {
                "action": "NEW_MASTER_CREATED",
                "master_id": master_id,
                "confidence_score": 1.0,
                "golden_record": cls._format_master_record(new_master),
                "source_system": source_system,
                "source_identifier": source_identifier,
            }

    @classmethod
    def list_master_records(cls, db: Session, limit: int = 50) -> list[dict[str, Any]]:
        records = (
            db.query(CitizenMasterRecord)
            .filter(CitizenMasterRecord.status == "ACTIVE")
            .order_by(CitizenMasterRecord.created_at.desc())
            .limit(limit)
            .all()
        )
        return [cls._format_master_record(r) for r in records]

    @classmethod
    def get_master_record(cls, db: Session, master_id: str) -> dict[str, Any]:
        record = (
            db.query(CitizenMasterRecord)
            .filter(CitizenMasterRecord.master_id == master_id)
            .first()
        )
        if not record:
            raise HTTPException(
                status_code=404, detail=f"Citizen Master Record '{master_id}' not found"
            )
        return cls._format_master_record(record)

    @classmethod
    def list_pending_reviews(cls, db: Session) -> list[dict[str, Any]]:
        reviews = (
            db.query(MDMMatchReview)
            .filter(MDMMatchReview.status == "PENDING_REVIEW")
            .order_by(MDMMatchReview.created_at.desc())
            .all()
        )
        return [
            {
                "id": r.id,
                "incoming_record": r.incoming_record,
                "candidate_master_id": r.candidate_master_id,
                "confidence_score": r.confidence_score,
                "matching_criteria": r.matching_criteria,
                "status": r.status,
                "created_at": r.created_at.isoformat(),
            }
            for r in reviews
        ]

    @classmethod
    def resolve_review(
        cls,
        db: Session,
        review_id: str,
        decision: str,  # "MERGE" or "CREATE_NEW" or "REJECT"
        officer_id: str,
        notes: str | None = None,
    ) -> dict[str, Any]:
        review = db.query(MDMMatchReview).filter(MDMMatchReview.id == review_id).first()
        if not review:
            raise HTTPException(status_code=404, detail="Review request not found")

        dec = decision.upper()
        if dec == "MERGE":
            # Link incoming record source_id to candidate
            candidate = (
                db.query(CitizenMasterRecord)
                .filter(CitizenMasterRecord.master_id == review.candidate_master_id)
                .first()
            )
            if candidate:
                inc = review.incoming_record
                src_sys = inc.get("source_system", "DEPT_OFFICER_MERGE")
                src_id = (
                    inc.get("source_identifier") or f"MANUAL-{uuid.uuid4().hex[:6]}"
                )
                mapping = IdentifierRegistry(
                    master_id=candidate.master_id,
                    source_system=src_sys,
                    source_identifier=src_id,
                    identifier_type="MANUAL_MERGE",
                    is_active=True,
                )
                db.add(mapping)
                candidate.record_version += 1
                candidate.updated_at = utc_now()

            review.status = "RESOLVED_MERGE"
        elif dec == "CREATE_NEW":
            # Create new master
            seq = db.query(CitizenMasterRecord).count() + 1
            master_id = f"MS-{seq:06d}"
            inc = review.incoming_record
            new_master = CitizenMasterRecord(
                master_id=master_id,
                full_name=inc.get("name") or inc.get("full_name") or "New Citizen",
                date_of_birth=(
                    inc.get("dateOfBirth") or inc.get("dob") or "1998-01-01"
                )[:10],
                primary_mobile=inc.get("phone") or inc.get("mobile") or "9999999999",
                primary_email=inc.get("email")
                or f"citizen_{master_id.lower()}@mahasetu.gov.in",
                district=inc.get("district", "Pune"),
                source_of_truth="OFFICER_MANUAL_REVIEW",
                record_version=1,
                status="ACTIVE",
            )
            db.add(new_master)
            review.status = "RESOLVED_NEW"
        else:
            review.status = "REJECTED"

        review.reviewed_by = officer_id
        review.reviewed_at = utc_now()
        review.resolution_notes = notes
        db.commit()

        create_audit_log(
            db,
            officer_id,
            f"MDM_REVIEW_{review.status}",
            "MDM",
            metadata={
                "review_id": review.id,
                "decision": review.status,
                "notes": notes,
            },
        )

        return {
            "status": "SUCCESS",
            "review_id": review.id,
            "resolution": review.status,
            "reviewed_by": officer_id,
        }

    @classmethod
    def _format_master_record(cls, record: CitizenMasterRecord) -> dict[str, Any]:
        return {
            "master_id": record.master_id,
            "full_name": record.full_name,
            "date_of_birth": record.date_of_birth,
            "gender": record.gender,
            "primary_mobile": record.primary_mobile,
            "primary_email": record.primary_email,
            "district": record.district,
            "taluka": record.taluka,
            "state": record.state,
            "pincode": record.pincode,
            "confidence_score": record.confidence_score,
            "source_of_truth": record.source_of_truth,
            "record_version": record.record_version,
            "status": record.status,
            "linked_identifiers": [
                {
                    "source_system": i.source_system,
                    "source_identifier": i.source_identifier,
                    "identifier_type": i.identifier_type,
                    "is_active": i.is_active,
                    "created_at": i.created_at.isoformat(),
                }
                for i in record.identifiers
                if i.is_active
            ],
            "created_at": record.created_at.isoformat() if record.created_at else None,
            "updated_at": record.updated_at.isoformat() if record.updated_at else None,
        }
