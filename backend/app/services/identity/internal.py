from typing import Any

from backend.app.config import get_settings
from backend.app.models.user import User
from backend.app.services.identity.base import BaseIdentityProvider
from jose import JWTError, jwt
from sqlalchemy.orm import Session


class InternalJwtIdentityProvider(BaseIdentityProvider):
    """
    Internal JWT Identity Provider.
    Issues and validates cryptographic HS256 JWT tokens for internal seeded personas
    and locally registered citizens.
    """

    provider_id = "INTERNAL_JWT"
    provider_name = "MahaSetu Internal Cryptographic JWT Provider"
    is_external = False

    def __init__(self):
        settings = get_settings()
        self.secret_key = settings.JWT_SECRET
        self.algorithm = "HS256"

    def verify_token(self, token: str) -> dict[str, Any] | None:
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            return payload
        except JWTError:
            return None

    def resolve_user(self, claims: dict[str, Any], db: Session) -> User | None:
        user_id = claims.get("sub")
        if not user_id:
            return None
        return db.query(User).filter(User.id == user_id).first()
