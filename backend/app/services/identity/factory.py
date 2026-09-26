from backend.app.services.identity.base import BaseIdentityProvider
from backend.app.services.identity.firebase_provider import FirebaseIdentityProvider
from backend.app.services.identity.internal import InternalJwtIdentityProvider
from backend.app.services.identity.oidc_provider import OidcGovernmentSsoProvider

_providers: dict[str, BaseIdentityProvider] = {
    "INTERNAL_JWT": InternalJwtIdentityProvider(),
    "FIREBASE_AUTH": FirebaseIdentityProvider(),
    "GOV_OIDC_SSO": OidcGovernmentSsoProvider(),
}


def get_identity_provider(provider_id: str = "INTERNAL_JWT") -> BaseIdentityProvider:
    """Returns the requested identity provider adapter."""
    provider = _providers.get(provider_id.upper())
    if not provider:
        return _providers["INTERNAL_JWT"]
    return provider


def get_all_identity_providers() -> dict[str, BaseIdentityProvider]:
    """Returns all registered identity providers."""
    return _providers
