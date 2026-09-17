# MAHASETU — Architecture & Technical Specification

### Government Interoperability & Service Passport Platform
**Addressing Government of Maharashtra Problem Statement 26129**

---

## 1. Executive Summary & Core Proposition

Government departments often operate siloed, independently developed digital platforms, databases, and registries. Differences in protocols, schemas, identifiers, and workflows force citizens into repeated submissions, disparate portals, and disconnected tracking.

> **ONE CITIZEN. ONE CONSENT. ONE APPLICATION ID. MULTIPLE DEPARTMENTS. ONE UNIFIED SERVICE JOURNEY.**

**MahaSetu** is not another generic portal. It is a federated **interoperability middleware layer** that bridges heterogeneous government platforms without replacing them.

```
                                 [ CITIZEN / USER ]
                                          │
                     ┌────────────────────┴────────────────────┐
                     ▼                                         ▼
             [ Citizen Portal ]                     [ Officer Command Center ]
       (Service Passport & Tracker)                (Interoperability Monitor)
                     │                                         │
                     └────────────────────┬────────────────────┘
                                          │ REST / JWT Auth (RBAC)
                                          ▼
                      ┌────────────────────────────────────────┐
                      │        MAHASETU INTEROP HUB            │
                      │ ────────────────────────────────────── │
                      │  • API Gateway & Auth Router           │
                      │  • Consent Engine (DPDP Enforcer)      │
                      │  • Canonical Data Model Transformer    │
                      │  • Configurable Workflow Engine        │
                      │  • Event Bus (Audit & Metrics)         │
                      │  • Resilient Retry & Failure Handler   │
                      │  • AI Schema Mapping Assistant         │
                      └───────────────────┬────────────────────┘
                                          │
        ┌───────────────────┬─────────────┴───────┬───────────────────┐
        ▼                   ▼                     ▼                   ▼
 ┌───────────────┐   ┌───────────────┐    ┌───────────────┐   ┌───────────────┐
 │ Dept A (REST) │   │ Dept B (JSON) │    │ Dept C (Appr) │   │ Legacy System │
 │ Identity Dept │   │  Eligibility  │    │  Employment   │   │ Pipe Delimited│
 └───────────────┘   └───────────────┘    └───────────────┘   └───────────────┘
```

---

## 2. Core Architectural Pillars

### 2.1 The Service Passport & Universal Application ID
Every application initiated through MahaSetu receives a correlate-able **Universal Application ID** (e.g. `MH-APP-2026-000184`). This ID unifies:
- Citizen identity & pre-verified attributes
- Time-bounded citizen consent record
- Multi-department workflow execution state
- Intersystem transaction payloads
- Chronological, tamper-evident audit trails

### 2.2 Canonical Data Model & Bidirectional Transformation Engine
Instead of requiring $N \times (N-1)$ point-to-point integrations between departments, MahaSetu introduces a standardized internal **Canonical Data Model**:

```json
{
  "citizen": {
    "id": "CIT-001",
    "name": "Demo Citizen",
    "phone": "9999999999",
    "dateOfBirth": "1998-05-12",
    "address": {
      "district": "Pune",
      "state": "Maharashtra",
      "pincode": "411001"
    },
    "annualIncome": 180000,
    "employmentStatus": "UNEMPLOYED"
  },
  "serviceId": "employment-support",
  "applicationNumber": "MH-APP-2026-000184"
}
```

The transformation pipeline converts disparate departmental models into the Canonical Model and vice versa:
$$\text{Department A Schema} \xrightarrow{\text{Adapter A}} \text{Canonical Model} \xrightarrow{\text{Adapter B}} \text{Department B Schema}$$

### 2.3 Legacy System Adapter Pattern
Older mainframe systems that communicate through pipe-delimited flat files (`CIT001|Demo Citizen|Pune|MH`) interact with MahaSetu through the exact same `DepartmentConnector` abstraction. The legacy adapter parses flat streams into the Canonical Model, proving that legacy infrastructure does not require costly rewrites.

### 2.4 Consent-First Guardrails (DPDP Aligned)
Protected citizen information is strictly guarded. Before any inter-department data exchange occurs, the `ConsentManager` checks:
1. Active consent record for the specific `application_id`.
2. Status is `AUTHORIZED`.
3. Not expired ($\le 90$ days).
If no valid consent exists, an HTTP 403 Forbidden is returned and transactions are blocked.

### 2.5 Resilient Failure & Exception Recovery
When an integrated departmental API experiences failure (demonstrated via the **Simulated Department B Failure** toggle):
1. The transaction is logged with `status: FAILED`.
2. MahaSetu attempts automated retries (e.g. Attempt 1, Attempt 2).
3. Upon retry exhaustion, the application transitions to `EXCEPTION` state rather than crashing or dropping data.
4. The Officer Dashboard surfaces an **Integration Exception** record with retry telemetry.
5. Once the connectivity issue is resolved, an administrator initiates a manual or automated retry that advances the workflow to subsequent departments.

---

## 3. Database Entity Relationship Diagram

```
   ┌────────────────┐
   │     users      │
   │────────────────│
   │ id (PK)        │
   │ name           │
   │ mobile         │
   │ role           │
   │ department_id  │
   └───────┬────────┘
           │ 1:N
           ▼
   ┌────────────────┐       1:1       ┌────────────────┐
   │  applications  ├─────────────────┤    consents    │
   │────────────────│                 │────────────────│
   │ id (PK)        │                 │ id (PK)        │
   │ application_no │                 │ consent_number │
   │ citizen_id(FK) │                 │ status         │
   │ service_id     │                 │ consent_hash   │
   │ status         │                 └────────────────┘
   │ current_dept   │
   └───────┬────────┘
           │
           ├────────────────────────┬────────────────────────┐
           │ 1:N                    │ 1:N                    │ 1:N
           ▼                        ▼                        ▼
┌──────────────────────┐ ┌──────────────────────┐ ┌──────────────────────┐
│    workflow_steps    │ │ dept_transactions    │ │      audit_logs      │
│──────────────────────│ │──────────────────────│ │──────────────────────│
│ id (PK)              │ │ id (PK)              │ │ id (PK)              │
│ step_name            │ │ department_id        │ │ actor_id             │
│ department_id        │ │ operation            │ │ action               │
│ status               │ │ request_payload      │ │ resource             │
│ completed_at         │ │ response_payload     │ │ metadata_json        │
└──────────────────────┘ │ retry_count          │ │ timestamp            │
                         └──────────────────────┘ └──────────────────────┘
```
