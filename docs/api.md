# MAHASETU — REST API Catalog

Base URL: `http://localhost:8000/api`

---

## 1. Authentication & Identity

### `POST /api/auth/login`
Authenticates a user and returns a JWT access token.
- **Request Body:**
  ```json
  {
    "username": "9999999999",
    "password": "mahasetu123"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "access_token": "eyJhbGciOi...",
    "token_type": "bearer",
    "user_id": "CIT-001",
    "name": "Demo Citizen",
    "role": "CITIZEN"
  }
  ```

### `GET /api/auth/personas`
Returns quick demo personas for 1-click hackathon switching.

---

## 2. Government Services

### `GET /api/services`
Lists available government services with SLA and participating department metadata.

---

## 3. Applications & Service Passport

### `POST /api/applications`
Initiates a new application, issues a Universal Application ID (`MH-APP-2026-XXXXXX`), initializes workflow steps, and creates an associated consent request.
- **Request Body:**
  ```json
  {
    "service_id": "employment-support",
    "citizen_name": "Demo Citizen",
    "mobile": "9999999999",
    "dob": "1998-05-12",
    "district": "Pune",
    "annual_income": 180000,
    "employment_status": "UNEMPLOYED"
  }
  ```

### `GET /api/applications/{id_or_number}`
Returns the full correlated application record including consent state, workflow progress, department transactions, and audit logs.

---

## 4. Consent Management (DPDP Aligned)

### `POST /api/consents/{id}/approve`
Citizen grants cryptographic authorization for cross-department data sharing.

### `POST /api/consents/{id}/revoke`
Citizen revokes previously authorized consent, blocking subsequent department data exchange.

---

## 5. Workflow Orchestration

### `GET /api/workflow/{application_id}`
Returns step-by-step pipeline status for an application.

### `POST /api/workflow/{application_id}/advance`
Advances the application to the next workflow step (executing connector logic, canonical transformation, and audit logging).

### `POST /api/workflow/{application_id}/run-all`
Runs all remaining steps in the pipeline automatically until completion or exception.

### `POST /api/workflow/{application_id}/retry`
Resolves an integration exception and retries the failed workflow step.

---

## 6. Department Integrations & Transformation Trace

### `POST /api/integrations/transform/trace`
Simulates and inspects live Canonical Data Model transformations between any two departments.
- **Request Body:**
  ```json
  {
    "source_department": "DEPT_A",
    "target_department": "DEPT_B",
    "payload": {
      "citizen_name": "Demo Citizen",
      "mobile_no": "9999999999",
      "district": "Pune"
    }
  }
  ```

---

## 7. Monitoring & AI Assistant

### `GET /api/dashboard/metrics`
Returns high-level KPI cards, department health states, and recent exception queue.

### `GET /api/dashboard/schema-assistant`
Returns AI-suggested semantic field mappings between heterogeneous department schemas for administrative review and approval.

### `POST /api/demo/toggle-failure`
Toggles simulated failure mode on Department B to demonstrate automated retries and exception state capture.

---

## 8. Phase 7: Sovereign Interoperability, W3C Verifiable Credentials & District Cockpit

### `GET /api/vc/wallet`
Returns citizen sovereign digital wallet containing W3C-compliant Verifiable Credentials (`did:mahasetu:citizen:...`) with Ed25519 cryptographic signatures.

### `POST /api/vc/generate-zkp`
Generates a Zero-Knowledge Proof (ZKP) token verifying age, income, or domicile predicates without transmitting raw PII.

### `POST /api/vc/verify-proof`
Public mathematical proof verification endpoint for departments and relying parties.

### `GET /api/district-cockpit/summary`
Statewide 36-district command cockpit aggregator returning federation index, SLA compliance leaderboards, and critical exception alerts.

### `GET /api/district-cockpit/district/{district_name}`
District Collectorate drilldown with local CSC kiosk telemetry and top disbursed schemes.

### `POST /api/district-cockpit/dispatch-action`
1-click administrative directive dispatch to rebalance staff or trigger offline edge syncs.

### `GET /api/nivarana/cases`
Lists citizen grievances processed by the AI Ombudsperson with correlated technical root-causes.

### `POST /api/nivarana/submit`
Submits a citizen grievance and executes deep transactional trace isolating departmental schema discrepancies.

### `POST /api/nivarana/remediate`
Executes 1-click administrative remediation (automated workflow retry, fast-track pass, or priority override).

### `GET /api/webhooks/subscriptions`
Returns active departmental event subscriptions, delivery success rates, and latency telemetry.

### `POST /api/webhooks/dispatch-test`
Dispatches a signed webhook packet with cryptographic `X-MahaSetu-Signature` (HMAC-SHA256).

### `GET /api/chaos/status`
Returns real-time chaos experiment state, circuit breaker modes, and resilience metrics.

### `POST /api/chaos/trigger`
Injects real-time chaos faults (latency spikes, schema drift, network partitions, or burst traffic).

### `POST /api/chaos/reset`
Restores the Interoperability Hub to 100% nominal green baseline.

---

## 9. Phase 8: Sovereign Multi-Party Confidential Mesh & National Inter-State Mobility

### `GET /api/mpc/sessions`
Returns active Confidential Multi-Party Computing (MPC) frameworks and Private Set Intersection (PSI) protocols between state departments.

### `POST /api/mpc/verify-blind-match`
Executes zero-knowledge Private Set Intersection blind record matching where two departments cross-verify citizen eligibility without sharing unblinded records.

### `GET /api/interstate/trust-anchors`
Returns network topology of federated Indian State e-Governance Hubs (Gujarat, Karnataka, Madhya Pradesh).

### `POST /api/interstate/port-credentials`
Transfers verified Maharashtra service passport to partner state gateways with mutual cryptographic signatures under the One Nation, One Service Passport framework.

### `GET /api/entitlements/recommendations`
Proactively discovers eligible welfare schemes matching a citizen's pre-verified canonical profile before they apply.

### `POST /api/entitlements/auto-draft`
Auto-drafts a unified multi-department application bundle prefilled from the Canonical Data Model for 1-click citizen consent.

### `GET /api/green/footprint`
Returns statewide environmental accounting metrics: physical paper sheets saved, mature trees preserved, citizen travel km avoided, and CO2 emissions mitigated.

### `GET /api/green/certificate/{district_name}`
Generates an official verifiable district Eco-Governance Green Certificate.

### `GET /api/pqc/assessment`
State-level Post-Quantum Cryptographic risk scorecard and quantum readiness index.

### `POST /api/pqc/simulate-hybrid-handshake`
Simulates a hybrid classical (Ed25519) + NIST Post-Quantum (ML-KEM-768 lattice) key encapsulation handshake.

---

## 10. Phase 9: Sovereign Disaster Surge, DPDP Data Erasure & AI Document Forensics

### `GET /api/disaster/active-events`
Returns active state natural disaster declarations and cross-departmental data fusion telemetry.

### `POST /api/disaster/trigger-emergency-relief`
Fuses satellite GIS, Revenue 7/12 land parcels, and PFMS bank accounts to disburse emergency relief directly without physical claim forms.

### `GET /api/dpdp-erasure/privacy-scorecard`
Inspects citizen privacy exposure score, cross-departmental data retention TTLs, and DPDP Right-to-be-Forgotten eligibility.

### `POST /api/dpdp-erasure/request-erasure`
Executes verifiable cryptographic data erasure across federated department nodes and issues an immutable Erasure Certificate.

### `GET /api/document-forensics/history`
Returns screening history of uploaded government certificates with fraud risk indices.

### `POST /api/document-forensics/analyze`
Multi-modal AI document verification analyzing font kerning anomalies, QR cryptographic digests, and raster seal tampering.

### `GET /api/mesh-autonomous/health`
Real-time autonomous AI governance status, cluster throughput, and adaptive rate-limiting parameters.

### `POST /api/mesh-autonomous/tune`
Triggers real-time autonomous mesh recalibration, dampening latency spikes and rebalancing inter-departmental API routing.

### `GET /api/developer-sdk/certified-partners`
Returns certified municipal corporations (BMC, PMC, CIDCO) and state departments on the MahaSetu SDK.

### `POST /api/developer-sdk/certify-connector`
Evaluates an onboarding organization's payload against the Canonical Model and issues an official Interoperability Gold Compliance Seal.

### `POST /api/developer-sdk/test-payload`
Interactive sandbox testbed verifying third-party payload compatibility with the Canonical Data Model.

---

## 11. Phase 10: Chief Minister's Executive War Room, Merkle Notary & Capstone Showcase

### `GET /api/war-room/macro-pulse`
Returns statewide macro-governance pulse for the Chief Minister & Chief Secretary (citizens served, funds disbursed, regional divisions).

### `POST /api/war-room/simulate-policy-shift`
Simulates macroeconomic impacts of expanding welfare eligibility and tightening delivery SLAs.

### `GET /api/merkle-ledger/blocks`
Returns recent Merkle Tree blocks, immutable cryptographic roots, and constitutional audit validator consensus nodes.

### `POST /api/merkle-ledger/verify-inclusion`
Verifies a mathematical Merkle Inclusion Proof (RFC 6962) confirming that an application exists in the notarized state block without exposing neighboring records.

### `GET /api/diaspora/attestation-requests`
Lists international consular attestations and Hague apostilles for Maharashtra's overseas diaspora.

### `POST /api/diaspora/attest-document`
Generates an official Hague Apostille Digital Certificate interfacing with the Ministry of External Affairs (MEA) e-Sanad registry.

### `GET /api/workforce/officer-load`
Returns desk-level application queues and backlog telemetry across taluka revenue offices.

### `POST /api/workforce/rebalance-workload`
Executes AI automated workload reallocation shifting pending applications from saturated desks to under-utilized neighboring officers.

### `GET /api/capstone-demo/summary`
Returns complete 10-phase enterprise platform overview and empirical metrics for Hackathon judges.

### `POST /api/capstone-demo/run-end-to-end`
Executes an 8-step live end-to-end simulation across all 10 phases, returning a complete step-by-step cryptographic audit trail.

---

## 12. Phase 11: MahaKavach & BharatStack 2030 (Smart Escrow, Bhoomi Geo-Cadastre & RTSA Tribunal)

### `GET /api/escrow/active-vouchers`
Lists active programmable e-RUPI digital vouchers, purpose condition locks, and merchant MCC whitelist categories.

### `POST /api/escrow/mint-voucher`
Mints a purpose-bound cryptographic e-RUPI voucher tied to citizen Aadhaar and designated merchant categories (fertilizer, textbooks, maternal health).

### `POST /api/escrow/redeem-voucher`
Simulates merchant terminal verification, checking MCC code compliance and burning voucher token on the RBI CBDC / NPCI wholesale rail.

### `GET /api/bhoomi-cadastre/parcels`
Returns active geo-referenced cadastral parcels with ISRO Bhuvan / MRSAC satellite environmental overlays.

### `POST /api/bhoomi-cadastre/verify-polygon`
Performs automated point-in-polygon checks against coastal regulation zones (CRZ-I, CRZ-II) and reserve forests.

### `GET /api/tribunal-nyaya/disputes`
Returns escalated citizen service delivery disputes awaiting quasi-judicial adjudication under the Maharashtra Right to Public Services Act (RTSA) 2015.

### `POST /api/tribunal-nyaya/arbitrate`
Executes a 3-agent autonomous consensus arbitration (Investigative Agent, Statutory Legal Agent, Department Ombudsman) producing an enforceable quasi-judicial decree with citizen compensation.

### `GET /api/accessibility/profiles`
Returns WCAG 2.1 AAA & GIGW 3.0 assistive profiles (Refreshable Braille, Marathi Phonetic Reader, High-Contrast Solar).

### `POST /api/accessibility/synthesize-narration`
Synthesizes phonetic Marathi speech SSML scripts and Grade-2 Bharati Braille Unicode dot matrix streams.

### `GET /api/vanadhikar-fra/claims`
Returns pending and settled Tribal Forest Rights Act (FRA 2006) claims across Gadchiroli, Nandurbar, and Melghat.

### `POST /api/vanadhikar-fra/reconcile-claim`
Reconciles Gram Sabha consensus resolution with joint Revenue-Forest GPS boundaries to issue an official Vanadhikar Title Deed.

---

## 13. Phase 12: MahaSuraksha & Sovereign Autonomous Sentinel (Treasury, Tender Shield & Crisis Logistics)

### `GET /api/treasury-beams/liquidity-pulse`
Returns real-time state exchequer balances, BeAMS allocation headroom, and departmental burn rates.

### `POST /api/treasury-beams/reconcile-sanction`
Verifies exchequer liquidity and BeAMS budget head headroom before committing multi-crore public welfare sanctions.

### `GET /api/tender-shield/active-tenders`
Returns active municipal public procurement tenders (BMC, PMC, CIDCO) and contractor bids.

### `POST /api/tender-shield/analyze-bids`
Executes graph neural network analysis inspecting IP address overlaps, shared beneficial ownership, and asymmetric cover bidding patterns.

### `GET /api/crisis-logistics/evacuation-nodes`
Returns live capacities of disaster shelters, ICU bed reserves, and NDRF relief stocks.

### `POST /api/crisis-logistics/dispatch-corridor`
Activates an autonomous DGCA-compliant emergency drone medical green corridor.

### `GET /api/key-rotation/ring-status`
Returns HSM key ring health, key ages, and quantum-resistant post-quantum transition readiness.

### `POST /api/key-rotation/rotate-now`
Executes an autonomous zero-downtime quantum key rotation, issuing new lattice pairs and re-anchoring district trust certificates.

### `GET /api/drone-pmfby/surveys`
Returns aerial drone multispectral surveys and NDVI crop loss telemetry across Marathwada & Vidarbha.

### `POST /api/drone-pmfby/settle-claim`
Computes compensation based on multispectral NDVI delta and executes instant PMFBY DBT credit.

---

## 14. Phase 13: MahaSwayam & Sovereign AI Civil Registry (Life-Event Mesh, Health Surveillance & Dialectal Voice Agent)

### `GET /api/life-events/proactive-triggers`
Returns civil event triggers automatically ingested from civil registry and UIDAI data streams.

### `POST /api/life-events/dispatch-entitlement`
Executes a zero-touch welfare approval without requiring citizen application submission.

### `GET /api/epidemic-health/ward-clusters`
Returns real-time syndromic disease telemetry, case counts, and monsoon vectors across municipal wards.

### `POST /api/epidemic-health/forecast-outbreak`
Evaluates epidemiological risk models and issues automated municipal fumigation notices.

### `GET /api/zk-taxation/reckoner-rates`
Returns official government ready-reckoner benchmark property valuation rates.

### `POST /api/zk-taxation/assess-duty`
Calculates exact statutory stamp duty and generates a zero-knowledge valuation proof.

### `GET /api/kiosk-solar/kiosk-telemetry`
Returns live solar microgrid telemetry, battery state of charge, and edge transaction counts for remote tribal kiosks.

### `POST /api/kiosk-solar/optimize-power`
Activates low-power edge conservation mode to safeguard transaction queues during solar deficits.

### `GET /api/voice-hotline/dialects`
Returns supported regional Marathi dialect acoustic models (Varhadi, Ahirani, Konkani, Deshi).

### `POST /api/voice-hotline/converse`
Processes acoustic citizen speech in regional dialect and generates voice synthesized response.

---

## 15. Phase 14: MahaSamriddhi & Sovereign Autonomous Frontier (PDS Supply Chain, Jal Jeevan, EV Grid, Police CCTNS & MeriPehchaan SSO)

### `GET /api/pds-ration/fps-nodes`
Returns real-time food grain inventories and biometric e-PoS transactions across Maharashtra FPS shops.

### `POST /api/pds-ration/dispatch-replenishment`
Dispatches a GPS-geofenced grain transport truck from the nearest MSWC godown to replenish depleted FPS buffer stock.

### `GET /api/jal-jeevan/aquifer-sensors`
Returns live IoT groundwater levels (mbgl) and Jal Jeevan tap water flow (LPCD) across Marathwada & Vidarbha.

### `POST /api/jal-jeevan/dispatch-tanker`
Authorizes an emergency GPS-tracked water tanker dispatch to critically depleted villages.

### `GET /api/ev-grid/charging-hubs`
Returns live power load, solar generation, and carbon abatement across Maharashtra EV bus terminals (MSRTC, BEST, PMPML).

### `POST /api/ev-grid/balance-charge`
Applies peak-shaving algorithms shifting heavy EV bus charging into solar/off-peak windows.

### `GET /api/police-cctns/recent-records`
Returns recent digitally issued police non-cognizable reports and tenant verification certificates.

### `POST /api/police-cctns/file-lost-property`
Instantly issues an official digitally signed Non-Cognizable (NC) Lost Property Certificate with CCTNS reference URN and QR signature hash.

### `GET /api/meripehchaan-sso/federation-status`
Returns National Single-Sign-On (MeriPehchaan / Jan Parichay) protocol federation status and trust anchors.

### `POST /api/meripehchaan-sso/exchange-token`
Validates MeriPehchaan OIDC assertion and issues a zero-friction Maharashtra State Service Passport session.

---

## 16. Phase 15: MahaNetra & Sovereign Quantum Intelligence Horizon (Industrial Emissions, Marriage Registry, Solar Feeders, Policy Copilot & Ultimate Capstone)

### `GET /api/industrial-emissions/industrial-stacks`
Returns live Continuous Emission Monitoring System (CEMS) stack data across Maharashtra MIDC belts.

### `POST /api/industrial-emissions/issue-penalty`
Issues an official statutory MPCB Stop-Work order and environmental damage fine.

### `GET /api/marriage-registry/recent-marriages`
Returns recent paperless municipal marriage registrations and auto-provisioned joint welfare entitlements.

### `POST /api/marriage-registry/register-marriage`
Registers a civil marriage paperlessly and provisions joint ration cards and PMAY housing rights.

### `GET /api/solar-feeder/feeders`
Returns live solar generation, connected farmer pump counts, and daytime power hours under MSKVY 2.0.

### `POST /api/solar-feeder/optimize-feeder`
Dynamically balances transformer load to deliver stable daytime power to agricultural pumps.

### `GET /api/policy-copilot/sample-queries`
Returns curated executive macro policy questions in English and Marathi.

### `POST /api/policy-copilot/ask`
Translates natural language questions into validated read-only SQL queries and cross-departmental correlation reports.

### `GET /api/master-showcase/state-overview`
Returns state-wide enterprise platform capability ledger and empirical metrics across all 15 phases.

### `POST /api/master-showcase/run-full-spectrum`
Executes a 12-step live end-to-end simulation across all 15 platform phases, issuing the official State of Maharashtra Sovereign Enterprise Interoperability Seal.









