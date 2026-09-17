from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.service import Service
from backend.app.schemas.application import ServiceDefinition, ServiceCreate, ServiceUpdate
from backend.app.auth import require_roles

router = APIRouter(prefix="/api/services", tags=["Government Services"])

# Baseline definitions for fallback and initial auto-seeding
INITIAL_SERVICES = [
    {
        "id": "employment-support",
        "name": "Maharashtra Employment & Skill Assistance Scheme",
        "name_mr": "महाराष्ट्र रोजगार व कौशल्य सहाय्य योजना",
        "department": "Skill Development, Employment & Entrepreneurship Department",
        "description": "Unified financial stipend and vocational placement assistance. Cross-verifies identity via Dept A, evaluates eligibility through Dept B, and sanctions benefits through Dept C.",
        "description_mr": "एकात्मिक आर्थिक विद्यावेतन व कौशल्य सहाय्य योजना. विभागांमार्फत थेट पडताळणी.",
        "participating_departments": ["DEPT_A (Identity)", "DEPT_B (Eligibility)", "DEPT_C (Employment)"],
        "sla_days": 3,
        "is_active": True
    },
    {
        "id": "farmer-dbt",
        "name": "MahaDBT Farmer Agricultural Assistance",
        "name_mr": "महाडीबीटी शेतकरी कृषी सहाय्य योजना",
        "department": "Agriculture & Rural Development Department",
        "description": "Direct Benefit Transfer for certified agrarian households and micro-irrigation subsidies across 36 districts.",
        "description_mr": "थेट लाभ वितरण आणि सूक्ष्म सिंचन अनुदान योजना.",
        "participating_departments": ["Agriculture Dept", "Land Records (Legacy)", "Finance Dept"],
        "sla_days": 7,
        "is_active": True
    },
    {
        "id": "urban-housing",
        "name": "Maharashtra Urban Affordable Housing Grant",
        "name_mr": "महाराष्ट्र नागरी परवडणारे घरकुल अनुदान",
        "department": "Housing & Urban Development Department",
        "description": "Interest subsidy and capital assistance for economically weaker sections (EWS) and low-income groups.",
        "description_mr": "आर्थिकदृष्ट्या दुर्बल घटकांसाठी व्याज अनुदान व घरकुल योजना.",
        "participating_departments": ["Urban Development", "Municipal Corporations", "Revenue Dept"],
        "sla_days": 14,
        "is_active": True
    },
    {
        "id": "smart-ration",
        "name": "Unified Food Security & Ration Card Portability",
        "name_mr": "एकात्मिक अन्न सुरक्षा व शिधापत्रिका पोर्टेबिलिटी",
        "department": "Food, Civil Supplies and Consumer Protection",
        "description": "One Nation One Ration Card interoperability integration with State Food Grain Allocation registry.",
        "description_mr": "एक देश एक शिधापत्रिका आंतरकार्यक्षमता प्रणाली.",
        "participating_departments": ["Civil Supplies", "Legacy Civil Registry", "PDS Network"],
        "sla_days": 5,
        "is_active": True
    }
]

def ensure_initial_services(db: Session):
    if db.query(Service).count() == 0:
        for s_data in INITIAL_SERVICES:
            s = Service(**s_data)
            db.add(s)
        db.commit()

def get_service_name(service_id: str) -> str:
    from backend.app.database import SessionLocal
    db = SessionLocal()
    try:
        s = db.query(Service).filter(Service.id == service_id).first()
        if s:
            return s.name
    except Exception:
        pass
    finally:
        db.close()
    for s in INITIAL_SERVICES:
        if s["id"] == service_id:
            return s["name"]
    return "Unknown Service"

@router.get("", response_model=List[ServiceDefinition])
def get_services(
    include_inactive: bool = False,
    db: Session = Depends(get_db)
):
    """Returns the catalog of government services participating in MahaSetu."""
    ensure_initial_services(db)
    query = db.query(Service)
    if not include_inactive:
        query = query.filter(Service.is_active == True)
    services = query.order_by(Service.name.asc()).all()
    return services


@router.get("/stats")
def get_service_stats(db: Session = Depends(get_db)):
    """
    Public endpoint — returns platform-wide service catalog metrics
    for the Services Page hero banner. No auth required.
    """
    ensure_initial_services(db)
    total = db.query(Service).count()
    active = db.query(Service).filter(Service.is_active == True).count()
    services = db.query(Service).filter(Service.is_active == True).all()

    # Department count (unique departments)
    departments = set(s.department for s in services if s.department)

    # SLA stats
    sla_values = [s.sla_days for s in services if s.sla_days]
    avg_sla = round(sum(sla_values) / len(sla_values), 1) if sla_values else 0
    min_sla = min(sla_values) if sla_values else 0

    return {
        "total_services": total,
        "active_services": active,
        "total_departments": len(departments),
        "avg_sla_days": avg_sla,
        "min_sla_days": min_sla,
        "platform": "MahaSetu Interoperability Layer",
        "compliance": ["DPDP Act 2023", "Maharashtra IT Policy 2023", "W3C VC Standard"],
    }


@router.get("/categories")
def get_service_categories(db: Session = Depends(get_db)):
    """
    Returns services grouped by category/department for the
    Services Catalog filter sidebar. No auth required.
    Maps each service to a friendly category label.
    """
    ensure_initial_services(db)
    services = db.query(Service).filter(Service.is_active == True).all()

    # Map service IDs to friendly categories
    CATEGORY_MAP = {
        "employment-support": "Employment & Skills",
        "farmer-dbt":         "Agriculture & Rural",
        "urban-housing":      "Housing & Urban",
        "smart-ration":       "Food & Civil Supplies",
    }
    DEFAULT_CATEGORY = "Welfare & Social"

    categories: dict = {}
    for svc in services:
        cat = CATEGORY_MAP.get(svc.id, DEFAULT_CATEGORY)
        if cat not in categories:
            categories[cat] = []
        categories[cat].append({
            "id": svc.id,
            "name": svc.name,
            "name_mr": svc.name_mr,
            "sla_days": svc.sla_days,
            "department": svc.department,
            "is_active": svc.is_active,
        })

    return {
        "categories": [
            {"name": cat, "count": len(svcs), "services": svcs}
            for cat, svcs in sorted(categories.items())
        ],
        "total": sum(len(s) for s in categories.values()),
    }



@router.get("/{service_id}", response_model=ServiceDefinition)
def get_service_by_id(service_id: str, db: Session = Depends(get_db)):
    """Retrieves a single service by its identifier."""
    ensure_initial_services(db)
    s = db.query(Service).filter(Service.id == service_id).first()
    if not s:
        first_svc = db.query(Service).filter(Service.is_active == True).first()
        if first_svc:
            return first_svc
        raise HTTPException(status_code=404, detail="Service not found")
    return s

@router.post("", response_model=ServiceDefinition, status_code=status.HTTP_201_CREATED)
def create_service(
    payload: ServiceCreate,
    db: Session = Depends(get_db),
    _admin = Depends(require_roles(["ADMIN", "SYSTEM_ADMIN"]))
):
    """Admin-only: Creates a new government service in the catalogue."""
    existing = db.query(Service).filter(Service.id == payload.id).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Service with ID '{payload.id}' already exists")

    new_svc = Service(
        id=payload.id,
        name=payload.name,
        name_mr=payload.name_mr,
        department=payload.department,
        description=payload.description,
        description_mr=payload.description_mr,
        participating_departments=payload.participating_departments,
        sla_days=payload.sla_days,
        is_active=payload.is_active
    )
    db.add(new_svc)
    db.commit()
    db.refresh(new_svc)
    return new_svc

@router.put("/{service_id}", response_model=ServiceDefinition)
def update_service(
    service_id: str,
    payload: ServiceUpdate,
    db: Session = Depends(get_db),
    _admin = Depends(require_roles(["ADMIN", "SYSTEM_ADMIN"]))
):
    """Admin-only: Updates an existing government service definition."""
    svc = db.query(Service).filter(Service.id == service_id).first()
    if not svc:
        raise HTTPException(status_code=404, detail="Service not found")

    update_data = payload.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        setattr(svc, k, v)

    db.commit()
    db.refresh(svc)
    return svc

@router.delete("/{service_id}")
def delete_service(
    service_id: str,
    db: Session = Depends(get_db),
    _admin = Depends(require_roles(["ADMIN", "SYSTEM_ADMIN"]))
):
    """Admin-only: Removes a government service from the catalogue."""
    svc = db.query(Service).filter(Service.id == service_id).first()
    if not svc:
        raise HTTPException(status_code=404, detail="Service not found")

    db.delete(svc)
    db.commit()
    return {"status": "SUCCESS", "message": f"Service '{service_id}' successfully deleted"}
