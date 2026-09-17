import hashlib
import time
from typing import List, Dict, Any
from fastapi import APIRouter

router = APIRouter(prefix="/api/disbursal", tags=["DBT Treasury Disbursal Ledger"])

DBT_TRANSACTIONS = [
    {
        "id": "TXN-DBT-2026-001",
        "utr_number": "RBI20260902884192",
        "application_number": "MH-APP-2026-000184",
        "beneficiary_name": "Demo Citizen",
        "service_name": "Maharashtra Employment & Skill Assistance",
        "amount_inr": 5000,
        "bank_name": "Bank of Maharashtra",
        "account_mask": "XXXX-XXXX-3829",
        "ifsc_prefix": "MAHB0000123",
        "payment_rail": "RBI_EKUBER_APB",
        "status": "SETTLED_TO_ACCOUNT",
        "settled_at": "2026-09-02T17:40:00Z",
        "treasury_batch_token": "0x7f482a10c9e2b104928"
    },
    {
        "id": "TXN-DBT-2026-002",
        "utr_number": "RBI20260902991042",
        "application_number": "MH-APP-2026-000186",
        "beneficiary_name": "Demo Citizen",
        "service_name": "MahaDBT Farmer Agricultural Assistance",
        "amount_inr": 12000,
        "bank_name": "State Bank of India",
        "account_mask": "XXXX-XXXX-8910",
        "ifsc_prefix": "SBIN0000456",
        "payment_rail": "RBI_EKUBER_APB",
        "status": "SETTLED_TO_ACCOUNT",
        "settled_at": "2026-09-02T18:15:00Z",
        "treasury_batch_token": "0x9c310b871fa2840918a"
    },
    {
        "id": "TXN-DBT-2026-003",
        "utr_number": "RBI20260903110294",
        "application_number": "MH-APP-2026-000187",
        "beneficiary_name": "Kavita Shinde",
        "service_name": "Maharashtra Urban Affordable Housing Grant",
        "amount_inr": 50000,
        "bank_name": "Punjab National Bank",
        "account_mask": "XXXX-XXXX-1142",
        "ifsc_prefix": "PUNB0000789",
        "payment_rail": "PFMS_TREASURY_TRANSFER",
        "status": "PROCESSING_RBI_CLEARANCE",
        "settled_at": None,
        "treasury_batch_token": "0x12a8f9024bc1098e721"
    }
]

@router.get("/transactions")
def get_dbt_transactions():
    total_disbursed = sum(t["amount_inr"] for t in DBT_TRANSACTIONS if t["status"] == "SETTLED_TO_ACCOUNT")
    settled_count = sum(1 for t in DBT_TRANSACTIONS if t["status"] == "SETTLED_TO_ACCOUNT")

    return {
        "summary": {
            "total_transactions_count": len(DBT_TRANSACTIONS),
            "settled_count": settled_count,
            "total_disbursed_inr": total_disbursed,
            "payment_rail": "Reserve Bank of India (RBI) e-Kuber & APBS",
            "reconciliation_status": "100% BALANCED (Zero Transit Leakage)"
        },
        "transactions": DBT_TRANSACTIONS
    }
