# MAHASETU — Full Repository Technical Audit (SIH 26129)

**Date of Audit**: 2026-09-26  
**Auditor Role**: Senior Enterprise Architect, Security Engineer & SIH Technical Evaluator  
**Problem Statement**: SIH 26129 — System integration and interoperability among government digital platforms, resulting in fragmented service delivery.  
**Repository**: [Vinzz006/MAHASETU-Web](https://github.com/Vinzz006/MAHASETU-Web)  

---

## Executive Summary

MahaSetu is designed as a federated interoperability middleware platform connecting disparate Government of Maharashtra departmental databases, registries, and workflows. This audit evaluates the technical defensibility, security, architectural integrity, and accuracy of claims across the codebase before executing hardening phases.

---

## A. Existing Capabilities (Verified in Codebase)

1. **FastAPI Application Backbone**:
   - Structured routers mounted under `/api/v1/` with backward-compatible versioning middleware.
   - Comprehensive middleware stack: `RequestCorrelationMiddleware` (`X-Request-ID`), `IdempotencyMiddleware` (24h caching), `AppWideRateLimitMiddleware`, GZip compression, and standard security headers (CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy).
   - Standardized error envelopes and exception handlers (`middleware/error_handler.py`).

2. **Core Interoperability Routers**:
   - `/api/v1/auth`: Citizen registration, bcrypt password hashing, JWT generation, admin approval gate.
   - `/api/v1/services`: Service catalog for participating departments.
   - `/api/v1/applications`: Application submission, universal tracking ID generation (`MH-APP-2026-XXXXXX`).
   - `/api/v1/consent`: Citizen consent request, authorization, revocation, and tamper-check SHA-256 hash.
   - `/api/v1/integrations`: Department connectors (`DEPT_A`, `DEPT_B`, `DEPT_C`, `LEGACY_01`) and transformation trace.
   - `/api/v1/workflow`: 8-step pipeline execution, admin sign-off, rework cycles, auditor confirmation.
   - `/api/v1/dashboard`: Live stats and aggregate metrics for citizens, officers, and administrators.
   - `/api/v1/passport`: Digital Service Passport QR generation and PDF receipts.
   - `/api/v1/audit_logs`: Append-only audit trail with tamper-hash chain verification and DB update/delete blocks.

3. **Department Connectors & Transformation**:
   - `DepartmentAConnector`: REST/JSON adapter for identity verification.
   - `DepartmentBConnector`: Heterogeneous JSON adapter for eligibility criteria with simulated failure toggle.
   - `DepartmentCConnector`: REST adapter for scheme approval and benefit sanctioning.
   - `LegacyDepartmentConnector`: Pipe-delimited flat-file adapter (`CIT001|Name|District|MH`) parsing to and from the Canonical Data Model without rewriting mainframe code.
   - `DataTransformationEngine`: Bidirectional translation between departmental schemas and Canonical Model.

4. **Observability & Operations**:
   - Kubernetes liveness (`/healthz`) and readiness (`/readyz`) probes.
   - Prometheus metrics exposition (`/metrics`).
   - Automated disaster recovery backup/restore scripts with SHA-256 checksums (`scripts/backup_restore.sh`, `.ps1`).

5. **Testing Suite**:
   - 171 automated backend pytest tests across auth, workflow, transformation, audit, security, performance, and failure recovery.

---

## B. Missing SIH Requirements (Gaps Identified)

1. **Formal Department Registry**:
   - Current departments (`DEPT_A`, `DEPT_B`, `DEPT_C`, `LEGACY_01`) are hardcoded in connector files rather than maintained as a dynamic, database-backed Department Registry tracking protocols, URLs, schema versions, auth methods, health status, and sync times.

2. **Reusable Connector Registry**:
   - While adapters exist in `backend/app/integrations/`, there is no standardized `ConnectorRegistry` table supporting dynamic connector configuration (connection config, auth config, request/response schema mappings, timeout, retry policies, enable/disable toggle).

3. **Master Data Management (MDM) Layer**:
   - The platform has a `ResidentProfile` table, but lacks a formal MDM entity model:
     - No `CitizenMasterRecord` with source-of-truth designation and record versioning.
     - No `IdentifierRegistry` mapping heterogeneous department identifiers (e.g. Dept A: `A-12345`, Dept B: `B-77891`, MahaSetu: `MS-000123`).
     - No multi-attribute confidence scoring matching algorithm or manual review queue for ambiguous matches.

4. **Data Sharing Logging & Granular Scope Enforcement**:
   - Consent checks exist, but do not record granular per-exchange data-sharing logs (which department accessed what data categories, purpose, timestamp, correlation ID).

5. **Federated Identity / SSO Abstraction**:
   - Authentication relies on local JWT or Firebase. There is no pluggable identity abstraction supporting OpenID Connect (OIDC) government identity providers (such as MeriPehchaan / Jan Parichay).

6. **Configurable Workflow Engine**:
   - The workflow pipeline is hardcoded to an 8-step sequential Python array in `services/workflow.py`. There is no schema-driven workflow definition model supporting dynamic states, transitions, custom scheme SLAs, and conditional branching.

---

## C. Red Flags (Critical Findings)

1. **Superfluous "Innovation Lab" Endpoints**:
   - The repository contains 50+ speculative files in `backend/app/api/` (e.g., `pqc_quantum_sandbox.py`, `zk_property_tax.py`, `confidential_mpc.py`, `quantum_key_rotation.py`, `drone_pmfby.py`, `ev_grid_balancer.py`).
   - While mounted conditionally behind `ENABLE_INNOVATION_LAB=False`, these endpoints represent buzzword bloat that harms credibility if an SIH evaluator inspects the codebase. They must be clearly isolated and labeled as non-core speculative prototypes.

2. **Overclaims in Documentation and Stats**:
   - `README.md` and `/platform/stats` claim "DPDP Act 2023 Compliant", "Immutable Merkle Audit Log", "NIST PQC", "RFC 6962 Merkle", and "W3C VC Standard".
   - The implementation uses SHA-256 hash chaining and append-only database triggers, NOT an external RFC 6962 transparency log or formal legal compliance certificate.

3. **Fictitious Government Entity References**:
   - Diagrams mention "UIDAI / Civil Identity" directly for Department A. In a hackathon prototype without official government API agreements, this must be accurately described as "Simulated Civil Identity Registry Adapter (Sandbox Mode)".

---

## D. Security Risks

1. **Demo Personas Endpoint**:
   - `/api/v1/auth/personas` returns tokens for all pre-seeded accounts. This is protected by `SYSTEM_ADMIN` role and `DEMO_MODE=True`, but must never be exposed or enabled in production.
2. **Hardcoded Seed Passwords in Documentation**:
   - `README.md` and `docs/api.md` list `mahasetu123` as demo passwords, while `seed_data.py` generates random passwords in secure environments. Documentation must explicitly clarify that these credentials are for local synthetic sandbox testing only.
3. **Missing Granular Field-Level Authorization**:
   - Inter-department exchanges check whether consent is `AUTHORIZED`, but do not enforce that the specific requested fields match the exact scope granted in the consent record.

---

## E. Architecture Risks

1. **Tight Coupling in Workflow Advancement**:
   - Advancing the workflow relies on hardcoded `if step_name == "..."` branches. Adding a new department or scheme requires modifying core Python files.
2. **Missing Database-Backed Identifier Resolution**:
   - If a citizen applies under a different phone number or typo, there is no duplicate detection or multi-attribute MDM deduplication to prevent fragmented records.

---

## F. Recommended Changes (Action Plan)

1. **Implement Department Registry** (`department_registry` table, CRUD & health check API).
2. **Implement Connector Registry** (`connector_registry` table, protocol adapters for REST, SOAP/XML, pipe-delimited, and CSV).
3. **Implement Master Data Management (MDM)**:
   - `CitizenMasterRecord`, `IdentifierRegistry`, `MDMMatchReview`.
   - Multi-attribute confidence matching (mobile, email, name, DOB, district) with ambiguous match review queue.
4. **Harden Consent Management**:
   - Add requesting/receiving departments, explicit scopes, revocation timestamps.
   - Implement `DataSharingLog` recording every access event.
   - Replace "DPDP Compliant" with "DPDP-Aligned Consent Management".
5. **Implement Federated Identity / SSO**:
   - Pluggable `BaseIdentityProvider` abstraction.
   - OIDC-compatible Sandbox Identity Provider simulating MeriPehchaan / Jan Parichay.
6. **Implement Configurable Workflow Engine**:
   - `WorkflowDefinition` model with declarative state/transition JSON.
   - Engine that evaluates definitions while preserving backward compatibility for the 8-step pipeline.
7. **Clean Documentation**:
   - Eliminate all unsupported claims (Merkle tree RFC 6962, NIST PQC, DPDP certified).
   - Clarify sandbox connectors vs real government APIs.

---

## G. Features That Must Remain Explicitly "Prototype / Sandbox"

- All department connectors (`DEPT_A`, `DEPT_B`, `DEPT_C`, `LEGACY_01`).
- Simulated failure toggles (`DepartmentBFailureController`).
- Mock OIDC Identity Provider (`MeriPehchaan / Jan Parichay Sandbox`).
- Synthetic citizen test data.

---

## H. Claims That Must Be Removed or Rewritten

| Original Claim | Verdict | Rewritten Technically Accurate Claim |
| :--- | :--- | :--- |
| "DPDP Act 2023 Compliant" | Overclaim | "DPDP-Aligned Consent Management" |
| "Immutable Merkle Audit Log" | Overclaim | "SHA-256 Tamper-Evident Audit Trail with Append-Only Enforcement" |
| "Dept A: UIDAI / Civil Identity" | Misleading | "Dept A: Civil Identity Verification Adapter (Sandbox Simulation)" |
| "NIST PQC / RFC 6962 Merkle" in stats | Overclaim | Removed from active compliance list |
| "Production Government Integration" | Overclaim | "Government Integration-Ready Connector Framework" |
| "Microservices" | Inaccurate | "Modular Service-Oriented Architecture (Microservice-Ready)" |
