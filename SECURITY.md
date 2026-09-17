# Security Policy & Operational Hardening Guide — MAHASETU

## 1. Overview
MAHASETU is a high-trust citizen-services interoperability platform handling sensitive national and state identity data (Aadhaar, PAN, banking, and citizen service records). This document outlines mandatory operational standards, key rotation procedures, compliance mandates, and production deployment checklists required to maintain government-grade data isolation and cryptographic integrity.

---

## 2. Cryptographic Secret Management & Key Rotation

### 2.1 JWT Secret Key (`JWT_SECRET`)
MAHASETU strictly rejects default or missing JWT signing keys on backend startup (`RuntimeError: CRITICAL SECURITY: JWT_SECRET environment variable is not set`).
- **Secret Generation**: Every deployment environment MUST generate a cryptographically strong, non-predictable 256-bit (32-byte) hex string:
  ```bash
  # Linux/macOS
  openssl rand -hex 32

  # Windows PowerShell / Cross-platform Python
  python -c "import secrets; print(secrets.token_hex(32))"
  ```
- **Storage**: Store secrets strictly in hardware security modules (HSM), cloud secret managers (AWS Secrets Manager, GCP Secret Manager, Azure Key Vault), or environment variables injected at deployment. **Never commit `.env` or secrets to version control.**

### 2.2 Key Rotation Procedures
1. **Planned Rotation**:
   - Configure key versioning in tokens (`kid` in JWT header) or maintain an active key and fallback verification key array during a grace period (24 hours).
   - Invalidate active sessions or prompt re-authentication across administrative portals.
2. **Emergency Revocation (Compromise Scenario)**:
   - Immediately update `JWT_SECRET` in secret manager / environment configuration.
   - Restart all FastAPI backend instances to revoke all existing JWTs.
   - Force all administrators and citizens to re-authenticate.
   - Audit `AuditLog` records for unauthorized access patterns.

---

## 3. Operational Behavior: `DEMO_MODE` vs Production

| Dimension | `DEMO_MODE=true` (Local Hackathon/Dev) | `DEMO_MODE=false` (Production / Staging) |
|---|---|---|
| **Intended Target** | Local development and isolated UI prototyping only. | Any publicly accessible server, staging, or production. |
| **Safety Guardrail** | **Forbidden** if `ENVIRONMENT=production` (FastAPI lifespan crashes on startup). | Enforced standard. |
| **Personas Endpoint** | `GET /api/auth/personas` returns seeded roles/credentials. | Returns `404 Not Found`. Role enumeration completely disabled. |
| **Auth Context UI** | Demo persona switcher toggle can be enabled for local testing. | Demo persona switcher and automatic demo login disabled. |
| **Firebase Auth** | Mock tokens permitted only if `TESTING=true` (`is_testing_mode()`). | Real Firebase Admin SDK cryptographic verification strictly required. |
| **Audit Integrity** | Append-only database listener active. | Append-only database listener active + Merkle tree cryptographic chain. |

> [!CAUTION]
> Running with `DEMO_MODE=true` in a publicly accessible or staging environment exposes seeded persona credentials and is strictly prohibited.

---

## 4. Production Deployment Checklist

Before deploying MAHASETU to production, verify every item:

- [ ] **Environment**: `ENVIRONMENT=production` and `DEMO_MODE=false`.
- [ ] **JWT Key**: `JWT_SECRET` generated with 32+ bytes cryptographic entropy.
- [ ] **Database**: Production PostgreSQL database configured via `DATABASE_URL` (SQLite file `mahasetu.db` is strictly for testing).
- [ ] **Firebase Credentials**: `FIREBASE_CREDENTIALS_PATH` points to a secure, permission-restricted Google Service Account JSON file.
- [ ] **CORS Configuration**: `CORS_ALLOWED_ORIGINS` explicitly set to production domains (e.g. `https://mahasetu.maharashtra.gov.in`), never wildcard `*`.
- [ ] **Security Headers**: Verify HTTP response headers include:
  - `Content-Security-Policy`: Restricts scripts, frames, and connect origins.
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `X-XSS-Protection: 1; mode=block`
  - `Referrer-Policy: strict-origin-when-cross-origin`
- [ ] **Innovation Lab Gating**: `ENABLE_INNOVATION_LAB=false` to eliminate attack surface from experimental micro-routers.
- [ ] **Rate Limiting**: Sliding-window rate limiters active on `/api/auth/register`, `/api/auth/login`, and `/api/passport/verify/{id_or_hash}`.
- [ ] **Storage Security**: Resident document storage directory (`storage_private/`) must have restrictive file permissions (e.g., `chmod 700`) and private mount points outside the web root.

---

## 5. Data Handling Standards & Privacy Compliance

### 5.1 DPDP Act & Data Minimization
- **Purpose Limitation**: Personal citizen data is strictly accessed based on granted `Consent` with `AUTHORIZED` status for the specific department assigned to the application.
- **Role-Based & Object-Level Access Control (ABAC/RBAC)**:
  - Citizens can only view and download their own applications and passport documents.
  - Department officers (`DEPARTMENT_A`, `DEPARTMENT_B`, `DEPARTMENT_C`, `OFFICER`) can only view applications assigned to their department that have an active `AUTHORIZED` consent.
  - Path traversal attempts (`../../`) are blocked and return `403 Forbidden`.
- **PII Masking**:
  - Aadhaar and PAN numbers are redacted (`XXXX-XXXX-1234`).
  - Public passport verification (`/api/passport/verify/{id_or_hash}`) masks citizen beneficiary names (e.g. `Sunita Patil` -> `S****a P***l`).

### 5.2 Cryptographic Immutability & Audit Trail
- **Append-Only Logs**: The `audit_logs` table has SQLAlchemy ORM event listeners that raise a `RuntimeError` on any attempt to update (`UPDATE`) or delete (`DELETE`) records.
- **Merkle Tree Proofs**: Each audit entry is linked cryptographically in a SHA-256 Merkle chain, allowing independent verification of tamper resistance.
- **Security Event Logging**: Access denials (`APPLICATION_ACCESS_DENIED_OWNERSHIP`, `APPLICATION_ACCESS_DENIED_DEPARTMENT_UNAUTHORIZED`) are automatically written to the audit trail.

---

## 6. Vulnerability Reporting
For vulnerability disclosure or security inquiries, contact the MAHASETU Security Team at `security@mahasetu.gov.in`. All reports will receive acknowledgment within 24 hours.
