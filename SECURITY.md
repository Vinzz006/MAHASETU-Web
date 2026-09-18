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
| **Safety Guardrail** | **Forbidden** if `ENVIRONMENT=production` or `HOST=0.0.0.0` (FastAPI lifespan crashes on startup). | Enforced standard. |
| **Authentication & Tokens** | Disables real Firebase Admin SDK token verification; accepts mock strings only during pytest (`TESTING=true`). | Real Firebase Admin SDK cryptographic verification strictly required. |
| **Personas Endpoint** | `GET /api/auth/personas` strictly requires `SYSTEM_ADMIN` role. | Returns `404 Not Found`. Endpoint completely disabled. |
| **Auth Context UI** | Quick demo persona switcher available only for authenticated `SYSTEM_ADMIN`. | Persona switcher completely hidden; real login required. |
| **Storage Fallback** | Stores uploaded passport documents in local `storage_private/` directory. | Direct streaming to private Firebase Storage bucket with short-lived signed URLs. |
| **AI Assistant** | Falls back to rule-grounded response if `GEMINI_API_KEY` is omitted. | Fails fast if `GEMINI_API_KEY` is missing; connects to `gemini-2.5-flash` via TLS. |
| **Audit Integrity** | Append-only database listener active. | Append-only database listener active + DB-level `REVOKE UPDATE, DELETE`. |

> [!CAUTION]
> Running with `DEMO_MODE=true` in a publicly accessible or staging environment bypasses real external credential checks and is strictly prohibited.

---

## 4. Production Deployment Checklist

Before deploying MAHASETU to production, verify every item:

- [ ] **Environment**: `ENVIRONMENT=production` and `DEMO_MODE=false`.
- [ ] **Host Binding**: Bind to reverse-proxy loopback or internal interface. Never run `DEMO_MODE=true` on `0.0.0.0`.
- [ ] **JWT Key**: `JWT_SECRET` generated with 32+ bytes cryptographic entropy. Application fails to start if missing.
- [ ] **Google Gemini API Key**: `GEMINI_API_KEY` configured from Google AI Studio (`https://aistudio.google.com/apikey`) or Vertex AI service account. Model set to `gemini-2.5-flash`.
- [ ] **Database**: Production PostgreSQL database configured via `DATABASE_URL` (SQLite file `mahasetu.db` is strictly for testing).
- [ ] **Postgres DB Privilege Revocation**:
  ```sql
  -- Ensure application role cannot bypass append-only audit enforcement:
  REVOKE UPDATE, DELETE ON audit_logs FROM mahasetu_app_role;
  ```
- [ ] **Firebase Credentials**: `FIREBASE_SERVICE_ACCOUNT_PATH` points to a secure, permission-restricted Google Service Account JSON file.
- [ ] **CORS Configuration**: `CORS_ALLOWED_ORIGINS` explicitly set to production domains (e.g. `https://mahasetu.maharashtra.gov.in`), never wildcard `*`.
- [ ] **Security Headers**: Verify HTTP response headers include:
  - `Content-Security-Policy`: Restricts scripts, frames, and connect origins.
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `X-XSS-Protection: 1; mode=block`
  - `Referrer-Policy: strict-origin-when-cross-origin`
- [ ] **Innovation Lab Gating**: `ENABLE_INNOVATION_LAB=false` to eliminate attack surface from experimental micro-routers.
- [ ] **Rate Limiting**: Sliding-window rate limiters active on:
  - `/api/auth/register` (10 req/min/IP)
  - `/api/auth/login` (10 req/min/IP)
  - `/api/passport/verify/{id_or_hash}` (30 req/min/IP)
  - `/api/assistant/chat` (15 req/min/user)
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
