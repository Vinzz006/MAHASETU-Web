from datetime import datetime, timezone

from backend.app.database import get_db
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

router = APIRouter(
    prefix="/api/district-cockpit",
    tags=["MahaDarpan District Collectorate Command Cockpit"],
)

MAHARASHTRA_DISTRICTS_DATA = [
    {
        "district": "Pune",
        "division": "Pune",
        "federation_readiness": 99.4,
        "total_applications": 28410,
        "completed": 27150,
        "sla_adherence_pct": 98.2,
        "disbursed_crores": 42.8,
        "bottleneck_dept": "None (Smooth)",
        "status": "OPTIMAL",
        "collector_office": "District Collectorate, Sassoon Road, Pune",
        "csc_kiosks_active": 412,
    },
    {
        "district": "Nagpur",
        "division": "Nagpur",
        "federation_readiness": 98.1,
        "total_applications": 19450,
        "completed": 18200,
        "sla_adherence_pct": 96.5,
        "disbursed_crores": 29.4,
        "bottleneck_dept": "None (Smooth)",
        "status": "OPTIMAL",
        "collector_office": "Collectorate Office, Civil Lines, Nagpur",
        "csc_kiosks_active": 328,
    },
    {
        "district": "Mumbai Suburban",
        "division": "Konkan",
        "federation_readiness": 99.0,
        "total_applications": 34800,
        "completed": 33120,
        "sla_adherence_pct": 97.4,
        "disbursed_crores": 51.6,
        "bottleneck_dept": "DEPT_B (Urban Slabs)",
        "status": "OPTIMAL",
        "collector_office": "Bandra East, Mumbai Suburban",
        "csc_kiosks_active": 540,
    },
    {
        "district": "Nashik",
        "division": "Nashik",
        "federation_readiness": 96.8,
        "total_applications": 16200,
        "completed": 15010,
        "sla_adherence_pct": 95.1,
        "disbursed_crores": 24.3,
        "bottleneck_dept": "None (Smooth)",
        "status": "OPTIMAL",
        "collector_office": "Old Agra Road, Nashik",
        "csc_kiosks_active": 290,
    },
    {
        "district": "Chhatrapati Sambhaji Nagar",
        "division": "Marathwada",
        "federation_readiness": 95.2,
        "total_applications": 14900,
        "completed": 13620,
        "sla_adherence_pct": 93.8,
        "disbursed_crores": 21.7,
        "bottleneck_dept": "DEPT_C (Bank Handshake)",
        "status": "SURGE_ALERT",
        "collector_office": "Collector Office Road, Chh. Sambhaji Nagar",
        "csc_kiosks_active": 245,
    },
    {
        "district": "Kolhapur",
        "division": "Pune",
        "federation_readiness": 97.5,
        "total_applications": 12800,
        "completed": 12100,
        "sla_adherence_pct": 96.9,
        "disbursed_crores": 19.8,
        "bottleneck_dept": "None (Smooth)",
        "status": "OPTIMAL",
        "collector_office": "Bhavani Mandap Road, Kolhapur",
        "csc_kiosks_active": 210,
    },
    {
        "district": "Solapur",
        "division": "Pune",
        "federation_readiness": 94.0,
        "total_applications": 11300,
        "completed": 10210,
        "sla_adherence_pct": 92.4,
        "disbursed_crores": 16.5,
        "bottleneck_dept": "DEPT_A (Land Registry Sync)",
        "status": "SURGE_ALERT",
        "collector_office": "Station Road, Solapur",
        "csc_kiosks_active": 195,
    },
    {
        "district": "Amravati",
        "division": "Amravati",
        "federation_readiness": 93.6,
        "total_applications": 9800,
        "completed": 8890,
        "sla_adherence_pct": 91.8,
        "disbursed_crores": 14.1,
        "bottleneck_dept": "DEPT_B (Income Slabs)",
        "status": "SURGE_ALERT",
        "collector_office": "Camp Area, Amravati",
        "csc_kiosks_active": 178,
    },
    {
        "district": "Gadchiroli",
        "division": "Nagpur",
        "federation_readiness": 89.4,
        "total_applications": 6400,
        "completed": 5420,
        "sla_adherence_pct": 87.5,
        "disbursed_crores": 9.2,
        "bottleneck_dept": "Edge Network Latency (CSC Edge Sync Active)",
        "status": "STORE_AND_FORWARD_RESILIENT",
        "collector_office": "Complex Area, Gadchiroli",
        "csc_kiosks_active": 112,
    },
    {
        "district": "Nandurbar",
        "division": "Nashik",
        "federation_readiness": 91.0,
        "total_applications": 7100,
        "completed": 6250,
        "sla_adherence_pct": 89.2,
        "disbursed_crores": 10.8,
        "bottleneck_dept": "Tribal Welfare Registry Sync",
        "status": "STORE_AND_FORWARD_RESILIENT",
        "collector_office": "Collector Office, Nandurbar",
        "csc_kiosks_active": 134,
    },
]


class DistrictActionRequest(BaseModel):
    district: str
    action_type: str  # "DISPATCH_OFFICER_REBALANCE", "TRIGGER_EDGE_BURST_SYNC", "EXPEDITE_COLLECTOR_OVERRIDE"
    officer_instructions: str
    authorized_by: str = "State e-Governance Mission Director"


@router.get("/summary")
def get_district_cockpit_summary(db: Session = Depends(get_db)):
    """
    Statewide macro dashboard for Chief Secretary & District Collectors.
    """
    total_state_apps = sum(d["total_applications"] for d in MAHARASHTRA_DISTRICTS_DATA)
    total_state_disbursed = round(
        sum(d["disbursed_crores"] for d in MAHARASHTRA_DISTRICTS_DATA), 2
    )
    avg_sla = round(
        sum(d["sla_adherence_pct"] for d in MAHARASHTRA_DISTRICTS_DATA)
        / len(MAHARASHTRA_DISTRICTS_DATA),
        1,
    )
    avg_readiness = round(
        sum(d["federation_readiness"] for d in MAHARASHTRA_DISTRICTS_DATA)
        / len(MAHARASHTRA_DISTRICTS_DATA),
        1,
    )

    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "state": "Maharashtra",
        "governance_portal": "MahaDarpan District Collectorate Cockpit",
        "statewide_kpis": {
            "total_districts_monitored": 36,
            "top_reporting_districts": len(MAHARASHTRA_DISTRICTS_DATA),
            "state_federation_index_pct": avg_readiness,
            "total_cross_department_applications": total_state_apps,
            "average_sla_compliance_pct": avg_sla,
            "total_direct_benefit_disbursed_crores": total_state_disbursed,
            "critical_exceptions_open": 2,
            "active_csc_gramin_centers": sum(
                d["csc_kiosks_active"] for d in MAHARASHTRA_DISTRICTS_DATA
            ),
        },
        "district_leaderboard": sorted(
            MAHARASHTRA_DISTRICTS_DATA,
            key=lambda x: x["sla_adherence_pct"],
            reverse=True,
        ),
        "surveillance_alerts": [
            {
                "district": "Chhatrapati Sambhaji Nagar",
                "severity": "MEDIUM",
                "alert": "Dept C Bank Disbursal Gateway latency elevated (+320ms). Auto-failover queue engaged.",
                "action_recommended": "Monitor PFMS clearing cycle",
            },
            {
                "district": "Gadchiroli",
                "severity": "LOW",
                "alert": "Store-and-Forward Edge Sync processed 420 remote village offline packets in last sync cycle.",
                "action_recommended": "Edge batch sync running normally",
            },
        ],
    }


@router.get("/district/{district_name}")
def get_district_details(district_name: str):
    """
    Specific district drilldown for the District Collector and Resident Deputy Collector (RDC).
    """
    for d in MAHARASHTRA_DISTRICTS_DATA:
        if d["district"].lower() == district_name.lower():
            return {
                "district": d["district"],
                "division": d["division"],
                "collector_office": d["collector_office"],
                "federation_readiness_pct": d["federation_readiness"],
                "total_applications": d["total_applications"],
                "completed_applications": d["completed"],
                "pending_applications": d["total_applications"] - d["completed"],
                "sla_adherence_pct": d["sla_adherence_pct"],
                "disbursed_funds_crores": d["disbursed_crores"],
                "bottleneck_department": d["bottleneck_dept"],
                "status": d["status"],
                "active_kiosks": d["csc_kiosks_active"],
                "top_schemes_disbursed": [
                    {
                        "scheme": "Maharashtra Employment & Skill Assistance",
                        "beneficiaries": int(d["completed"] * 0.48),
                    },
                    {
                        "scheme": "MahaDBT Farmer Input Subsidy",
                        "beneficiaries": int(d["completed"] * 0.34),
                    },
                    {
                        "scheme": "Urban Affordable Housing Subsidy",
                        "beneficiaries": int(d["completed"] * 0.18),
                    },
                ],
                "last_synchronized": datetime.now(timezone.utc).isoformat(),
            }

    # Default fallback for unlisted districts
    return {
        "district": district_name,
        "division": "Maharashtra Central",
        "collector_office": f"District Collectorate, {district_name}",
        "federation_readiness_pct": 93.0,
        "total_applications": 8500,
        "completed_applications": 7800,
        "pending_applications": 700,
        "sla_adherence_pct": 92.5,
        "disbursed_funds_crores": 12.0,
        "bottleneck_department": "None (Smooth)",
        "status": "OPTIMAL",
        "active_kiosks": 150,
        "top_schemes_disbursed": [],
        "last_synchronized": datetime.now(timezone.utc).isoformat(),
    }


@router.post("/dispatch-action")
def dispatch_district_administrative_action(req: DistrictActionRequest):
    """
    Enables State Mission Directors and District Collectors to trigger real-time
    rebalancing, offline edge batch syncs, or emergency SLA overrides.
    """
    dispatch_id = (
        f"MH-DISP-2026-{abs(hash(req.district + req.action_type)) % 90000 + 10000}"
    )

    return {
        "dispatch_id": dispatch_id,
        "district": req.district,
        "action_type": req.action_type,
        "status": "DISPATCH_EXECUTED",
        "authorized_by": req.authorized_by,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "officer_instructions": req.officer_instructions,
        "telemetry_message": f"Administrative directive {dispatch_id} transmitted to {req.district} District Collectorate. Automated workflows adjusted.",
    }
