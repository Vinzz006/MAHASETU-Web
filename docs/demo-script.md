# MAHASETU — 3-Minute Hackathon Demo Script

**Project**: MAHASETU (Government Interoperability & Service Passport Platform)  
**Problem Statement**: 26129 (Government of Maharashtra)  
**Judges Walkthrough Time**: 3 Minutes

---

## Pitch Opening (30 Seconds)

> *"Judges, today a citizen in Maharashtra applying for employment assistance has to submit documents to Department A, re-enter details in Department B, and visit Department C in person to track approvals. The root problem is not a lack of digital portals—it is that department platforms cannot communicate.*
> 
> *Instead of proposing an impossible statewide rewrite of all existing government systems, we built **MAHASETU**: a federated interoperability middleware layer. Our proposition: **One Citizen. One Consent. One Application ID. Multiple Departments.**"*

---

## Live Demonstration Steps (2.5 Minutes)

### Step 1: Citizen Access & Master-Data Reuse
1. Open the **Landing Page** at `http://localhost:5173`.
2. Point to the top official header and the benchmark impact cards (*1 entry vs 3 entries*).
3. Click **"Explore Government Services"** and select **"Apply with Service Passport"** on the *Maharashtra Employment & Skill Assistance Scheme*.
4. Point out the **Automated Master-Data Prefill**: baseline demographic attributes from the citizen registry are pre-filled without physical uploads.
5. Click **"Continue to Consent Authorization"**.

### Step 2: DPDP-Aligned Citizen Consent
1. Point to the **"YOUR CONSENT IS REQUIRED"** screen.
2. Explain: *"In compliance with data protection principles, protected citizen data is never shared between departments without explicit citizen authorization."*
3. Click **"Grant Consent & Authorize"**.
4. Show the resulting **Consent ID** (`CON-2026-XXXXXX`) and the SHA-256 cryptographic audit signature.
5. Click **"Track Unified Service Journey"**.

### Step 3: End-to-End Cross-Department Workflow
1. Point to the **Universal Application ID** (e.g. `MH-APP-2026-000185`).
2. Click **"Advance Next Step"**:
   - **Step 1: Department A (Identity REST API)** executes, returns biometric match and registry ID.
   - **Step 2: Canonical Model Transformation** automatically translates Department A's format (`citizen_name`) into Department B's format (`fullName`).
   - **Step 3: Department B (Eligibility JSON)** evaluates socio-economic thresholds.
   - **Step 4: Department C (Employment Sanction Engine)** generates the final official sanction order!
3. Click on the **"Department Payloads & Transactions"** tab to prove real inter-system request/response payloads.

### Step 4: The Core Interoperability Feature — Canonical Inspector
1. Click **"Inspect Canonical Transform"** (or the blue button on the floating controller).
2. Show the **3-column live inspector**:
   - Left: Source Department A raw payload
   - Middle: Standardized MahaSetu Canonical Model
   - Right: Target Department B native schema
3. Switch the dropdown to **Legacy Registry (Pipe ASCII)**: show `CIT001|Demo Citizen|Pune|MH` parsed into modern JSON.
4. Conclude: *"Existing legacy systems remain in place. MahaSetu connects them."*

### Step 5: Failure Simulation & Exception Recovery (Resilience Demo)
1. In the bottom floating demo controller, click **"Simulate Dept B Failure"** (button turns red).
2. Create or navigate to an in-progress application and advance to **Department B (Eligibility)**.
3. Observe:
   - Automated exponential retries (*Attempt 1, Attempt 2*).
   - Application transitions gracefully to **EXCEPTION** state without dropping data.
4. Click **"Officer Command"** in the top navbar:
   - Point to the **Integration Exception Queue** in the Officer Dashboard.
5. Toggle **"Simulate Dept B Failure"** off to restore connectivity.
6. Click **"Resolve & Retry"** in the dashboard.
7. Observe the transaction resolve to `SUCCESS` and advance to Department C!

### Step 6: AI Schema Mapping Assistant (Human-in-the-Loop)
1. Navigate to **"AI Schema Mapper"** (`/admin/schema-mapper`).
2. Show the semantic confidence recommendations (*96% match for citizen_name ➔ fullName*).
3. Emphasize: *"The AI assists human administrators in configuring mappings, but never autonomously decides citizen benefits."*
4. Click **"Authorize Approved Mappings"**.

---

## Pitch Closing (15 Seconds)

> *"MahaSetu delivers a unified citizen experience today without the cost, delay, or risk of replacing Maharashtra's existing government infrastructure. Thank you!"*
