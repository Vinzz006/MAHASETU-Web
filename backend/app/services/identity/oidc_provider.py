import time
import uuid
from typing import Dict, Any, Optional
from jose import jwt, JWTError
from sqlalchemy.orm import Session

from backend.app.services.identity.base import BaseIdentityProvider
from backend.app.models.user import User
from backend.app.config import get_settings

class OidcGovernmentSsoProvider(BaseIdentityProvider):
    """
    OpenID Connect (OIDC) Government Single Sign-On Provider.
    
    ============================================================================
    PRODUCTION IDENTITY PROVIDER INTEGRATION POINT
    ============================================================================
    In production deployments across the Government of Maharashtra, this module
    integrates with National / State Federated SSO gateways (such as MeriPehchaan /
    Jan Parichay or Digilocker OIDC) via standard RFC 6749 and OpenID Connect Core 1.0.
    
    Required Production Configuration:
      - OIDC_ISSUER_URL: https://sso.maharashtra.gov.in/openid
      - OIDC_CLIENT_ID: <Assigned by State DIT>
      - OIDC_CLIENT_SECRET: <Vault Stored Secret>
      - OIDC_JWKS_URI: https://sso.maharashtra.gov.in/openid/jwks.json
    
    In Hackathon Demonstration Mode:
    This adapter operates in a technically rigorous SANDBOX MODE, issuing and verifying
    OIDC-compliant claims without requiring active credentials to restricted state servers.
    ============================================================================
    """

    provider_id = "GOV_OIDC_SSO"
    provider_name = "MeriPehchaan / Jan Parichay OIDC Government SSO Adapter (Sandbox)"
    is_external = True

    def __init__(self):
        settings = get_settings()
        self.secret_key = settings.JWT_SECRET or "sandbox-gov-sso-secret-key-32chars"
        self.algorithm = "HS256"
        self.issuer = "https://sso.sandbox.maharashtra.gov.in/openid"

    def get_openid_configuration(self) -> Dict[str, Any]:
        """Returns standard OpenID Connect discovery metadata."""
        return {
            "issuer": self.issuer,
            "authorization_endpoint": "/api/v1/auth/sso/authorize",
            "token_endpoint": "/api/v1/auth/sso/token",
            "userinfo_endpoint": "/api/v1/auth/sso/userinfo",
            "jwks_uri": "/api/v1/auth/sso/.well-known/jwks.json",
            "response_types_supported": ["code", "id_token"],
            "subject_types_supported": ["public"],
            "id_token_signing_alg_values_supported": ["HS256", "RS256"],
            "scopes_supported": ["openid", "profile", "email", "phone", "gov_department"]
        }

    def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        try:
            payload = jwt.decode(
                token,
                self.secret_key,
                algorithms=[self.algorithm],
                audience="mahasetu-platform"
            )
            return payload
        except JWTError:
            return None

    def resolve_user(self, claims: Dict[str, Any], db: Session) -> Optional[User]:
        phone = claims.get("phone_number") or claims.get("preferred_username")
        email = claims.get("email")
        sub = claims.get("sub")

        # 1. Search by phone or email
        user = None
        if phone:
            user = db.query(User).filter(User.mobile == phone).first()
        if not user and email:
            user = db.query(User).filter(User.email == email).first()

        # 2. In Sandbox mode, map claims into authorized roles
        if user:
            return user

        # Provision new SSO user if not already present
        role = claims.get("gov_role", "CITIZEN")
        user_id = f"SSO-{uuid.uuid4().hex[:6].upper()}"
        new_user = User(
            id=user_id,
            name=claims.get("name", "SSO Citizen"),
            mobile=phone or f"9{uuid.uuid4().int % 900000000 + 100000000}",
            email=email or f"sso_{user_id.lower()}@mahasetu.gov.in",
            role=role,
            department_id=claims.get("gov_department"),
            registration_status="APPROVED",
            hashed_password="SSO_FEDERATED_AUTHENTICATION"
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return new_user

    def generate_sandbox_id_token(
        self,
        username: str,
        name: str,
        role: str = "CITIZEN",
        department_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Generates an RFC-compliant OIDC ID token for demonstration purposes."""
        now = int(time.time())
        claims = {
            "iss": self.issuer,
            "sub": f"gov-user-{uuid.uuid4().hex[:8]}",
            "aud": "mahasetu-platform",
            "exp": now + 3600,
            "iat": now,
            "preferred_username": username,
            "name": name,
            "phone_number": username,
            "email": f"{username.lower()}@maharashtra.gov.in" if not username.isdigit() else f"{username}@citizen.gov.in",
            "gov_role": role,
            "gov_department": department_id,
            "assurance_level": "AAL3",
            "amr": ["pwd", "otp"],
            "auth_time": now
        }
        token = jwt.encode(claims, self.secret_key, algorithm=self.algorithm)
        return {
            "access_token": token,
            "id_token": token,
            "token_type": "Bearer",
            "expires_in": 3600,
            "scope": "openid profile email phone gov_department",
            "claims": claims
        }
