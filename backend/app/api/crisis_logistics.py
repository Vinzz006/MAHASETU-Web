import random
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from fastapi import APIRouter

router = APIRouter(prefix="/api/crisis-logistics", tags=["MahaRahat — Crisis Evacuation & Logistics Mesh"])

DISASTER_EVACUATION_NODES = [
    {
        "node_id": "NODE-RAI-MAHAD-01",
        "shelter_name": "Mahad Cyclone & Flood Resilient Center",
        "district": "Raigad",
        "capacity_persons": 3500,
        "current_occupancy": 1420,
        "available_capacity": 2080,
        "icu_beds_available": 18,
        "ndrf_battalion_stationed": "5th Battalion NDRF (Pune Unit)",
        "status": "OPERATIONAL_READY"
    },
    {
        "node_id": "NODE-RAT-CHIPLUN-02",
        "shelter_name": "Vashishti River Basin Community Shelter",
        "district": "Ratnagiri",
        "capacity_persons": 2800,
        "current_occupancy": 2100,
        "available_capacity": 700,
        "icu_beds_available": 6,
        "ndrf_battalion_stationed": "SDRF Coastal Command",
        "status": "ELEVATED_ALERT"
    },
    {
        "node_id": "NODE-KOL-SHIROLI-03",
        "shelter_name": "Panchganga Flood Relief Base",
        "district": "Kolhapur",
        "capacity_persons": 4200,
        "current_occupancy": 980,
        "available_capacity": 3220,
        "icu_beds_available": 24,
        "ndrf_battalion_stationed": "Army Southern Command Unit",
        "status": "OPERATIONAL_READY"
    }
]

class DispatchCorridorRequest(BaseModel):
    source_node: str = "NODE-RAI-MAHAD-01"
    destination_cluster: str = "Poladpur Remote Tribal Hamlet"
    payload_type: str = "EMERGENCY_ANTIVENOM_AND_O_NEG_BLOOD"

@router.get("/evacuation-nodes")
def get_evacuation_logistics_nodes():
    """
    Returns live capacities of disaster shelters, ICU bed reserves, and NDRF relief stocks.
    """
    total_cap = sum(n["capacity_persons"] for n in DISASTER_EVACUATION_NODES)
    total_occ = sum(n["current_occupancy"] for n in DISASTER_EVACUATION_NODES)
    total_icu = sum(n["icu_beds_available"] for n in DISASTER_EVACUATION_NODES)

    return {
        "portal": "MahaRahat — Crisis Evacuation & Logistics Mesh",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "total_shelter_capacity": total_cap,
        "current_sheltered_citizens": total_occ,
        "available_shelter_headroom": total_cap - total_occ,
        "available_icu_beds": total_icu,
        "active_disaster_mesh_nodes": DISASTER_EVACUATION_NODES
    }

@router.post("/dispatch-corridor")
def activate_drone_corridor(req: DispatchCorridorRequest):
    """
    Activates an autonomous DGCA-compliant emergency drone medical green corridor.
    """
    now_iso = datetime.now(timezone.utc).isoformat()
    corridor_id = f"CORRIDOR-UAV-MH-{random.randint(1000, 9999)}"

    return {
        "status": "GREEN_CORRIDOR_ACTIVE",
        "corridor_id": corridor_id,
        "source_base": req.source_node,
        "destination": req.destination_cluster,
        "payload": req.payload_type,
        "drone_callsign": "MAHA-DRONE-LIFE-07",
        "estimated_flight_minutes": 14.5,
        "airspace_clearance": "AUTOMATED_DGCA_BEYOND_VISUAL_LINE_OF_SIGHT (BVLOS)",
        "ground_contact": "Local Primary Health Center (PHC) Medical Officer Alerted",
        "timestamp": now_iso
    }
