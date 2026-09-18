import hashlib
from pathlib import Path
from typing import Dict, Any, Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Response
from fastapi.responses import RedirectResponse, FileResponse
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.user import User
from backend.app.models.resident_profile import ResidentProfile
from backend.app.models.application import Application
from backend.app.models.consent import Consent
from backend.app.schemas.profile import ProfileUpdateRequest, ProfileResponse, CitizenSummaryResponse
from backend.app.auth import get_current_user, require_roles
from backend.app.services.audit import create_audit_log
from backend.app.firebase import upload_passport_to_storage, get_signed_passport_url

router = APIRouter(prefix="/api/citizens", tags=["Resident Profile"])

@router.get("", response_model=List[CitizenSummaryResponse])
def list_all_citizens(
    response: Response,
    page: int = 1,
    page_size: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN"]))
):
    """Lists registered citizens with pagination and profile completion status for administrative management."""
    page_size = min(max(1, page_size), 100)
    page = max(1, page)
    offset = (page - 1) * page_size

    query = db.query(User).filter(User.role == "CITIZEN").order_by(User.created_at.desc())
    total = query.count()
    users = query.offset(offset).limit(page_size).all()

    user_ids = [u.id for u in users]
    profiles = {p.user_id: p for p in db.query(ResidentProfile).filter(ResidentProfile.user_id.in_(user_ids)).all()} if user_ids else {}

    response.headers["X-Total-Count"] = str(total)
    response.headers["X-Page"] = str(page)
    response.headers["X-Page-Size"] = str(page_size)

    summaries = []
    for u in users:
        p = profiles.get(u.id)
        completed_sections = 0
        total_sections = 8
        has_profile = p is not None
        has_passport = False

        if p:
            if p.legal_name and p.date_of_birth and p.gender:
                completed_sections += 1
            if p.district and p.state and p.full_address:
                completed_sections += 1
            if p.aadhaar_last_four or p.pan_number:
                completed_sections += 1
            if p.father_name or p.mother_name or p.spouse_name:
                completed_sections += 1
            if p.phone or p.email:
                completed_sections += 1
            if p.educational_qualification:
                completed_sections += 1
            if p.bank_name and p.account_number_masked:
                completed_sections += 1
            if p.passport_document_url:
                completed_sections += 1
                has_passport = True

        pct = int((completed_sections / total_sections) * 100) if p else 15
        summaries.append(CitizenSummaryResponse(
            id=u.id,
            name=u.name,
            email=u.email,
            mobile=u.mobile,
            role=u.role,
            registration_status=u.registration_status,
            profile_completion_percentage=pct,
            has_profile=has_profile,
            has_passport=has_passport,
            created_at=u.created_at
        ))
    return summaries

MAX_PDF_SIZE_BYTES = 10 * 1024 * 1024 # 10 MB strict limit

def _build_profile_response(profile: ResidentProfile) -> ProfileResponse:
    download_url = None
    if profile.passport_document_url:
        download_url = get_signed_passport_url(profile.passport_document_url)

    return ProfileResponse(
        id=profile.id,
        user_id=profile.user_id,
        legal_name=profile.legal_name,
        date_of_birth=profile.date_of_birth,
        age=profile.age,
        gender=profile.gender,
        marital_status=profile.marital_status,
        community_caste=profile.community_caste,
        state=profile.state,
        district=profile.district,
        city=profile.city,
        division=profile.division,
        taluk=profile.taluk,
        zone=profile.zone,
        full_address=profile.full_address,
        country=profile.country,
        aadhaar_last_four=profile.aadhaar_last_four,
        pan_number=profile.pan_number,
        passport_status=profile.passport_status,
        father_name=profile.father_name,
        mother_name=profile.mother_name,
        spouse_name=profile.spouse_name,
        guardian_name=profile.guardian_name,
        phone=profile.phone,
        telephone=profile.telephone,
        email=profile.email,
        educational_qualification=profile.educational_qualification,
        bank_name=profile.bank_name,
        account_number_masked=profile.account_number_masked,
        ifsc=profile.ifsc,
        passport_document_url=profile.passport_document_url,
        passport_download_url=download_url,
        created_at=profile.created_at,
        updated_at=profile.updated_at
    )

def _get_or_create_profile(db: Session, user_id: str) -> ResidentProfile:
    profile = db.query(ResidentProfile).filter(ResidentProfile.user_id == user_id).first()
    if not profile:
        user = db.query(User).filter(User.id == user_id).first()
        profile = ResidentProfile(
            user_id=user_id,
            legal_name=user.name if user else None,
            phone=user.mobile if user else None,
            email=user.email if user else None,
            state="Maharashtra",
            country="India"
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile

@router.put("/me/profile", response_model=ProfileResponse)
def update_my_profile(
    req: ProfileUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Citizen updates their own resident profile across all personal, address, identity, and banking groups."""
    profile = _get_or_create_profile(db, current_user.id)

    # Personal
    if req.legal_name is not None: profile.legal_name = req.legal_name
    if req.date_of_birth is not None: profile.date_of_birth = req.date_of_birth
    if req.gender is not None: profile.gender = req.gender
    if req.marital_status is not None: profile.marital_status = req.marital_status
    if req.community_caste is not None: profile.community_caste = req.community_caste

    # Address
    if req.state is not None: profile.state = req.state
    if req.district is not None: profile.district = req.district
    if req.city is not None: profile.city = req.city
    if req.division is not None: profile.division = req.division
    if req.taluk is not None: profile.taluk = req.taluk
    if req.zone is not None: profile.zone = req.zone
    if req.full_address is not None: profile.full_address = req.full_address
    if req.country is not None: profile.country = req.country

    # Identity (Masked at rest)
    if req.aadhaar_number is not None:
        clean_aadhaar = req.aadhaar_number.replace(" ", "").replace("-", "").strip()
        profile.aadhaar_hash = hashlib.sha256(clean_aadhaar.encode("utf-8")).hexdigest()
        profile.aadhaar_last_four = clean_aadhaar[-4:] if len(clean_aadhaar) >= 4 else clean_aadhaar
    if req.pan_number is not None: profile.pan_number = req.pan_number.strip().upper()
    if req.passport_status is not None: profile.passport_status = req.passport_status

    # Family
    if req.father_name is not None: profile.father_name = req.father_name
    if req.mother_name is not None: profile.mother_name = req.mother_name
    if req.spouse_name is not None: profile.spouse_name = req.spouse_name
    if req.guardian_name is not None: profile.guardian_name = req.guardian_name

    # Contact
    if req.phone is not None: profile.phone = req.phone
    if req.telephone is not None: profile.telephone = req.telephone
    if req.email is not None: profile.email = req.email

    # Education
    if req.educational_qualification is not None: profile.educational_qualification = req.educational_qualification

    # Banking (Masked at rest)
    if req.bank_name is not None: profile.bank_name = req.bank_name
    if req.account_number is not None:
        clean_acc = req.account_number.strip()
        last4 = clean_acc[-4:] if len(clean_acc) >= 4 else clean_acc
        profile.account_number_masked = f"XXXX-XXXX-{last4}"
    if req.ifsc is not None: profile.ifsc = req.ifsc.strip().upper()

    db.commit()
    db.refresh(profile)

    create_audit_log(
        db=db,
        actor_id=current_user.id,
        action="RESIDENT_PROFILE_UPDATED",
        resource="RESIDENT_PROFILE",
        metadata={"user_id": current_user.id, "fields_updated": list(req.model_dump(exclude_unset=True).keys())}
    )

    return _build_profile_response(profile)

@router.get("/me/profile", response_model=ProfileResponse)
def get_my_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    profile = _get_or_create_profile(db, current_user.id)
    return _build_profile_response(profile)

@router.get("/{user_id}/profile")
def get_citizen_profile(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Profile retrieval with field-level authorization per spec section 2.1:
    - Citizen self: full profile
    - ADMIN: full profile with audit log entry
    - AUDITOR: full profile (read-only) with audit log entry
    - DEPARTMENT_A/B/C: restricted to fields relevant to active consented application
    """
    profile = db.query(ResidentProfile).filter(ResidentProfile.user_id == user_id).first()
    if not profile:
        profile = _get_or_create_profile(db, user_id)

    # 1. Citizen Self
    if current_user.id == user_id:
        return _build_profile_response(profile)

    # 2. ADMIN / SYSTEM_ADMIN
    if current_user.role in ("ADMIN", "SYSTEM_ADMIN"):
        create_audit_log(
            db=db,
            actor_id=current_user.id,
            action="CITIZEN_PROFILE_VIEWED",
            resource="RESIDENT_PROFILE",
            metadata={"target_user_id": user_id, "role": current_user.role}
        )
        return _build_profile_response(profile)

    # 3. AUDITOR (Read-only oversight with audit trail)
    if current_user.role == "AUDITOR":
        create_audit_log(
            db=db,
            actor_id=current_user.id,
            action="CITIZEN_PROFILE_AUDITED",
            resource="RESIDENT_PROFILE",
            metadata={"target_user_id": user_id, "role": "AUDITOR"}
        )
        return _build_profile_response(profile)

    # 4. Department Role (DEPARTMENT_A, DEPARTMENT_B, DEPARTMENT_C, OFFICER)
    dept_id = current_user.department_id or current_user.role
    dept_candidates = set()
    if current_user.department_id:
        dept_candidates.add(current_user.department_id)
    if current_user.role:
        dept_candidates.add(current_user.role)

    if "DEPARTMENT_A" in dept_candidates or "DEPT_A" in dept_candidates:
        dept_candidates.update(["DEPT_A", "DEPARTMENT_A"])
    if "DEPARTMENT_B" in dept_candidates or "DEPT_B" in dept_candidates:
        dept_candidates.update(["DEPT_B", "DEPARTMENT_B"])
    if "DEPARTMENT_C" in dept_candidates or "DEPT_C" in dept_candidates or "OFFICER" in dept_candidates:
        dept_candidates.update(["DEPT_C", "DEPARTMENT_C", "OFFICER"])

    # Find active application assigned to this department
    app = db.query(Application).filter(
        Application.citizen_id == user_id,
        Application.current_department.in_(list(dept_candidates)),
        Application.status != "COMPLETED"
    ).first()

    # Also check if any consent authorized for this application
    consent = None
    if app:
        consent = db.query(Consent).filter(
            Consent.application_id == app.id,
            Consent.status == "AUTHORIZED"
        ).first()

    if not app or not consent:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied: {current_user.role} has no active consented application for citizen {user_id}."
        )

    # Filter fields to consent.data_categories
    categories = [cat.lower() for cat in (consent.data_categories or [])]
    filtered_data: Dict[str, Any] = {
        "user_id": profile.user_id,
        "authorized_by_consent": consent.consent_number,
        "consented_categories": consent.data_categories
    }

    # Identity Information
    if any("identity" in cat for cat in categories):
        filtered_data["identity"] = {
            "legal_name": profile.legal_name,
            "date_of_birth": profile.date_of_birth,
            "age": profile.age,
            "gender": profile.gender,
            "aadhaar_last_four": profile.aadhaar_last_four,
            "pan_number": profile.pan_number
        }

    # Address Information
    if any("address" in cat or "domicile" in cat for cat in categories):
        filtered_data["address"] = {
            "state": profile.state,
            "district": profile.district,
            "city": profile.city,
            "division": profile.division,
            "taluk": profile.taluk,
            "full_address": profile.full_address
        }

    # Income / Banking Information
    if any("income" in cat or "bank" in cat or "socio-economic" in cat for cat in categories):
        filtered_data["banking"] = {
            "bank_name": profile.bank_name,
            "account_number_masked": profile.account_number_masked,
            "ifsc": profile.ifsc
        }

    # Family Information
    if any("family" in cat or "guardian" in cat for cat in categories):
        filtered_data["family"] = {
            "father_name": profile.father_name,
            "mother_name": profile.mother_name,
            "spouse_name": profile.spouse_name
        }

    # Education Information
    if any("education" in cat or "skill" in cat for cat in categories):
        filtered_data["education"] = {
            "educational_qualification": profile.educational_qualification
        }

    create_audit_log(
        db=db,
        actor_id=current_user.id,
        action="CITIZEN_PARTIAL_PROFILE_ACCESSED",
        resource="RESIDENT_PROFILE",
        metadata={
            "target_user_id": user_id,
            "department": dept_id,
            "consent_number": consent.consent_number,
            "categories_granted": consent.data_categories
        }
    )

    return filtered_data

@router.post("/me/passport-document")
def upload_passport_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Enforces server-side PDF validation and 10 MB size limit.
    Streams to private Firebase Storage path and stores storage reference.
    """
    # 1. Enforce content-type server-side
    if file.content_type not in ("application/pdf", "pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid document format. Only application/pdf is accepted."
        )

    # 2. Enforce 10 MB limit server-side
    content = file.file.read()
    if len(content) > MAX_PDF_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum permissible size of 10 MB (Received: {round(len(content)/(1024*1024), 2)} MB)."
        )

    if len(content) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty."
        )

    # 3. Validate PDF magic number bytes (%PDF-) server-side
    if not content.startswith(b"%PDF-"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File integrity check failed: Uploaded file is not a valid PDF document (missing '%PDF-' header signature)."
        )

    # 4. Stream to Firebase Storage
    storage_path = upload_passport_to_storage(
        user_id=current_user.id,
        content=content,
        filename=file.filename or "passport_document.pdf"
    )

    # 5. Update Profile reference
    profile = _get_or_create_profile(db, current_user.id)
    profile.passport_document_url = storage_path
    profile.passport_status = "ACTIVE"
    db.commit()

    create_audit_log(
        db=db,
        actor_id=current_user.id,
        action="RESIDENT_PASSPORT_DOCUMENT_UPLOADED",
        resource="RESIDENT_PROFILE",
        metadata={"storage_path": storage_path, "file_size_bytes": len(content)}
    )

    signed_url = get_signed_passport_url(storage_path)

    return {
        "status": "SUCCESS",
        "message": "Passport document uploaded and verified successfully in private Firebase Storage.",
        "storage_path": storage_path,
        "signed_url": signed_url
    }

@router.get("/me/passport-document/download")
def download_my_passport_document(
    path: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Securely streams the authenticated citizen's private passport document.
    Enforces strict path canonicalization to prevent path-traversal attacks.
    """
    profile = db.query(ResidentProfile).filter(ResidentProfile.user_id == current_user.id).first()
    if not profile or not profile.passport_document_url:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No passport document found for the authenticated resident."
        )

    # The authorized base directory for this user
    base_user_dir = (Path("storage_private") / "residents" / current_user.id).resolve()

    # Determine stored file path from server-side record
    server_ref = profile.passport_document_url.replace("storage_private://", "").strip()
    target_file = (Path("storage_private") / server_ref).resolve()

    # If caller provided path query param, verify it stays strictly within the user's directory
    if path:
        clean_param = path.replace("storage_private://", "").strip()
        requested_file = (Path("storage_private") / clean_param).resolve()
        try:
            requested_file.relative_to(base_user_dir)
        except ValueError:
            create_audit_log(
                db=db,
                actor_id=current_user.id,
                action="PASSPORT_DOCUMENT_ACCESS_DENIED_PATH_TRAVERSAL",
                resource="RESIDENT_PROFILE",
                metadata={"user_id": current_user.id, "requested_path": path}
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Security violation: Path traversal detected. Access denied."
            )
        if requested_file != target_file:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Requested path does not match resident's active document record."
            )

    # Verify target_file stays within base_user_dir
    try:
        target_file.relative_to(base_user_dir)
    except ValueError:
        create_audit_log(
            db=db,
            actor_id=current_user.id,
            action="PASSPORT_DOCUMENT_ACCESS_DENIED_PATH_TRAVERSAL",
            resource="RESIDENT_PROFILE",
            metadata={"user_id": current_user.id, "stored_ref": server_ref}
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Security violation: Document reference is outside resident storage boundary."
        )

    if not target_file.exists() or not target_file.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Passport document file not found on disk."
        )

    create_audit_log(
        db=db,
        actor_id=current_user.id,
        action="PASSPORT_DOCUMENT_DOWNLOADED",
        resource="RESIDENT_PROFILE",
        metadata={"user_id": current_user.id, "file_name": target_file.name}
    )

    return FileResponse(
        path=str(target_file),
        media_type="application/pdf",
        filename=target_file.name,
        headers={"Content-Disposition": f'inline; filename="{target_file.name}"'}
    )
