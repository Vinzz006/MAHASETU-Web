# MAHASETU 🇮🇳

### Government Interoperability & Service Passport Platform
**Addressing Government of Maharashtra Problem Statement 26129**

> **ONE CITIZEN. ONE CONSENT. ONE APPLICATION ID. MULTIPLE DEPARTMENTS. ONE UNIFIED SERVICE JOURNEY.**  
> *Existing government systems remain in place. MahaSetu connects them.*

---

## 🏛️ Context & Problem Statement

Government of Maharashtra **Problem Statement 26129**:
*System integration and interoperability among government digital platforms, resulting in fragmented service delivery.*

Departments independently maintain portals, registries, workflows, and databases. Because of disparate data formats, citizens must submit identical information repeatedly, navigate multiple portals, and visit physical offices. Officials lack a consolidated view of beneficiaries, applications, approvals, and cross-department outcomes.

**MahaSetu** provides an **interoperability middleware layer** supporting:
- API-based federated exchange
- Canonical Data Model transformations
- DPDP-aligned consent management
- Universal Service Passport tracking (`MH-APP-2026-XXXXXX`)
- Event-driven orchestration
- Reusable legacy adapters (pipe-delimited flat file support)
- Exception capture with automated retries
- Real-time officer monitoring & audit telemetry
- AI Schema Mapping Assistant with human-in-the-loop governance

---

## ⚡ Quick Start

### Option A: Local Development (Zero-Dependency Setup)

**1. Start Backend (FastAPI)**
```bash
cd backend
python -m uvicorn backend.app.main:app --reload --port 8000
```
*The backend boots instantly using SQLite by default with pre-seeded demo personas.*

**2. Start Frontend (React + Vite)**
```bash
cd frontend
npm install
npm run dev
```
*Access the application at `http://localhost:5173`.*

---

### Option B: Docker Compose (Full Stack with PostgreSQL)

```bash
docker compose up --build
```
- Frontend: `http://localhost:5173`
- Backend API & Swagger Docs: `http://localhost:8000/docs`
- PostgreSQL: Port 5433

---

## 👥 Demo Personas & Credentials

| Persona | Role | Credentials | Purpose |
| :--- | :--- | :--- | :--- |
| **Demo Citizen** | `CITIZEN` | `9999999999` / `mahasetu123` | Apply for schemes, authorize consent, track service journey |
| **Demo Officer** | `OFFICER` | `8888888888` / `mahasetu123` | Monitor SLAs, manage integration exceptions, audit logs |
| **Integration Admin**| `SYSTEM_ADMIN`| `7777777777` / `mahasetu123` | Connector telemetry, AI schema mapping approval |

*A 1-click persona switcher is embedded directly into the navbar and login screen.*

---

## 🔄 The End-to-End Interoperability Journey

```
LOGIN (Demo Citizen)
  ↓
SELECT SERVICE (Maharashtra Employment & Skill Assistance Scheme)
  ↓
CREATE APPLICATION (Pre-populated from master registry)
  ↓
UNIVERSAL APPLICATION ID ISSUED (e.g. MH-APP-2026-000184)
  ↓
CONSENT AUTHORIZATION (Cryptographic SHA-256 signature)
  ↓
DEPARTMENT A (Identity Verification via Modern REST API)
  ↓
CANONICAL DATA MODEL TRANSFORMATION (citizen_name ➔ fullName)
  ↓
DEPARTMENT B (Eligibility Evaluation via Heterogeneous JSON)
  ↓
EVENT DRIVEN NOTIFICATION (ELIGIBILITY_VERIFIED)
  ↓
DEPARTMENT C (Scheme Sanction & Benefit Award)
  ↓
UNIFIED APPLICATION TRACKER (Live state machine & payloads)
  ↓
OFFICER COMMAND CENTER & AUDIT TRAIL
```

---

## 💥 Failure Handling & Resilience Demo

MahaSetu incorporates a live resilience toggle:
1. Click **"Simulate Dept B Failure"** on the floating bottom controller.
2. Advance an application to **Department B (Eligibility)**.
3. Observe **2 automated retries** followed by safe transition to the **EXCEPTION** state.
4. Navigate to the **Officer Dashboard** to view the incident in the **Resilience Queue**.
5. Toggle failure off and click **"Resolve & Retry"** to resume the workflow without lost state.

---

## 🤖 AI Schema Mapping Assistant

Located at `/admin/schema-mapper`:
- Compares disparate departmental schemas using semantic vector similarity and syntactic proximity.
- Suggests confidence-ranked field mappings (*e.g., `dob` ➔ `date_of_birth` 99%*).
- **Strict Governance**: The AI never makes autonomous citizen benefit or sanction decisions; mappings require explicit human administrative approval.

---

## 📁 Repository Structure

```text
mahasetu/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI application entrypoint
│   │   ├── database.py          # SQLAlchemy PostgreSQL/SQLite engine
│   │   ├── auth.py              # JWT authentication & RBAC guards
│   │   ├── models/              # users, applications, consents, workflows, txns, audits
│   │   ├── schemas/             # Pydantic v2 validation models & Canonical schemas
│   │   ├── services/            # Transformation, Consent, Workflow, Audit, AI Assistant
│   │   ├── integrations/        # Dept A (REST), Dept B (JSON), Dept C, Legacy Adapter
│   │   ├── events/              # Lightweight asynchronous event bus
│   │   └── api/                 # Auth, Services, Apps, Consents, Workflow, Dashboard, Demo
│   ├── tests/                   # Pytest suite (transformations, workflows, retries)
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── api/client.ts        # Typed API client
│   │   ├── context/             # AuthContext & DemoContext
│   │   ├── components/          # Navbar, Footer, DemoFloatingBar, CanonicalInspector
│   │   └── pages/
│   │       ├── citizen/         # Landing, Login, Dashboard, Services, Form, Consent, Tracker
│   │       ├── admin/           # Officer Dashboard, Integrations Monitor, AI Schema Mapper
│   │       └── lab/             # Innovation Lab (Exploratory showcase pages, code-split)
│   ├── Dockerfile
│   └── package.json
│
├── database/
│   └── seed/seed_data.py        # Seed script for demo accounts & benchmark records
│
├── docs/
│   ├── architecture.md          # Technical architecture & ERD
│   ├── api.md                   # OpenAPI endpoint reference
│   └── demo-script.md           # 3-minute hackathon judge walkthrough
│
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 🔬 Core Interoperability vs. Innovation Lab (Exploratory Extensions)

To maintain sharp focus on **Problem Statement 26129** (*System integration and interoperability among government digital platforms*), MahaSetu clearly distinguishes its core platform from future-proof research prototypes:

- **Core Interoperability Platform (The Primary Evaluation Surface)**:
  - Canonical Data Model (CDM) transformer (`Department A`, `B`, `C`, and pipe-delimited legacy adapters).
  - Cryptographic DPDP consent engine preventing cross-department data leakage.
  - Universal Application ID (`MH-APP-2026-XXXXXX`) tracking across disparate departmental databases.
  - Automated retry loop, resilience circuit-breakers, and officer exception queues.
  - Human-in-the-loop AI Schema Mapping Assistant for bridging novel departmental APIs.
  - Role-based access control (RBAC) and object-level ownership guards.

- **Innovation Lab (Exploratory Prototypes)**:
  - Modules such as Drone Telemetry, Bhoomi Geo-Cadastre, Quantum Key Rotation, EV Grid Balancing, etc., demonstrate potential domain-specific downstream consumers.
  - **Zero Bloat Guarantee**: All lab modules are code-split (`React.lazy`), bundled on-demand, grouped under `/lab/*`, and secured with role dependencies in the backend so they never interfere with core performance.

---

## 🧪 Automated Testing

Run backend unit, integration, and security tests:
```bash
python -m pytest backend/tests -v
```

The test suite validates:
- Canonical transformations across all 4 department schemas.
- Consent guardrails and object-level data ownership preventing unauthorized exchange.
- Strict authentication (bcrypt verification, token validation, 401/403 RBAC guards).
- Collision-safe universal application number generation.
- Automated retries, exception state capture, and recovery.

---

## 🏆 Final Hackathon Positioning

> *"MahaSetu is an interoperability infrastructure layer that makes fragmented government systems behave like one connected service ecosystem, without the cost or delay of replacing them."*
