import uuid
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from backend.app.database import engine, SessionLocal, Base
from backend.app.models.user import User
from backend.app.models.application import Application
from backend.app.models.consent import Consent
from backend.app.models.workflow import WorkflowStep
from backend.app.models.transaction import DepartmentTransaction
from backend.app.models.audit import AuditLog
from backend.app.auth import get_password_hash
from backend.app.services.workflow import WORKFLOW_PIPELINE

import secrets

def _generate_seed_password() -> str:
    return f"Mh@{secrets.token_urlsafe(10)}7!"

def init_db_and_seed():
    """Initializes tables and seeds initial users with unique random credentials and benchmark data."""
    # Create all tables
    Base.metadata.create_all(bind=engine)

    db: Session = SessionLocal()
    try:
        # Check if users already exist
        if db.query(User).count() > 0:
            updated = False
            for u in db.query(User).all():
                if not u.hashed_password or not u.hashed_password.startswith(("$2b$", "$2a$")):
                    rnd_pwd = _generate_seed_password()
                    u.hashed_password = get_password_hash(rnd_pwd)
                    print(f"[Database Seed Security]: Re-hashed credentials for {u.email}: {rnd_pwd}")
                    updated = True
                if not getattr(u, 'registration_status', None):
                    u.registration_status = "APPROVED"
                    updated = True
            
            # Ensure Dept A, Dept B, Auditor exist
            if not db.query(User).filter(User.role == "DEPARTMENT_A").first():
                pwd_a = _generate_seed_password()
                db.add(User(
                    id="OFF-DEPTA-001",
                    name="Dept A Officer (Identity)",
                    mobile="8888888881",
                    email="dept_a@identity.gov.in",
                    role="DEPARTMENT_A",
                    department_id="DEPT_A",
                    registration_status="APPROVED",
                    hashed_password=get_password_hash(pwd_a)
                ))
                print(f"[Database Seed Security]: Seeded DEPARTMENT_A: {pwd_a}")
                updated = True
            if not db.query(User).filter(User.role == "DEPARTMENT_B").first():
                pwd_b = _generate_seed_password()
                db.add(User(
                    id="OFF-DEPTB-001",
                    name="Dept B Officer (Eligibility)",
                    mobile="8888888882",
                    email="dept_b@eligibility.gov.in",
                    role="DEPARTMENT_B",
                    department_id="DEPT_B",
                    registration_status="APPROVED",
                    hashed_password=get_password_hash(pwd_b)
                ))
                print(f"[Database Seed Security]: Seeded DEPARTMENT_B: {pwd_b}")
                updated = True
            if not db.query(User).filter(User.role == "AUDITOR").first():
                pwd_aud = _generate_seed_password()
                db.add(User(
                    id="AUD-001",
                    name="State Auditor",
                    mobile="6666666666",
                    email="auditor@audit.gov.in",
                    role="AUDITOR",
                    department_id="AUDIT",
                    registration_status="APPROVED",
                    hashed_password=get_password_hash(pwd_aud)
                ))
                print(f"[Database Seed Security]: Seeded AUDITOR: {pwd_aud}")
                updated = True

            if updated:
                db.commit()
                print("[Database Seed] Upgraded existing personas to 6-role model.")
            print("[Database Seed] Personas ready, skipping full initial seed.")
            return

        print("[Database Seed] Creating demo users and benchmark application across 6 roles with unique random credentials...")

        # 1. Seed Users (All 6 roles) with distinct, cryptographically strong passwords
        citizen_pwd = _generate_seed_password()
        dept_a_pwd = _generate_seed_password()
        dept_b_pwd = _generate_seed_password()
        dept_c_pwd = _generate_seed_password()
        auditor_pwd = _generate_seed_password()
        admin_pwd = _generate_seed_password()

        citizen = User(
            id="CIT-001",
            name="Demo Citizen",
            mobile="9999999999",
            email="citizen@mahasetu.gov.in",
            role="CITIZEN",
            department_id=None,
            registration_status="APPROVED",
            hashed_password=get_password_hash(citizen_pwd)
        )

        dept_a = User(
            id="OFF-DEPTA-001",
            name="Dept A Officer (Identity)",
            mobile="8888888881",
            email="dept_a@identity.gov.in",
            role="DEPARTMENT_A",
            department_id="DEPT_A",
            registration_status="APPROVED",
            hashed_password=get_password_hash(dept_a_pwd)
        )

        dept_b = User(
            id="OFF-DEPTB-001",
            name="Dept B Officer (Eligibility)",
            mobile="8888888882",
            email="dept_b@eligibility.gov.in",
            role="DEPARTMENT_B",
            department_id="DEPT_B",
            registration_status="APPROVED",
            hashed_password=get_password_hash(dept_b_pwd)
        )

        dept_c = User(
            id="OFF-001",
            name="Dept C Officer (Employment)",
            mobile="8888888888",
            email="officer@employment.gov.in",
            role="DEPARTMENT_C",
            department_id="DEPT_C",
            registration_status="APPROVED",
            hashed_password=get_password_hash(dept_c_pwd)
        )

        auditor = User(
            id="AUD-001",
            name="State Auditor",
            mobile="6666666666",
            email="auditor@audit.gov.in",
            role="AUDITOR",
            department_id="AUDIT",
            registration_status="APPROVED",
            hashed_password=get_password_hash(auditor_pwd)
        )

        admin = User(
            id="ADM-001",
            name="Integration Admin",
            mobile="7777777777",
            email="admin@mahasetu.gov.in",
            role="ADMIN",
            department_id=None,
            registration_status="APPROVED",
            hashed_password=get_password_hash(admin_pwd)
        )

        print(f"[Database Seed Security]: Seeded Users Generated (Printed once for bootstrap):")
        print(f"  - Citizen: {citizen.email} | Pwd: {citizen_pwd}")
        print(f"  - Dept A:  {dept_a.email} | Pwd: {dept_a_pwd}")
        print(f"  - Dept B:  {dept_b.email} | Pwd: {dept_b_pwd}")
        print(f"  - Dept C:  {dept_c.email} | Pwd: {dept_c_pwd}")
        print(f"  - Auditor: {auditor.email} | Pwd: {auditor_pwd}")
        print(f"  - Admin:   {admin.email} | Pwd: {admin_pwd}")

        db.add_all([citizen, dept_a, dept_b, dept_c, auditor, admin])
        db.commit()

        # 2. Benchmark Pre-seeded Application (MH-APP-2026-000184)
        app_184 = Application(
            id="app-benchmark-184",
            application_number="MH-APP-2026-000184",
            citizen_id=citizen.id,
            service_id="employment-support",
            status="ELIGIBILITY_VERIFIED",
            current_department="DEPT_C",
            citizen_data={
                "name": "Demo Citizen",
                "mobile": "9999999999",
                "dob": "1998-05-12",
                "district": "Pune",
                "annual_income": 180000,
                "employment_status": "UNEMPLOYED"
            },
            created_at=datetime.utcnow() - timedelta(hours=2)
        )
        db.add(app_184)
        db.commit()

        # 3. Benchmark Consent
        consent_184 = Consent(
            id="con-benchmark-184",
            consent_number="CON-2026-004821",
            application_id=app_184.id,
            citizen_id=citizen.id,
            requested_by="Employment Department (DEPT_C)",
            purpose="Eligibility verification under Maharashtra Employment Support Scheme",
            data_categories=[
                "Identity Information (Name, Date of Birth from Department A)",
                "Address & Domicile Proof (District: Pune)",
                "Income & Socio-economic Classification (Department B)"
            ],
            status="AUTHORIZED",
            granted_at=datetime.utcnow() - timedelta(hours=1, minutes=50),
            expires_at=datetime.utcnow() + timedelta(days=90),
            consent_hash="9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08"
        )
        db.add(consent_184)
        db.commit()

        # 4. Benchmark Workflow Steps
        steps_data = [
            ("APPLICATION_CREATED", "PORTAL", "COMPLETED", 120, 119),
            ("CONSENT_GRANTED", "PORTAL", "COMPLETED", 119, 110),
            ("IDENTITY_VERIFICATION", "DEPT_A", "COMPLETED", 110, 105),
            ("ELIGIBILITY_VERIFICATION", "DEPT_B", "COMPLETED", 105, 95),
            ("DEPARTMENT_APPROVAL", "DEPT_C", "PENDING", None, None),
            ("APPLICATION_COMPLETED", "PORTAL", "PENDING", None, None)
        ]

        for s_name, d_id, stat, start_offset, comp_offset in steps_data:
            s_time = datetime.utcnow() - timedelta(minutes=start_offset) if start_offset else None
            c_time = datetime.utcnow() - timedelta(minutes=comp_offset) if comp_offset else None
            step = WorkflowStep(
                application_id=app_184.id,
                step_name=s_name,
                department_id=d_id,
                status=stat,
                started_at=s_time,
                completed_at=c_time,
                details={"benchmark": True, "step_name": s_name}
            )
            db.add(step)

        # 5. Benchmark Department Transactions
        txn1 = DepartmentTransaction(
            application_id=app_184.id,
            department_id="DEPT_A",
            operation="verify_identity",
            request_payload={"citizen_name": "Demo Citizen", "mobile_no": "9999999999", "district": "Pune"},
            response_payload={"statusCode": 200, "verification_id": "UIDAI-MOCK-94821", "matched": True},
            status="SUCCESS",
            retry_count=0,
            created_at=datetime.utcnow() - timedelta(minutes=105)
        )
        txn2 = DepartmentTransaction(
            application_id=app_184.id,
            department_id="DEPT_B",
            operation="verify_eligibility",
            request_payload={"fullName": "Demo Citizen", "phone": "9999999999", "income_bracket": "BELOW_2L"},
            response_payload={"evalStatus": "SUCCESS", "isEligible": True, "benefitTier": "TIER_1_PRIORITY"},
            status="SUCCESS",
            retry_count=0,
            created_at=datetime.utcnow() - timedelta(minutes=95)
        )
        db.add_all([txn1, txn2])

        # 6. Benchmark Audit Logs
        audits = [
            (citizen.id, "APPLICATION_CREATED", "APPLICATION", {"application_number": "MH-APP-2026-000184"}, 120),
            (citizen.id, "CONSENT_REQUESTED", "CONSENT", {"consent_number": "CON-2026-004821"}, 115),
            (citizen.id, "CONSENT_GRANTED", "CONSENT", {"status": "AUTHORIZED"}, 110),
            ("SYSTEM", "DEPT_A_DATA_REQUESTED", "CONNECTOR_DEPT_A", {"operation": "verify_identity"}, 108),
            ("DEPT_A", "IDENTITY_VERIFIED", "DEPT_A", {"verification_id": "UIDAI-MOCK-94821"}, 105),
            ("SYSTEM", "CANONICAL_DATA_TRANSFORMED", "HUB_TRANSFORMER", {"source": "DEPT_A", "target": "DEPT_B"}, 100),
            ("SYSTEM", "DEPT_B_DATA_REQUESTED", "CONNECTOR_DEPT_B", {"operation": "verify_eligibility"}, 98),
            ("DEPT_B", "ELIGIBILITY_VERIFIED", "DEPT_B", {"tier": "TIER_1_PRIORITY"}, 95),
            ("SYSTEM", "WORKFLOW_ADVANCED", "WORKFLOW_ENGINE", {"current_step": "DEPARTMENT_APPROVAL"}, 94)
        ]

        for actor, act, res, meta, offset in audits:
            db.add(AuditLog(
                application_id=app_184.id,
                actor_id=actor,
                action=act,
                resource=res,
                metadata_json=meta,
                timestamp=datetime.utcnow() - timedelta(minutes=offset)
            ))

        db.commit()
        print("[Database Seed] Benchmark data seeded successfully.")

    except Exception as e:
        db.rollback()
        print(f"[Database Seed Error]: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    init_db_and_seed()
