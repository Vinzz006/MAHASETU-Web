from abc import ABC, abstractmethod
from typing import Any

from backend.app.models.user import User
from sqlalchemy.orm import Session


class BaseIdentityProvider(ABC):
    """
    Abstract Base Identity Provider interface.
    Provides pluggable identity resolution across internal JWT, Firebase,
    and OIDC-compatible Government SSO providers (e.g. MeriPehchaan / Jan Parichay).
    """

    provider_id: str
    provider_name: str
    is_external: bool = False

    @abstractmethod
    def verify_token(self, token: str) -> dict[str, Any] | None:
        """Validates token claims and returns normalized payload."""

    @abstractmethod
    def resolve_user(self, claims: dict[str, Any], db: Session) -> User | None:
        """Resolves or provisions a local User entity from normalized claims."""

    def get_authorization_url(self, redirect_uri: str, state: str) -> str:
        """Returns the IdP authorization initiation URL."""
        raise NotImplementedError(
            "Authorization URL not implemented for this provider."
        )

    def exchange_code_for_token(self, code: str, redirect_uri: str) -> dict[str, Any]:
        """Exchanges authorization code for an ID token and access token."""
        raise NotImplementedError("Code exchange not implemented for this provider.")
