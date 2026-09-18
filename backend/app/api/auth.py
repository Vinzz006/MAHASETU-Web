import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.user import User
from backend.app.schemas.auth import (
    LoginRequest, TokenResponse, UserResponse,
    RegisterRequest, RegistrationResponse,
    PendingRegistrationItem, RejectRegistrationRequest
)
from backend.app.auth import (
    verify_password, get_password_hash, create_access_token,
    get_current_user, require_roles
)
from backend.app.firebase import verify_firebase_id_token
from backend.app.services.audit import create_audit_log
from backend.app.services.rate_limiter import login_rate_limiter, register_rate_limiter

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register", response_model=RegistrationResponse, dependencies=[Depends(register_rate_limiter)])
def register_citizen(req: RegisterRequest, db: Session = Depends(get_db)):
    """Registers a new citizen via Firebase Auth token or profile credentials, defaulting to PENDING status."""
    existing_user = db.query(User).filter(
        (User.mobile == req.mobile) | (User.email == req.email)
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this mobile number or email already exists."
        )

    firebase_uid = None
    if req.firebase_token:
        decoded_fb = verify_firebase_id_token(req.firebase_token)
        if decoded_fb:
            firebase_uid = decoded_fb.get("uid")

    user_id = f"CIT-{uuid.uuid4().hex[:6].upper()}"
    hashed_pwd = get_password_hash(req.password)

    new_user = User(
        id=user_id,
        firebase_uid=firebase_uid,
        name=req.name,
        mobile=req.mobile,
        email=req.email,
        role="CITIZEN",
        department_id=None,
        registration_status="PENDING",
        hashed_password=hashed_pwd
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    create_audit_log(
        db=db,
        actor_id=new_user.id,
        action="USER_SELF_REGISTERED",
        resource="USER",
        metadata={
            "user_id": new_user.id,
            "name": new_user.name,
            "email": new_user.email,
            "role": new_user.role,
            "status": "PENDING"
        }
    )

    return RegistrationResponse(
        id=new_user.id,
        name=new_user.name,
        mobile=new_user.mobile,
        email=new_user.email,
        role=new_user.role,
        registration_status=new_user.registration_status,
        message="Registration submitted successfully. Account is pending administrative approval."
    )

@router.post("/login", response_model=TokenResponse, dependencies=[Depends(login_rate_limiter)])
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(
        (User.mobile == req.username) | (User.email == req.username)
    ).first()

    if not user or not verify_password(req.password, user.hashed_password):
        create_audit_log(
            db=db,
            actor_id=user.id if user else "UNKNOWN",
            action="USER_LOGIN_FAILED",
            resource="AUTH",
            metadata={"username": req.username}
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username, mobile or password"
        )

    token = create_access_token(data={"sub": user.id, "role": user.role, "name": user.name})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user_id=user.id,
        name=user.name,
        role=user.role,
        department_id=user.department_id,
        registration_status=user.registration_status
    )

@router.get("/me", response_model=UserResponse)
def get_profile(current_user: User = Depends(get_current_user)):
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return UserResponse(
        id=current_user.id,
        name=current_user.name,
        mobile=current_user.mobile,
        email=current_user.email,
        role=current_user.role,
        department_id=current_user.department_id,
        registration_status=current_user.registration_status
    )

@router.get("/registrations/pending", response_model=List[PendingRegistrationItem])
def get_pending_registrations(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_roles(["ADMIN", "SYSTEM_ADMIN"]))
):
    """Admin-only endpoint to view pending citizen registrations."""
    pending_users = db.query(User).filter(
        User.registration_status == "PENDING"
    ).order_by(User.created_at.desc()).all()

    return [
        PendingRegistrationItem(
            id=u.id,
            name=u.name,
            mobile=u.mobile,
            email=u.email,
            role=u.role,
            registration_status=u.registration_status,
            created_at=u.created_at
        )
        for u in pending_users
    ]

@router.post("/registrations/{user_id}/approve")
def approve_registration(
    user_id: str,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_roles(["ADMIN", "SYSTEM_ADMIN"]))
):
    """Admin-only endpoint to approve a pending registration."""
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    target_user.registration_status = "APPROVED"
    db.commit()

    create_audit_log(
        db=db,
        actor_id=admin_user.id,
        action="USER_REGISTRATION_APPROVED",
        resource="USER",
        metadata={"target_user_id": target_user.id, "email": target_user.email}
    )

    return {
        "status": "SUCCESS",
        "message": f"User {target_user.name} ({target_user.id}) approved successfully.",
        "user_id": target_user.id,
        "registration_status": "APPROVED"
    }

@router.post("/registrations/{user_id}/reject")
def reject_registration(
    user_id: str,
    req: RejectRegistrationRequest,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_roles(["ADMIN", "SYSTEM_ADMIN"]))
):
    """Admin-only endpoint to reject a pending registration with a stored audit reason."""
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    target_user.registration_status = "REJECTED"
    db.commit()

    create_audit_log(
        db=db,
        actor_id=admin_user.id,
        action="USER_REGISTRATION_REJECTED",
        resource="USER",
        metadata={
            "target_user_id": target_user.id,
            "email": target_user.email,
            "rejection_reason": req.reason
        }
    )

    return {
        "status": "REJECTED",
        "message": f"User {target_user.name} registration rejected.",
        "user_id": target_user.id,
        "registration_status": "REJECTED",
        "rejection_reason": req.reason
    }

@router.get("/personas")
def get_demo_personas(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_roles(["SYSTEM_ADMIN"]))
):
    """Returns quick-switch credentials and tokens strictly for local demo evaluation when authenticated as SYSTEM_ADMIN."""
    from backend.app.firebase import is_demo_mode
    if not is_demo_mode():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Demo personas endpoint is disabled in production mode."
        )
    users = db.query(User).all()
    personas = []
    for u in users:
        token = create_access_token(data={"sub": u.id, "role": u.role, "name": u.name})
        personas.append({
            "id": u.id,
            "name": u.name,
            "role": u.role,
            "email": u.email,
            "mobile": u.mobile,
            "department_id": u.department_id,
            "registration_status": u.registration_status,
            "token": token
        })

    create_audit_log(
        db=db,
        actor_id=admin_user.id,
        action="DEMO_PERSONAS_ACCESSED",
        resource="AUTH_PERSONAS",
        metadata={"user_count": len(personas), "caller_role": admin_user.role}
    )

    return personas
