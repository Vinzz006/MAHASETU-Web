from datetime import datetime, timezone
from typing import Any

from backend.app.events.publisher import publish_event
from backend.app.integrations import get_connector
from backend.app.models.application import Application
from backend.app.models.consent import Consent
from backend.app.models.transaction import DepartmentTransaction
from backend.app.models.workflow import WorkflowDefinition, WorkflowStep
from backend.app.services.audit import create_audit_log
from backend.app.services.consent import ConsentManager
from fastapi import HTTPException
from sqlalchemy.orm import Session

WORKFLOW_PIPELINE = [
    {
        "step_name": "APPLICATION_CREATED",
        "department_id": "PORTAL",
        "title": "Application Initiated",
        "description": "Universal Application ID issued and registered in MahaSetu Hub.",
    },
    {
        "step_name": "CONSENT_GRANTED",
        "department_id": "PORTAL",
        "title": "Citizen Consent Authorized",
        "description": "Citizen approved cross-departmental data sharing for employment support.",
    },
    {
        "step_name": "IDENTITY_VERIFICATION",
        "department_id": "DEPT_A",
        "title": "Department A Identity Verification",
        "description": "Verification of citizen name, DOB, and district via modern REST API.",
    },
    {
        "step_name": "ELIGIBILITY_VERIFICATION",
        "department_id": "DEPT_B",
        "title": "Department B Eligibility Evaluation",
        "description": "Evaluation of income and employment criteria via heterogeneous JSON schema.",
    },
    {
        "step_name": "DEPARTMENT_APPROVAL",
        "department_id": "DEPT_C",
        "title": "Department C Scheme Sanction",
        "description": "Final approval and sanction by Employment Department.",
    },
    {
        "step_name": "ADMIN_REVIEW",
        "department_id": "ADMIN",
        "title": "Administrative Review & Sanction Sign-off",
        "description": "State Administrator verification and sanction clearance.",
    },
    {
        "step_name": "AUDITOR_REVIEW",
        "department_id": "AUDIT",
        "title": "Independent Auditor Compliance Verification",
        "description": "Independent oversight review and data integrity validation.",
    },
    {
        "step_name": "APPLICATION_COMPLETED",
        "department_id": "PORTAL",
        "title": "Service Passport Finalized",
        "description": "Sanction order generated and unified tracking journey completed.",
    },
]

DEFAULT_WORKFLOW_DEFINITIONS = [
    {
        "id": "WF-DEF-EMPLOYMENT",
        "service_id": "employment-support",
        "name": "Maharashtra Employment Support Scheme Workflow",
        "version": "1.0.0",
        "description": "Standard 8-step cross-departmental verification, sanction, admin sign-off, and audit workflow.",
        "definition_json": {
            "initial_step": "APPLICATION_CREATED",
            "steps": WORKFLOW_PIPELINE,
            "transitions": {
                "APPLICATION_CREATED": {"SUCCESS": "CONSENT_GRANTED"},
                "CONSENT_GRANTED": {"SUCCESS": "IDENTITY_VERIFICATION"},
                "IDENTITY_VERIFICATION": {"SUCCESS": "ELIGIBILITY_VERIFICATION"},
                "ELIGIBILITY_VERIFICATION": {
                    "SUCCESS": "DEPARTMENT_APPROVAL",
                    "FAILURE": "EXCEPTION",
                },
                "DEPARTMENT_APPROVAL": {"SUCCESS": "ADMIN_REVIEW"},
                "ADMIN_REVIEW": {"APPROVE": "AUDITOR_REVIEW", "REWORK": "REWORK"},
                "AUDITOR_REVIEW": {"CONFIRM": "APPLICATION_COMPLETED"},
                "APPLICATION_COMPLETED": {},
            },
        },
    },
    {
        "id": "WF-DEF-CASTE-CERT",
        "service_id": "caste-certificate",
        "name": "Caste & Domicile Verification Workflow",
        "version": "1.0.0",
        "description": "Cross-verification with civil identity and legacy land records.",
        "definition_json": {
            "initial_step": "APPLICATION_CREATED",
            "steps": [
                {
                    "step_name": "APPLICATION_CREATED",
                    "department_id": "PORTAL",
                    "title": "Application Initiated",
                    "description": "Application registered in MahaSetu",
                },
                {
                    "step_name": "CONSENT_GRANTED",
                    "department_id": "PORTAL",
                    "title": "Citizen Consent Authorized",
                    "description": "Consent for land and identity lookup",
                },
                {
                    "step_name": "IDENTITY_VERIFICATION",
                    "department_id": "DEPT_A",
                    "title": "Identity Verification",
                    "description": "Verified via modern REST API",
                },
                {
                    "step_name": "LEGACY_ARCHIVE_VERIFICATION",
                    "department_id": "LEGACY_01",
                    "title": "Legacy Land Archive Verification",
                    "description": "Verified via 25-yr mainframe archive",
                },
                {
                    "step_name": "APPLICATION_COMPLETED",
                    "department_id": "PORTAL",
                    "title": "Certificate Issued",
                    "description": "Digital certificate issued",
                },
            ],
        },
    },
]


class WorkflowEngine:
    """
    Configurable Interoperability Workflow Engine.
    Coordinates multi-department transactions, enforces consent checks,
    handles retries and exception states, and generates audit trails.
    """

    @classmethod
    def seed_workflow_definitions_if_empty(cls, db: Session):
        """Ensures default workflow definitions exist in the database."""
        if db.query(WorkflowDefinition).count() == 0:
            for d in DEFAULT_WORKFLOW_DEFINITIONS:
                defn = WorkflowDefinition(
                    id=d["id"],
                    service_id=d["service_id"],
                    name=d["name"],
                    version=d["version"],
                    description=d["description"],
                    definition_json=d["definition_json"],
                    is_active=True,
                )
                db.add(defn)
            db.commit()

    @classmethod
    def initialize_workflow(cls, db: Session, application_id: str):
        """Initializes the workflow steps pipeline for a new application based on its service definition."""
        cls.seed_workflow_definitions_if_empty(db)
        app = db.query(Application).filter(Application.id == application_id).first()

        steps_def = WORKFLOW_PIPELINE
        if app and app.service_id:
            defn = (
                db.query(WorkflowDefinition)
                .filter(WorkflowDefinition.service_id == app.service_id)
                .first()
            )
            if (
                defn
                and isinstance(defn.definition_json, dict)
                and "steps" in defn.definition_json
            ):
                steps_def = defn.definition_json["steps"]

        for step_def in steps_def:
            step = WorkflowStep(
                application_id=application_id,
                step_name=step_def["step_name"],
                department_id=step_def["department_id"],
                status=(
                    "COMPLETED"
                    if step_def["step_name"] == "APPLICATION_CREATED"
                    else "PENDING"
                ),
                started_at=(
                    datetime.now(timezone.utc).replace(tzinfo=None)
                    if step_def["step_name"] == "APPLICATION_CREATED"
                    else None
                ),
                completed_at=(
                    datetime.now(timezone.utc).replace(tzinfo=None)
                    if step_def["step_name"] == "APPLICATION_CREATED"
                    else None
                ),
                details={
                    "title": step_def.get("title", step_def["step_name"]),
                    "description": step_def.get("description", ""),
                },
            )
            db.add(step)
        db.commit()

    @classmethod
    def get_application_workflow(
        cls, db: Session, application_id: str
    ) -> list[WorkflowStep]:
        steps = (
            db.query(WorkflowStep)
            .filter(WorkflowStep.application_id == application_id)
            .all()
        )
        app = db.query(Application).filter(Application.id == application_id).first()
        order_map = {}
        if app and app.service_id:
            defn = (
                db.query(WorkflowDefinition)
                .filter(WorkflowDefinition.service_id == app.service_id)
                .first()
            )
            if (
                defn
                and isinstance(defn.definition_json, dict)
                and "steps" in defn.definition_json
            ):
                order_map = {
                    p["step_name"]: idx
                    for idx, p in enumerate(defn.definition_json["steps"])
                }
        if not order_map:
            order_map = {p["step_name"]: idx for idx, p in enumerate(WORKFLOW_PIPELINE)}
        return sorted(steps, key=lambda s: order_map.get(s.step_name, 999))

    @classmethod
    def advance_step(
        cls, db: Session, application_id: str, actor_id: str = "SYSTEM"
    ) -> dict[str, Any]:
        """
        Advances the application to the next step in the workflow pipeline.
        Enforces consent, executes department connectors, records payloads & retries.
        """
        app = db.query(Application).filter(Application.id == application_id).first()
        if not app:
            raise HTTPException(status_code=404, detail="Application not found")

        # Determine step order from definition or default pipeline
        order_list = WORKFLOW_PIPELINE
        if app.service_id:
            defn = (
                db.query(WorkflowDefinition)
                .filter(WorkflowDefinition.service_id == app.service_id)
                .first()
            )
            if (
                defn
                and isinstance(defn.definition_json, dict)
                and "steps" in defn.definition_json
            ):
                order_list = defn.definition_json["steps"]

        # Get all steps ordered as in workflow definition
        steps = (
            db.query(WorkflowStep)
            .filter(WorkflowStep.application_id == application_id)
            .all()
        )
        step_map = {s.step_name: s for s in steps}

        # Determine current incomplete step
        current_step = None
        for p in order_list:
            s = step_map.get(p["step_name"])
            if s and s.status in ["PENDING", "FAILED", "RETRYING"]:
                current_step = s
                break

        if not current_step:
            return {
                "application_id": app.id,
                "status": "ALREADY_COMPLETED",
                "message": "All workflow steps have already been successfully completed.",
            }

        step_name = current_step.step_name
        current_step.status = "IN_PROGRESS"
        current_step.started_at = datetime.now(timezone.utc).replace(tzinfo=None)
        db.commit()

        # Build canonical citizen model for execution
        citizen_data = app.citizen_data or {}
        canonical_model = {
            "citizen": {
                "id": app.citizen.id if app.citizen else "CIT-001",
                "name": citizen_data.get("name")
                or (app.citizen.name if app.citizen else "Demo Citizen"),
                "phone": citizen_data.get("mobile")
                or (app.citizen.mobile if app.citizen else "9999999999"),
                "dateOfBirth": citizen_data.get("dob", "1998-05-12"),
                "address": {
                    "district": citizen_data.get("district", "Pune"),
                    "state": "Maharashtra",
                    "pincode": "411001",
                },
                "annualIncome": citizen_data.get("annual_income", 180000),
                "employmentStatus": citizen_data.get("employment_status", "UNEMPLOYED"),
            },
            "serviceId": app.service_id,
            "applicationNumber": app.application_number,
        }

        # Step 1: CONSENT_GRANTED Check
        if step_name == "CONSENT_GRANTED":
            # Check if consent is authorized
            consent = (
                db.query(Consent)
                .filter(
                    Consent.application_id == application_id,
                    Consent.status == "AUTHORIZED",
                )
                .first()
            )

            if not consent:
                current_step.status = "PENDING"
                db.commit()
                raise HTTPException(
                    status_code=400,
                    detail="Cannot advance: Citizen consent has not been authorized yet.",
                )

            current_step.status = "COMPLETED"
            current_step.completed_at = datetime.now(timezone.utc).replace(tzinfo=None)
            app.status = "CONSENT_GRANTED"
            app.current_department = "DEPT_A"
            db.commit()

            publish_event("CONSENT_GRANTED", app.application_number, "PORTAL")
            create_audit_log(db, actor_id, "CONSENT_VERIFIED", "CONSENT", app.id)
            return {"step": step_name, "status": "COMPLETED"}

        # Step 2: Department A Identity Verification
        elif step_name == "IDENTITY_VERIFICATION":
            ConsentManager.validate_consent(db, app.id)

            connector = get_connector("DEPT_A")
            res = connector.verify_identity(canonical_model)

            # Record department transaction
            txn = DepartmentTransaction(
                application_id=app.id,
                department_id="DEPT_A",
                source_department="PORTAL",
                destination_department="DEPT_A",
                schema_version="v2.1-canonical",
                operation="verify_identity",
                request_payload=res.get("native_request_sent", {}),
                response_payload=res.get("native_response_received", {}),
                status="SUCCESS",
                retry_count=0,
            )
            db.add(txn)

            current_step.status = "COMPLETED"
            current_step.completed_at = datetime.now(timezone.utc).replace(tzinfo=None)
            current_step.details = {
                "title": "Department A Identity Verification",
                "verification_id": res.get("verification_id"),
                "confidence_score": res.get("confidence_score"),
            }

            # Enriched data update
            if not app.citizen_data:
                app.citizen_data = {}
            app.citizen_data["aadhaar_verified"] = True
            app.citizen_data["identity_confidence"] = res.get("confidence_score")
            app.status = "IDENTITY_VERIFIED"
            app.current_department = "DEPT_B"
            db.commit()

            publish_event("IDENTITY_VERIFIED", app.application_number, "DEPT_A")
            create_audit_log(
                db,
                actor_id,
                "EXECUTE_STEP",
                "DEPT_A",
                app.id,
                {"verification_id": res.get("verification_id")},
            )

            return {
                "step": step_name,
                "status": "COMPLETED",
                "result": res,
                "message": "Identity successfully verified by Department A.",
            }

        # Step 3: Department B Eligibility Verification (Handles failure simulation and retries)
        elif step_name == "ELIGIBILITY_VERIFICATION":
            ConsentManager.validate_consent(db, app.id)

            connector = get_connector("DEPT_B")

            # Retries logic for resilience demonstration
            attempt = 0
            max_retries = 2
            res = None
            last_error = None
            success = False

            while attempt <= max_retries:
                try:
                    res = connector.verify_eligibility(
                        canonical_model, retry_attempt=attempt
                    )
                    success = True
                    break
                except Exception as ex:  # noqa: BLE001 - connector retry loop
                    last_error = str(ex)
                    attempt += 1

            if not success:
                # Record failed transaction and transition to EXCEPTION state
                txn = DepartmentTransaction(
                    application_id=app.id,
                    department_id="DEPT_B",
                    source_department="DEPT_A",
                    destination_department="DEPT_B",
                    schema_version="v2.1-canonical",
                    operation="verify_eligibility",
                    request_payload={"attempted_payload": canonical_model},
                    response_payload=None,
                    status="FAILED",
                    retry_count=max_retries,
                    error_message=last_error,
                )
                db.add(txn)

                current_step.status = "FAILED"
                current_step.details = {
                    "title": "Department B Eligibility Evaluation",
                    "error": last_error,
                    "retries": max_retries,
                    "state": "INTEGRATION_EXCEPTION",
                }
                app.status = "EXCEPTION"
                app.current_department = "DEPT_B"
                db.commit()

                publish_event(
                    "INTEGRATION_FAILED",
                    app.application_number,
                    "DEPT_B",
                    {"error": last_error, "retries": max_retries},
                )
                create_audit_log(
                    db,
                    actor_id,
                    "INTEGRATION_FAILED",
                    "DEPT_B",
                    app.id,
                    {"retries": max_retries, "error": last_error},
                )

                return {
                    "step": step_name,
                    "status": "EXCEPTION",
                    "retries": max_retries,
                    "error": last_error,
                    "message": "Integration exception encountered. Recorded in Officer Dashboard.",
                }

            # Success
            txn = DepartmentTransaction(
                application_id=app.id,
                department_id="DEPT_B",
                source_department="DEPT_A",
                destination_department="DEPT_B",
                schema_version="v2.1-canonical",
                operation="verify_eligibility",
                request_payload=res.get("native_request_sent", {}),
                response_payload=res.get("native_response_received", {}),
                status="SUCCESS",
                retry_count=attempt,
            )
            db.add(txn)

            current_step.status = "COMPLETED"
            current_step.completed_at = datetime.now(timezone.utc).replace(tzinfo=None)
            current_step.details = {
                "title": "Department B Eligibility Evaluation",
                "eligibility_status": res.get("eligibility_status"),
                "assigned_category": res.get("assigned_category"),
            }

            if not app.citizen_data:
                app.citizen_data = {}
            app.citizen_data["eligibility_status"] = res.get("eligibility_status")
            app.citizen_data["benefit_tier"] = res.get("assigned_category")
            app.status = "ELIGIBILITY_VERIFIED"
            app.current_department = "DEPT_C"
            db.commit()

            publish_event("ELIGIBILITY_VERIFIED", app.application_number, "DEPT_B")
            create_audit_log(
                db,
                actor_id,
                "EXECUTE_STEP",
                "DEPT_B",
                app.id,
                {"eligibility_status": res.get("eligibility_status")},
            )

            return {
                "step": step_name,
                "status": "COMPLETED",
                "result": res,
                "message": "Eligibility evaluation completed by Department B.",
            }

        # Step 4: Department C Approval & Sanction
        elif step_name == "DEPARTMENT_APPROVAL":
            ConsentManager.validate_consent(db, app.id)

            connector = get_connector("DEPT_C")
            res = connector.submit_application(canonical_model)

            txn = DepartmentTransaction(
                application_id=app.id,
                department_id="DEPT_C",
                source_department="DEPT_B",
                destination_department="DEPT_C",
                schema_version="v2.1-canonical",
                operation="submit_application",
                request_payload=res.get("native_request_sent", {}),
                response_payload=res.get("native_response_received", {}),
                status="SUCCESS",
                retry_count=0,
            )
            db.add(txn)

            current_step.status = "COMPLETED"
            current_step.completed_at = datetime.now(timezone.utc).replace(tzinfo=None)
            current_step.details = {
                "title": "Department C Scheme Sanction",
                "sanction_number": res.get("sanction_number"),
                "benefit_awarded": res.get("benefit_awarded"),
            }
            app.status = "APPROVAL_STARTED"
            app.current_department = "ADMIN"
            db.commit()

            publish_event("APPROVAL_STARTED", app.application_number, "DEPT_C")
            create_audit_log(
                db,
                actor_id,
                "APPROVAL_GRANTED",
                "DEPT_C",
                app.id,
                {"sanction_number": res.get("sanction_number")},
            )
            return {"step": step_name, "status": "COMPLETED", "result": res}

        # Step 5: Admin Review & Sanction Sign-off
        elif step_name == "ADMIN_REVIEW":
            now = datetime.now(timezone.utc).replace(tzinfo=None)
            current_step.status = "COMPLETED"
            current_step.completed_at = now
            current_step.timestamp = now
            current_step.verifier_id = actor_id
            current_step.details = {
                "title": "Administrative Review & Sanction Sign-off",
                "decision": "APPROVE",
                "status": "APPROVED",
            }
            app.status = "ADMIN_APPROVED"
            app.current_department = "AUDIT"
            db.commit()

            publish_event("ADMIN_APPROVED", app.application_number, "ADMIN")
            create_audit_log(db, actor_id, "ADMIN_APPROVED", "ADMIN", app.id)
            return {
                "step": step_name,
                "status": "COMPLETED",
                "result": {"department_id": "ADMIN", "decision": "APPROVE"},
            }

        # Step 6: Independent Auditor Review
        elif step_name == "AUDITOR_REVIEW":
            now = datetime.now(timezone.utc).replace(tzinfo=None)
            current_step.status = "COMPLETED"
            current_step.completed_at = now
            current_step.timestamp = now
            current_step.verifier_id = actor_id
            current_step.details = {
                "title": "Independent Auditor Compliance Verification",
                "decision": "CONFIRM",
                "status": "CONFIRMED",
            }
            app.status = "AUDITOR_CONFIRMED"
            app.current_department = "PORTAL"
            db.commit()

            publish_event("AUDITOR_CONFIRMED", app.application_number, "AUDIT")
            create_audit_log(db, actor_id, "AUDITOR_CONFIRMED", "AUDIT", app.id)
            return {
                "step": step_name,
                "status": "COMPLETED",
                "result": {"department_id": "AUDIT", "decision": "CONFIRM"},
            }

        # Step 7: APPLICATION_COMPLETED (Service Passport Finalized)
        elif step_name == "APPLICATION_COMPLETED":
            now = datetime.now(timezone.utc).replace(tzinfo=None)
            current_step.status = "COMPLETED"
            current_step.completed_at = now
            current_step.timestamp = now
            app.status = "COMPLETED"
            app.current_department = "PORTAL"
            db.commit()

            publish_event("APPLICATION_COMPLETED", app.application_number, "PORTAL")
            create_audit_log(
                db, actor_id, "SERVICE_PASSPORT_FINALIZED", "APPLICATION", app.id
            )
            return {"step": step_name, "status": "COMPLETED"}

        elif "LEGACY" in step_name:
            ConsentManager.validate_consent(db, app.id)
            connector = get_connector("LEGACY_01")
            res = connector.verify_identity(canonical_model)
            current_step.status = "COMPLETED"
            current_step.completed_at = datetime.now(timezone.utc).replace(tzinfo=None)
            current_step.details = res
            app.status = "LEGACY_VERIFIED"
            db.commit()
            create_audit_log(db, actor_id, "EXECUTE_LEGACY_STEP", "LEGACY_01", app.id)
            return {"step": step_name, "status": "COMPLETED", "result": res}

        else:
            now = datetime.now(timezone.utc).replace(tzinfo=None)
            current_step.status = "COMPLETED"
            current_step.completed_at = now
            current_step.timestamp = now
            current_step.verifier_id = actor_id
            db.commit()
            return {"step": step_name, "status": "COMPLETED"}

    @classmethod
    def admin_review(
        cls,
        db: Session,
        application_id: str,
        decision: str,
        comments: str | None = None,
        rejection_reason: str | None = None,
        actor_id: str = "ADMIN",
    ) -> dict[str, Any]:
        """Processes Admin approval or rework request."""
        app = (
            db.query(Application)
            .filter(
                (Application.id == application_id)
                | (Application.application_number == application_id)
            )
            .first()
        )
        if not app:
            raise HTTPException(status_code=404, detail="Application not found")

        step = (
            db.query(WorkflowStep)
            .filter(
                WorkflowStep.application_id == app.id,
                WorkflowStep.step_name == "ADMIN_REVIEW",
            )
            .first()
        )
        if not step:
            raise HTTPException(
                status_code=400,
                detail="ADMIN_REVIEW step not found for this application",
            )

        now = datetime.now(timezone.utc).replace(tzinfo=None)
        step.timestamp = now
        step.verifier_id = actor_id
        step.comments = comments

        dec = decision.upper()
        if dec == "APPROVE":
            step.status = "COMPLETED"
            step.completed_at = now
            step.details = {
                "title": "Administrative Review & Sanction Sign-off",
                "decision": "APPROVE",
                "comments": comments,
            }
            app.status = "ADMIN_APPROVED"
            app.current_department = "AUDIT"
            app.rejection_reason = None
            db.commit()
            publish_event(
                "ADMIN_APPROVED",
                app.application_number,
                "ADMIN",
                {"comments": comments},
            )
            create_audit_log(
                db, actor_id, "ADMIN_APPROVED", "ADMIN", app.id, {"comments": comments}
            )
            return {
                "status": "SUCCESS",
                "decision": "APPROVE",
                "application_status": app.status,
            }
        elif dec == "REWORK":
            reason = rejection_reason or comments or "Rework requested by administrator"
            step.status = "REWORK_REQUESTED"
            step.rejection_reason = reason
            step.details = {
                "title": "Administrative Review & Sanction Sign-off",
                "decision": "REWORK",
                "comments": comments,
                "rejection_reason": reason,
            }
            app.status = "REWORK"
            app.rejection_reason = reason
            app.current_department = "PORTAL"
            db.commit()
            publish_event(
                "REWORK_REQUESTED",
                app.application_number,
                "ADMIN",
                {"rejection_reason": reason},
            )
            create_audit_log(
                db,
                actor_id,
                "ADMIN_REWORK_REQUESTED",
                "ADMIN",
                app.id,
                {"rejection_reason": reason},
            )
            return {
                "status": "SUCCESS",
                "decision": "REWORK",
                "application_status": app.status,
                "rejection_reason": reason,
            }
        else:
            raise HTTPException(
                status_code=400,
                detail="Invalid decision. Must be 'APPROVE' or 'REWORK'.",
            )

    @classmethod
    def auditor_review(
        cls,
        db: Session,
        application_id: str,
        decision: str,
        comments: str | None = None,
        actor_id: str = "AUDITOR",
    ) -> dict[str, Any]:
        """Auditor review action: CONFIRM or FLAG."""
        app = (
            db.query(Application)
            .filter(
                (Application.id == application_id)
                | (Application.application_number == application_id)
            )
            .first()
        )
        if not app:
            raise HTTPException(status_code=404, detail="Application not found")

        step = (
            db.query(WorkflowStep)
            .filter(
                WorkflowStep.application_id == app.id,
                WorkflowStep.step_name == "AUDITOR_REVIEW",
            )
            .first()
        )
        if not step:
            raise HTTPException(
                status_code=400,
                detail="AUDITOR_REVIEW step not found for this application",
            )

        now = datetime.now(timezone.utc).replace(tzinfo=None)
        step.timestamp = now
        step.verifier_id = actor_id
        step.comments = comments

        dec = decision.upper()
        if dec == "CONFIRM":
            step.status = "COMPLETED"
            step.completed_at = now
            step.details = {
                "title": "Independent Auditor Compliance Verification",
                "decision": "CONFIRM",
                "comments": comments,
            }
            app.status = "AUDITOR_CONFIRMED"
            app.current_department = "PORTAL"
            db.commit()
            publish_event(
                "AUDITOR_CONFIRMED",
                app.application_number,
                "AUDIT",
                {"comments": comments},
            )
            create_audit_log(
                db,
                actor_id,
                "AUDITOR_CONFIRMED",
                "AUDIT",
                app.id,
                {"comments": comments},
            )
            return {
                "status": "SUCCESS",
                "decision": "CONFIRM",
                "application_status": app.status,
            }
        elif dec == "FLAG":
            step.status = "FLAGGED"
            step.details = {
                "title": "Independent Auditor Compliance Verification",
                "decision": "FLAG",
                "comments": comments,
            }
            app.status = "AUDITOR_FLAGGED"
            db.commit()
            publish_event(
                "AUDITOR_FLAGGED",
                app.application_number,
                "AUDIT",
                {"comments": comments},
            )
            create_audit_log(
                db, actor_id, "AUDITOR_FLAGGED", "AUDIT", app.id, {"comments": comments}
            )
            return {
                "status": "SUCCESS",
                "decision": "FLAG",
                "application_status": app.status,
            }
        else:
            raise HTTPException(
                status_code=400, detail="Invalid decision. Must be 'CONFIRM' or 'FLAG'."
            )

    @classmethod
    def resubmit_application(
        cls,
        db: Session,
        application_id: str,
        citizen_data: dict[str, Any] | None = None,
        comments: str | None = None,
        actor_id: str = "CITIZEN",
    ) -> dict[str, Any]:
        """Resubmits an application previously flagged for rework."""
        app = (
            db.query(Application)
            .filter(
                (Application.id == application_id)
                | (Application.application_number == application_id)
            )
            .first()
        )
        if not app:
            raise HTTPException(status_code=404, detail="Application not found")

        if app.status not in ["REWORK", "REWORK_REQUESTED"]:
            raise HTTPException(
                status_code=400,
                detail=f"Application is in status '{app.status}'. Only applications in REWORK status can be resubmitted.",
            )

        if citizen_data:
            updated = dict(app.citizen_data or {})
            updated.update(citizen_data)
            app.citizen_data = updated

        app.status = "APPROVAL_STARTED"
        app.current_department = "ADMIN"
        app.rejection_reason = None

        admin_step = (
            db.query(WorkflowStep)
            .filter(
                WorkflowStep.application_id == app.id,
                WorkflowStep.step_name == "ADMIN_REVIEW",
            )
            .first()
        )
        if admin_step:
            admin_step.status = "PENDING"
            admin_step.rejection_reason = None
            if comments:
                admin_step.comments = f"Resubmitted: {comments}"

        db.commit()
        publish_event(
            "APPLICATION_RESUBMITTED",
            app.application_number,
            "PORTAL",
            {"comments": comments},
        )
        create_audit_log(
            db,
            actor_id,
            "APPLICATION_RESUBMITTED",
            "APPLICATION",
            app.id,
            {"comments": comments},
        )
        return {
            "status": "SUCCESS",
            "application_id": app.id,
            "application_status": app.status,
        }

    @classmethod
    def run_full_pipeline(
        cls, db: Session, application_id: str, actor_id: str = "SYSTEM"
    ) -> dict[str, Any]:
        """
        Executes all remaining workflow steps in sequence until completion or exception.
        """
        results = []
        for _ in range(len(WORKFLOW_PIPELINE)):
            step_res = cls.advance_step(db, application_id, actor_id)
            results.append(step_res)
            if step_res.get("status") in [
                "EXCEPTION",
                "ALREADY_COMPLETED",
                "REWORK",
                "FLAGGED",
            ]:
                break
        return {"application_id": application_id, "history": results}

    @classmethod
    def retry_exception(
        cls, db: Session, application_id: str, actor_id: str = "OFFICER"
    ) -> dict[str, Any]:
        """
        Resolves an integration exception and retries the failed workflow step.
        """
        app = db.query(Application).filter(Application.id == application_id).first()
        if not app:
            raise HTTPException(status_code=404, detail="Application not found")

        # Reset failed step to PENDING
        failed_step = (
            db.query(WorkflowStep)
            .filter(
                WorkflowStep.application_id == application_id,
                WorkflowStep.status == "FAILED",
            )
            .first()
        )

        if not failed_step:
            return {
                "status": "NO_FAILED_STEP",
                "message": "No failed steps found to retry.",
            }

        failed_step.status = "PENDING"
        db.commit()

        # Update previous failed transaction to RESOLVED if exists
        prev_txn = (
            db.query(DepartmentTransaction)
            .filter(
                DepartmentTransaction.application_id == application_id,
                DepartmentTransaction.status == "FAILED",
            )
            .first()
        )
        if prev_txn:
            prev_txn.status = "RESOLVED"
            db.commit()

        create_audit_log(
            db, actor_id, "INTEGRATION_RETRY_INITIATED", "WORKFLOW", app.id
        )
        # Advance the step
        return cls.advance_step(db, application_id, actor_id)

    @classmethod
    def cancel_workflow(
        cls,
        db: Session,
        application_id: str,
        reason: str = "Citizen cancelled application",
        actor_id: str = "CITIZEN",
    ) -> dict[str, Any]:
        """Cancels an active application workflow."""
        app = (
            db.query(Application)
            .filter(
                (Application.id == application_id)
                | (Application.application_number == application_id)
            )
            .first()
        )
        if not app:
            raise HTTPException(status_code=404, detail="Application not found")

        app.status = "CANCELLED"
        app.rejection_reason = reason
        db.commit()

        publish_event(
            "APPLICATION_CANCELLED",
            app.application_number,
            "PORTAL",
            {"reason": reason},
        )
        create_audit_log(
            db,
            actor_id,
            "APPLICATION_CANCELLED",
            "APPLICATION",
            app.id,
            {"reason": reason},
        )
        return {
            "status": "SUCCESS",
            "application_status": "CANCELLED",
            "reason": reason,
        }

    @classmethod
    def escalate_workflow(
        cls,
        db: Session,
        application_id: str,
        reason: str = "SLA breach threshold reached",
        actor_id: str = "OFFICER",
    ) -> dict[str, Any]:
        """Escalates an application to the State Administrator priority queue."""
        app = (
            db.query(Application)
            .filter(
                (Application.id == application_id)
                | (Application.application_number == application_id)
            )
            .first()
        )
        if not app:
            raise HTTPException(status_code=404, detail="Application not found")

        app.status = "ESCALATED"
        db.commit()

        publish_event(
            "WORKFLOW_ESCALATED", app.application_number, "ADMIN", {"reason": reason}
        )
        create_audit_log(
            db, actor_id, "WORKFLOW_ESCALATED", "WORKFLOW", app.id, {"reason": reason}
        )
        return {
            "status": "SUCCESS",
            "application_status": "ESCALATED",
            "reason": reason,
        }

    @classmethod
    def list_definitions(cls, db: Session) -> list[dict[str, Any]]:
        cls.seed_workflow_definitions_if_empty(db)
        definitions = (
            db.query(WorkflowDefinition)
            .filter(WorkflowDefinition.is_active == True)
            .all()
        )
        return [
            {
                "id": d.id,
                "service_id": d.service_id,
                "name": d.name,
                "version": d.version,
                "description": d.description,
                "is_active": d.is_active,
                "total_steps": (
                    len(d.definition_json.get("steps", []))
                    if isinstance(d.definition_json, dict)
                    else 0
                ),
                "definition_json": d.definition_json,
                "created_at": d.created_at.isoformat() if d.created_at else None,
            }
            for d in definitions
        ]

    @classmethod
    def get_definition(
        cls, db: Session, definition_id_or_service: str
    ) -> dict[str, Any]:
        cls.seed_workflow_definitions_if_empty(db)
        d = (
            db.query(WorkflowDefinition)
            .filter(
                (WorkflowDefinition.id == definition_id_or_service)
                | (WorkflowDefinition.service_id == definition_id_or_service)
            )
            .first()
        )
        if not d:
            raise HTTPException(
                status_code=404,
                detail=f"Workflow definition '{definition_id_or_service}' not found",
            )

        return {
            "id": d.id,
            "service_id": d.service_id,
            "name": d.name,
            "version": d.version,
            "description": d.description,
            "is_active": d.is_active,
            "definition_json": d.definition_json,
            "created_at": d.created_at.isoformat() if d.created_at else None,
        }

    @classmethod
    def save_definition(
        cls, db: Session, data: dict[str, Any], actor_id: str = "ADMIN"
    ) -> dict[str, Any]:
        cls.seed_workflow_definitions_if_empty(db)
        def_id = data.get("id") or f"WF-DEF-{data.get('service_id', 'SCHEME').upper()}"
        d = db.query(WorkflowDefinition).filter(WorkflowDefinition.id == def_id).first()
        if not d:
            d = WorkflowDefinition(
                id=def_id,
                service_id=data.get("service_id", "custom-scheme"),
                name=data.get("name", "Custom Scheme Workflow"),
                version=data.get("version", "1.0.0"),
                description=data.get("description"),
                definition_json=data.get("definition_json", {}),
                is_active=data.get("is_active", True),
            )
            db.add(d)
        else:
            for k, v in data.items():
                if hasattr(d, k) and k != "id":
                    setattr(d, k, v)
            d.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)

        db.commit()
        db.refresh(d)

        create_audit_log(
            db,
            actor_id,
            "WORKFLOW_DEFINITION_SAVED",
            "WORKFLOW",
            metadata={"definition_id": d.id, "service_id": d.service_id},
        )
        return {
            "status": "SUCCESS",
            "id": d.id,
            "service_id": d.service_id,
            "name": d.name,
        }
