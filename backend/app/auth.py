import os
from pathlib import Path
try:
    from dotenv import load_dotenv
    load_dotenv()
    _backend_env = Path(__file__).resolve().parent.parent / ".env"
    if _backend_env.exists():
        load_dotenv(_backend_env)
except ImportError:
    pass

import bcrypt
from datetime import datetime, timedelta, timezone
from typing import Optional, List, Set
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.user import User
from backend.app.firebase import verify_firebase_id_token

from backend.app.config import get_settings

settings = get_settings()
SECRET_KEY = settings.JWT_SECRET or os.getenv("JWT_SECRET")
if not SECRET_KEY:
    raise RuntimeError(
        "FATAL: JWT_SECRET environment variable is not set! "
        "A cryptographically strong secret must be configured via JWT_SECRET in your environment or .env file. "
        "Refusing to start with a missing or default signing key."
    )
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies password securely using bcrypt."""
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    """Hashes password using bcrypt with salt."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(
    request: Request = None,
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    if not token and request is not None:
        token = request.query_params.get("token")

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"}
        )

    user = None

    # Path 1: Internal JWT validation (Demo personas, internal seeded tokens, pytest suite)
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id:
            user = db.query(User).filter(User.id == user_id).first()
    except JWTError:
        user = None

    # Path 2: Firebase ID token verification (Firebase Auth client tokens)
    if user is None:
        decoded_fb = verify_firebase_id_token(token)
        if decoded_fb and decoded_fb.get("uid"):
            fb_uid = decoded_fb.get("uid")
            fb_email = decoded_fb.get("email")
            user = db.query(User).filter(
                (User.firebase_uid == fb_uid) | ((User.email == fb_email) & (fb_email is not None))
            ).first()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials or user not found",
            headers={"WWW-Authenticate": "Bearer"}
        )

    # Gate: Ensure registration is approved before accessing protected features
    # Exclude self-status checks so user can see they are pending
    path = request.url.path if request else ""
    is_status_check = any(path.endswith(endpoint) for endpoint in ["/auth/me", "/auth/status"])

    if user.registration_status != "APPROVED" and not is_status_check:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Registration status is '{user.registration_status}'. Access pending administrative approval."
        )

    return user

def get_current_user_optional(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> Optional[User]:
    if not token:
        return None
    try:
        # Check internal JWT
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id:
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                return user
    except JWTError:
        pass

    # Check Firebase
    decoded_fb = verify_firebase_id_token(token)
    if decoded_fb and decoded_fb.get("uid"):
        fb_uid = decoded_fb.get("uid")
        fb_email = decoded_fb.get("email")
        return db.query(User).filter(
            (User.firebase_uid == fb_uid) | ((User.email == fb_email) & (fb_email is not None))
        ).first()

    return None

def _expand_roles(roles: List[str]) -> Set[str]:
    """Expands standard roles and backward-compatible legacy roles without privilege escalation."""
    expanded = set(roles)
    for r in list(roles):
        if r in ("ADMIN", "SYSTEM_ADMIN"):
            expanded.update(["ADMIN", "SYSTEM_ADMIN"])
        elif r in ("OFFICER", "DEPARTMENT_A", "DEPARTMENT_B", "DEPARTMENT_C"):
            # All department officers (Dept A, Dept B, Dept C) and generic officer roles share the officer capability tier
            expanded.update(["OFFICER", "DEPARTMENT_A", "DEPARTMENT_B", "DEPARTMENT_C"])
        elif r == "DEPARTMENT_ADMIN":
            # Department admin can access departmental functions and officer actions,
            # but NEVER system admin or central admin
            expanded.update(["DEPARTMENT_ADMIN", "OFFICER", "DEPARTMENT_A", "DEPARTMENT_B", "DEPARTMENT_C"])
    return expanded

def require_roles(allowed_roles: List[str]):
    def role_checker(current_user: User = Depends(get_current_user)):
        user_role_matches = _expand_roles([current_user.role])
        target_roles = _expand_roles(allowed_roles)

        if not user_role_matches.intersection(target_roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: requires one of {allowed_roles}"
            )
        return current_user
    return role_checker
