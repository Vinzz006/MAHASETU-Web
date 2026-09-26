from typing import Any

from backend.app.firebase import verify_firebase_id_token
from backend.app.models.user import User
from backend.app.services.identity.base import BaseIdentityProvider
from sqlalchemy.orm import Session


class FirebaseIdentityProvider(BaseIdentityProvider):
    """
    Firebase Authentication Provider.
    Handles verification of Firebase Client SDK ID tokens.
    """

    provider_id = "FIREBASE_AUTH"
    provider_name = "Google Firebase Authentication Adapter"
    is_external = True

    def verify_token(self, token: str) -> dict[str, Any] | None:
        return verify_firebase_id_token(token)

    def resolve_user(self, claims: dict[str, Any], db: Session) -> User | None:
        fb_uid = claims.get("uid")
        fb_email = claims.get("email")
        if not fb_uid and not fb_email:
            return None

        return (
            db.query(User)
            .filter(
                (User.firebase_uid == fb_uid)
                | ((User.email == fb_email) & (fb_email is not None))
            )
            .first()
        )
