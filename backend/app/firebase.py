import os
import uuid
import datetime
from pathlib import Path
from typing import Optional, Dict, Any

_firebase_app = None
_bucket = None

def is_demo_mode() -> bool:
    return os.getenv("DEMO_MODE", "true").lower() in ("true", "1", "yes")

def init_firebase():
    """Initializes Firebase Admin SDK with robust production checking and demo fallback."""
    global _firebase_app, _bucket

    if _firebase_app is not None:
        return _firebase_app

    service_account_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH")
    project_id = os.getenv("FIREBASE_PROJECT_ID")
    storage_bucket = os.getenv("FIREBASE_STORAGE_BUCKET")

    demo = is_demo_mode()

    if not service_account_path or not Path(service_account_path).exists():
        if not demo:
            raise RuntimeError(
                "FATAL: Missing production Firebase credentials! "
                "Set FIREBASE_SERVICE_ACCOUNT_PATH pointing to a valid service account JSON, "
                "or set DEMO_MODE=true in backend/.env for local evaluation."
            )
        print("[MahaSetu Firebase] Running in DEMO_MODE. External Firebase Admin SDK not initialized.")
        return None

    try:
        import firebase_admin
        from firebase_admin import credentials, storage

        cred = credentials.Certificate(service_account_path)
        options = {}
        if storage_bucket:
            options["storageBucket"] = storage_bucket
        if project_id:
            options["projectId"] = project_id

        _firebase_app = firebase_admin.initialize_app(cred, options)
        if storage_bucket:
            _bucket = storage.bucket(storage_bucket)
        print(f"[MahaSetu Firebase] Successfully initialized Firebase Admin SDK (Project: {project_id or 'default'}).")
        return _firebase_app
    except Exception as e:
        if not demo:
            raise RuntimeError(f"FATAL: Failed to initialize Firebase Admin SDK: {e}")
        print(f"[MahaSetu Firebase Warning]: Firebase init failed ({e}). Falling back to DEMO_MODE.")
        return None

def is_testing_mode() -> bool:
    return os.getenv("TESTING", "false").lower() in ("true", "1")

def verify_firebase_id_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Verifies a Firebase ID token using the official Firebase Admin SDK.
    Never accepts mock or guessable client strings in production or standard demo mode.
    Only allows test-harness tokens when explicitly running inside automated pytest tests (TESTING=true).
    """
    global _firebase_app
    if _firebase_app is not None:
        try:
            import firebase_admin.auth
            decoded = firebase_admin.auth.verify_id_token(token)
            return decoded
        except Exception:
            return None

    # Testing harness path: strictly disabled outside of pytest/CI execution
    if is_testing_mode():
        if token.startswith("fb_mock_"):
            uid = token.replace("fb_mock_", "")
            return {
                "uid": uid if uid else "test_firebase_uid",
                "email": f"{uid}@citizen.gov.in" if uid else "test@citizen.gov.in",
                "name": "Firebase User",
                "auth_time": int(datetime.datetime.now(datetime.timezone.utc).timestamp()),
            }

    return None

def upload_passport_to_storage(user_id: str, content: bytes, filename: str = "passport.pdf") -> str:
    """
    Streams passport document to Firebase Storage under a private per-user path:
    residents/{user_id}/passports/{uuid}_{filename}
    Returns the storage reference path.
    """
    global _bucket
    unique_id = uuid.uuid4().hex[:8]
    storage_path = f"residents/{user_id}/passports/{unique_id}_{filename}"

    if _bucket is not None:
        blob = _bucket.blob(storage_path)
        blob.upload_from_string(content, content_type="application/pdf")
        return storage_path

    # In DEMO_MODE fallback, store in a local private storage directory
    local_storage_dir = Path("storage_private") / "residents" / user_id / "passports"
    local_storage_dir.mkdir(parents=True, exist_ok=True)
    local_file = local_storage_dir / f"{unique_id}_{filename}"
    with open(local_file, "wb") as f:
        f.write(content)

    return f"storage_private://{storage_path}"

def get_signed_passport_url(storage_path: str, expiration_minutes: int = 15) -> str:
    """
    Generates a secure, short-lived signed URL for reading the private document.
    Never exposes permanently public links.
    """
    global _bucket
    if _bucket is not None and not storage_path.startswith("storage_private://"):
        blob = _bucket.blob(storage_path)
        return blob.generate_signed_url(
            version="v4",
            expiration=datetime.timedelta(minutes=expiration_minutes),
            method="GET"
        )

    # In demo mode, return a secure backend preview route
    clean_path = storage_path.replace("storage_private://", "")
    return f"/api/citizens/me/passport-document/download?path={clean_path}"
