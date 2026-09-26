import os

from backend.app.config import settings
from backend.app.firebase import is_demo_mode


class FeatureFlags:
    def __init__(self):
        self._overrides: dict[str, bool] = {}

    def is_enabled(self, flag: str, default: bool = False) -> bool:
        """Evaluates whether a given feature flag is active."""
        flag = flag.upper()
        if flag in self._overrides:
            return self._overrides[flag]

        # Check environment variable override
        env_val = os.getenv(f"FEATURE_{flag}")
        if env_val is not None:
            return env_val.lower() in ("true", "1", "yes", "on")

        # Built-in platform flag defaults
        if flag == "DEMO_PERSONAS":
            return is_demo_mode()
        elif flag == "SMS_NOTIFICATIONS":
            return (
                bool(settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN)
                or is_demo_mode()
            )
        elif flag == "REDIS_CACHE":
            return bool(settings.REDIS_URL)
        elif flag == "AI_ASSISTANT":
            return bool(settings.GEMINI_API_KEY) or is_demo_mode()
        elif flag == "RATE_LIMITING":
            return settings.ENVIRONMENT != "test"
        elif flag == "PDF_RECEIPTS" or flag == "CSV_EXPORTS":
            return True

        return default

    def set_override(self, flag: str, enabled: bool) -> None:
        """Sets a runtime override for testing or emergency maintenance."""
        self._overrides[flag.upper()] = enabled

    def clear_overrides(self) -> None:
        """Clears all in-memory overrides."""
        self._overrides.clear()

    def get_all_flags(self) -> dict[str, bool]:
        """Returns snapshot of standard platform flags."""
        standard_flags = [
            "DEMO_PERSONAS",
            "SMS_NOTIFICATIONS",
            "REDIS_CACHE",
            "AI_ASSISTANT",
            "RATE_LIMITING",
            "PDF_RECEIPTS",
            "CSV_EXPORTS",
        ]
        return {f: self.is_enabled(f) for f in standard_flags}


feature_flags = FeatureFlags()
