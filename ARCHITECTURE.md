# MAHASETU — Target Architecture Specification

### Government Interoperability & Verifiable Digital Service Platform
**Addressing Government of Maharashtra Problem Statement SIH 26129**  
**Architecture Style**: Modular Service-Oriented Architecture (Microservice-Ready)

---

## 1. Architectural Philosophy & Strategy

MahaSetu does **not** replace existing government departmental databases, nor does it mandate that legacy mainframes rewrite their core software. Instead, MahaSetu introduces a **federated interoperability middleware layer** operating on the principle:

> **ONE CITIZEN. ONE CONSENT. ONE APPLICATION ID. MULTIPLE DEPARTMENTS. ONE UNIFIED SERVICE JOURNEY.**

Rather than requiring $N \times (N-1)$ point-to-point integrations across departments, MahaSetu standardizes communication through a **Canonical Data Model (CDM)** and a pluggable **Department Adapter Layer**.

---

## 2. High-Level Conceptual Architecture

```
                    CITIZEN
                       │
                  Web / Mobile
                       │
                Identity Layer
          (JWT / OIDC / Sandbox IdP)
                       │
                  API Gateway
     (Rate Limiting / Idempotency / Correlation)
                       │
             Service Orchestration
                       │
        ┌──────────────┼──────────────┐
        │              │              │
    Consent       Application      Workflow
    Service         Service         Engine
        │              │              │
        └──────────────┼──────────────┘
                       │
             Canonical Data Model (CDM)
                       │
             Transformation Engine
                       │
          Department Adapter Layer
                       │
       ┌───────────────┼────────────────┐
       │               │                │
   REST/JSON       SOAP/XML       Legacy Systems
       │               │          (Pipe / Flat)
       └───────────────┼────────────────┘
                       │
             Government Departments
         (Identity, Eligibility, Sanction, Land)
```

---

## 3. Core Architectural Layers

### 3.1 Identity Layer & Pluggable SSO
- **Authentication**: Pluggable `BaseIdentityProvider` supporting local JWT, Firebase Auth, and OpenID Connect (OIDC).
- **Federated Government SSO**: OIDC-compatible mock identity provider simulating integration with standard government single-sign-on platforms (such as MeriPehchaan / Jan Parichay).
- **Role-Based Access Control (RBAC)**: Strict role separation across 6 distinct personas:
  - `CITIZEN`: Self-service portal, application tracking, consent approvals/revocations, download passport.
  - `OFFICER`: Departmental verification queue, manual review of exceptions.
  - `DEPARTMENT_A` / `DEPARTMENT_B` / `DEPARTMENT_C`: Department-specific transaction processing.
  - `SYSTEM_ADMIN`: Department registry management, connector studio, schema mapping approvals.
  - `AUDITOR`: Independent cryptographically verified audit inspection.

### 3.2 API Gateway & Security Perimeter
- **Request Correlation**: Immutable `X-Request-ID` tracing header propagated across all internal service calls and external department requests.
- **Idempotency**: 24-hour sliding cache for mutating requests using `Idempotency-Key` headers to prevent accidental duplicate submissions.
- **Rate Limiting**: IP and token-based rate limiting to prevent denial-of-service.
- **Security Headers**: Strict Content-Security-Policy (CSP), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`.

### 3.3 Service Orchestration Layer
- **Consent Governance Service**:
  - DPDP-aligned consent management enforcing purpose limitation, data minimization, and time-bounded validity.
  - Granular verification: Blocks any departmental transaction unless valid, authorized consent covers the specific data categories requested.
  - Generates immutable `DataSharingLog` records for every disclosure event.
- **Master Data Management (MDM) Service**:
  - Golden record maintenance (`CitizenMasterRecord`) with source-of-truth tracking.
  - `IdentifierRegistry` resolving disparate departmental IDs (e.g. Dept A: `A-12345`, Dept B: `B-77891` $\rightarrow$ MahaSetu: `MS-000123`).
  - Multi-attribute matching algorithm with confidence scoring and an ambiguous match review queue.
- **Configurable Workflow Engine**:
  - Declarative workflow definitions (`WorkflowDefinition`) defining states, transitions, required roles, department ownership, and SLA timers.
  - Resilient exception state management with automated retries and officer escalation.

### 3.4 Canonical Data Model & Transformation Engine
- Common government schema covering: `Citizen`, `Identity`, `Address`, `Household`, `Application`, `Department`, `Service`, `Document`, `Consent`, `Benefit`, `Workflow`, `Grievance`, `Notification`.
- Bidirectional transformations:
  $$\text{Department A (REST)} \xrightarrow{\text{Adapter A}} \text{CDM} \xrightarrow{\text{Adapter B}} \text{Department B (JSON)}$$
  $$\text{Department A (REST)} \xrightarrow{\text{Adapter A}} \text{CDM} \xrightarrow{\text{Adapter L}} \text{Legacy (Pipe Stream)}$$

### 3.5 Department Adapter Layer
- **Department Registry**: Database-backed registry tracking each department's code, endpoints, protocol, authentication, schema version, and health status.
- **Connector Registry**: Reusable connector instances for:
  - Modern REST/JSON (OpenAPI 3.0)
  - Enterprise SOAP/XML
  - Legacy Pipe-Delimited streams (`CIT001|Sunita Patil|Pune|MH`)
  - Batch CSV streams

---

## 4. Supporting Infrastructure & Reliability

| Component | Technology | Role |
| :--- | :--- | :--- |
| **Database** | SQLite (dev) / PostgreSQL (prod) | Relational persistence with foreign keys, constraints, and indexes |
| **Caching & State** | In-Memory / Redis | Idempotency caching, rate limiting, and session tracking |
| **Audit Log** | SHA-256 Tamper-Evident Chain | Append-only table with DB event listener blocking updates/deletions |
| **Metrics** | Prometheus `/metrics` | HTTP latency, error rates, connector throughput, SLA compliance |
| **Probes** | Kubernetes `/healthz` & `/readyz` | Liveness and readiness health monitoring |
| **Deployment** | Docker & Docker Compose | Multi-container reproducible deployment |

---

## 5. Architectural Non-Goals & Realism Guardrails

To remain 100% technically defensible before SIH evaluators:
1. **No Fake Microservices**: The system is implemented as a **Modular Service-Oriented Monolith**, cleanly decoupled so individual services (Consent, MDM, Workflow) can be split into standalone microservices if required in cloud deployment.
2. **No Fake Blockchain**: Audit integrity is implemented using **SHA-256 cryptographic hash chaining** and database-level append-only triggers.
3. **No Fake Live Government Integration**: Department connectors are clearly identified as **Sandbox Connectors** simulating real-world departmental protocols (REST, SOAP, Pipe-delimited flat files).
