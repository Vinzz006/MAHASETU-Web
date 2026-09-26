from backend.app.auth import create_access_token
from backend.app.database import get_db
from backend.app.services.audit import create_audit_log
from backend.app.services.identity.factory import (
    get_all_identity_providers,
    get_identity_provider,
)
from backend.app.services.identity.oidc_provider import OidcGovernmentSsoProvider
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

router = APIRouter(prefix="/api/auth/sso", tags=["Federated Identity / SSO"])


class SsoMockLoginRequest(BaseModel):
    persona: str = "CITIZEN"  # CITIZEN, OFFICER, AUDITOR, SYSTEM_ADMIN
    username: str | None = None
    name: str | None = None
    department_id: str | None = None


class SsoTokenVerifyRequest(BaseModel):
    token: str


@router.get("/.well-known/openid-configuration")
def get_openid_configuration():
    """Returns standard OpenID Connect discovery metadata for MahaSetu's Government SSO."""
    provider: OidcGovernmentSsoProvider = get_identity_provider("GOV_OIDC_SSO")  # type: ignore
    return provider.get_openid_configuration()


@router.get("/providers")
def list_identity_providers():
    """Lists registered identity providers (Internal JWT, Firebase Auth, MeriPehchaan OIDC)."""
    providers = get_all_identity_providers()
    return [
        {
            "provider_id": p.provider_id,
            "name": p.provider_name,
            "is_external": p.is_external,
            "is_production_ready": True,
        }
        for p in providers.values()
    ]


@router.post("/mock-login")
def mock_government_sso_login(req: SsoMockLoginRequest, db: Session = Depends(get_db)):
    """
    Demonstrates Federated Government SSO (MeriPehchaan / Jan Parichay) login.
    Generates an RFC-compliant OIDC token, resolves claims, and establishes a secure session.
    """
    provider: OidcGovernmentSsoProvider = get_identity_provider("GOV_OIDC_SSO")  # type: ignore

    # Default mappings per persona
    persona_map = {
        "CITIZEN": {
            "username": "9999999999",
            "name": "Demo Citizen",
            "role": "CITIZEN",
            "dept": None,
        },
        "OFFICER": {
            "username": "8888888888",
            "name": "Officer Sharma",
            "role": "OFFICER",
            "dept": "DEPT_A",
        },
        "AUDITOR": {
            "username": "6666666666",
            "name": "Auditor Kulkarni",
            "role": "AUDITOR",
            "dept": "AUDIT",
        },
        "SYSTEM_ADMIN": {
            "username": "7777777777",
            "name": "System Admin",
            "role": "SYSTEM_ADMIN",
            "dept": None,
        },
        "DEPARTMENT_A": {
            "username": "5555555551",
            "name": "Dept A Officer",
            "role": "DEPARTMENT_A",
            "dept": "DEPT_A",
        },
        "DEPARTMENT_B": {
            "username": "5555555552",
            "name": "Dept B Officer",
            "role": "DEPARTMENT_B",
            "dept": "DEPT_B",
        },
        "DEPARTMENT_C": {
            "username": "5555555553",
            "name": "Dept C Officer",
            "role": "DEPARTMENT_C",
            "dept": "DEPT_C",
        },
    }

    target = persona_map.get(req.persona.upper(), persona_map["CITIZEN"])
    username = req.username or target["username"]
    name = req.name or target["name"]
    role = target["role"]
    dept = req.department_id or target["dept"]

    oidc_res = provider.generate_sandbox_id_token(username, name, role, dept)
    claims = oidc_res["claims"]

    # Resolve/provision user in DB
    user = provider.resolve_user(claims, db)

    # Issue platform JWT session
    session_token = create_access_token(
        data={"sub": user.id, "role": user.role, "name": user.name}
    )

    create_audit_log(
        db,
        user.id,
        "SSO_LOGIN_SUCCESS",
        "AUTH_SSO",
        metadata={
            "provider": "GOV_OIDC_SSO",
            "username": username,
            "role": role,
            "assurance": claims.get("assurance_level"),
        },
    )

    return {
        "status": "SUCCESS",
        "access_token": session_token,
        "token_type": "Bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "role": user.role,
            "mobile": user.mobile,
            "email": user.email,
            "department_id": user.department_id,
        },
        "oidc_token_details": oidc_res,
        "federation_provider": "MeriPehchaan (Sandbox)",
    }


@router.post("/verify")
def verify_sso_token(req: SsoTokenVerifyRequest, db: Session = Depends(get_db)):
    """Verifies an OIDC token and returns normalized identity claims."""
    provider = get_identity_provider("GOV_OIDC_SSO")
    claims = provider.verify_token(req.token)
    if not claims:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired SSO token",
        )
    return {"status": "VALID", "claims": claims}
