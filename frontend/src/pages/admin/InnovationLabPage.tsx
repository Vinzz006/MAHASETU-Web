import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Beaker, Zap, Shield, Globe, Cpu, Leaf, Droplets, Radio,
  Activity, BarChart3, FileSearch, Users, MapPin, Truck,
  Landmark, Scale, Eye, Wifi, ChevronRight,
  CheckCircle2, Play, AlertTriangle,
  Fingerprint, Brain, Building2, HeartPulse, Sun, Utensils,
  Car, Lock, PieChart, Mic, FlaskConical, Satellite,
} from "lucide-react";

const PHASE_COLORS: Record<number, string> = {
  4: "bg-slate-100 text-slate-700", 5: "bg-red-100 text-red-700",
  6: "bg-violet-100 text-violet-700", 7: "bg-blue-100 text-blue-700",
  8: "bg-cyan-100 text-cyan-700", 9: "bg-orange-100 text-orange-700",
  10: "bg-amber-100 text-amber-800", 11: "bg-lime-100 text-lime-700",
  12: "bg-teal-100 text-teal-700", 13: "bg-green-100 text-green-700",
  14: "bg-indigo-100 text-indigo-700", 15: "bg-pink-100 text-pink-700",
};

interface LabModule {
  id: string; title: string; subtitle: string; route: string;
  icon: React.FC<any>; color: string; bgColor: string; borderColor: string;
  tags: string[]; phase: number;
}

const MODULES: Record<string, LabModule[]> = {
  "Governance & Executive": [
    { id: "war-room", title: "CM Executive War Room", subtitle: "MahaDrishti — Chief Minister macro-pulse & policy simulation", route: "/admin/war-room", icon: BarChart3, color: "text-amber-700", bgColor: "bg-amber-50", borderColor: "border-amber-200", tags: ["Phase 10", "Executive", "Analytics"], phase: 10 },
    { id: "policy-sim", title: "Policy Fiscal Simulator", subtitle: "Budget & eligibility scenario modelling with economic impact projections", route: "/admin/policy-simulator", icon: PieChart, color: "text-violet-700", bgColor: "bg-violet-50", borderColor: "border-violet-200", tags: ["Phase 5", "Analytics", "AI"], phase: 5 },
    { id: "policy-copilot", title: "Policy SQL Copilot", subtitle: "Natural-language analytics queries across all government data stores", route: "/admin/policy-copilot", icon: Brain, color: "text-indigo-700", bgColor: "bg-indigo-50", borderColor: "border-indigo-200", tags: ["Phase 15", "AI", "Analytics"], phase: 15 },
    { id: "mahadarpan", title: "MahaDarpan Cockpit", subtitle: "36-district GIS collectorate telemetry and performance dashboard", route: "/admin/mahadrpan", icon: MapPin, color: "text-rose-700", bgColor: "bg-rose-50", borderColor: "border-rose-200", tags: ["Phase 7", "GIS", "Districts"], phase: 7 },
    { id: "workforce", title: "AI Workforce Rebalancer", subtitle: "MahaKarma — desk-level queue balancing across taluka revenue offices", route: "/admin/workforce-rebalance", icon: Users, color: "text-teal-700", bgColor: "bg-teal-50", borderColor: "border-teal-200", tags: ["Phase 10", "AI", "Officers"], phase: 10 },
    { id: "master", title: "Master Showcase Hub", subtitle: "Complete end-to-end 15-phase platform simulation for judges", route: "/admin/capstone-showcase", icon: Cpu, color: "text-amber-700", bgColor: "bg-amber-50", borderColor: "border-amber-300", tags: ["Phase 10", "Demo", "Judges"], phase: 10 },
  ],
  "Security & Cryptography": [
    { id: "merkle", title: "Merkle Audit Ledger", subtitle: "MahaLekha — RFC 6962 Merkle tree notarization with inclusion proofs", route: "/admin/merkle-ledger", icon: Shield, color: "text-emerald-700", bgColor: "bg-emerald-50", borderColor: "border-emerald-200", tags: ["Phase 10", "Cryptography", "Audit"], phase: 10 },
    { id: "pqc", title: "Post-Quantum Sandbox", subtitle: "NIST CRYSTALS-Kyber / Dilithium PQC algorithm simulation", route: "/admin/pqc", icon: Lock, color: "text-slate-700", bgColor: "bg-slate-50", borderColor: "border-slate-200", tags: ["Phase 8", "Cryptography", "Security"], phase: 8 },
    { id: "mpc", title: "Confidential MPC Vault", subtitle: "MahaVault — Private Set Intersection with zero data leakage", route: "/admin/mpc", icon: Fingerprint, color: "text-purple-700", bgColor: "bg-purple-50", borderColor: "border-purple-200", tags: ["Phase 8", "Cryptography", "Privacy"], phase: 8 },
    { id: "fraud", title: "AI Fraud Detector", subtitle: "Ghost beneficiary detection, duplicate identity & fiscal anomaly scoring", route: "/admin/fraud-detector", icon: AlertTriangle, color: "text-red-700", bgColor: "bg-red-50", borderColor: "border-red-200", tags: ["Phase 5", "AI", "Security"], phase: 5 },
    { id: "security", title: "Zero-Trust Audit", subtitle: "OWASP A+ security posture — JWT, CORS, injection, header hardening", route: "/admin/security-audit", icon: Eye, color: "text-slate-700", bgColor: "bg-slate-50", borderColor: "border-slate-200", tags: ["Phase 5", "Security", "Audit"], phase: 5 },
    { id: "forensics", title: "Document Forensics AI", subtitle: "MahaSatya — deep fake and tampering detection on uploaded documents", route: "/admin/document-forensics", icon: FileSearch, color: "text-orange-700", bgColor: "bg-orange-50", borderColor: "border-orange-200", tags: ["Phase 9", "AI", "Forensics"], phase: 9 },
    { id: "key-rotation", title: "Quantum Key Rotation", subtitle: "HSM-backed cryptographic key lifecycle management and rotation", route: "/admin/key-rotation", icon: FlaskConical, color: "text-cyan-700", bgColor: "bg-cyan-50", borderColor: "border-cyan-200", tags: ["Phase 12", "Cryptography"], phase: 12 },
  ],
  "National DPI & Finance": [
    { id: "dpi", title: "National DPI Gateway", subtitle: "PFMS e-Kuber, DigiLocker, APBS and ABHA health ID hub", route: "/admin/dpi-gateway", icon: Globe, color: "text-blue-700", bgColor: "bg-blue-50", borderColor: "border-blue-200", tags: ["Phase 6", "DPI", "Integration"], phase: 6 },
    { id: "interstate", title: "Interstate Portability", subtitle: "ONOSP — migrant welfare entitlements across state boundaries", route: "/lab/interstate", icon: Building2, color: "text-teal-700", bgColor: "bg-teal-50", borderColor: "border-teal-200", tags: ["Phase 8", "DPI", "Migrant"], phase: 8 },
    { id: "meripehchaan", title: "MeriPehchaan SSO", subtitle: "National SSO identity federation across all government portals", route: "/citizen/meripehchaan", icon: Fingerprint, color: "text-indigo-700", bgColor: "bg-indigo-50", borderColor: "border-indigo-200", tags: ["Phase 14", "DPI", "SSO"], phase: 14 },
    { id: "disbursal", title: "DBT Disbursal Ledger", subtitle: "Direct Benefit Transfer tracking via RBI APBS clearing and CBDC", route: "/admin/disbursal-ledger", icon: Landmark, color: "text-emerald-700", bgColor: "bg-emerald-50", borderColor: "border-emerald-200", tags: ["Phase 6", "Finance", "DPI"], phase: 6 },
    { id: "escrow", title: "Smart Escrow e-RUPI", subtitle: "Programmable CBDC vouchers minted and redeemed via RBI e-RUPI rails", route: "/admin/smart-escrow", icon: Zap, color: "text-yellow-700", bgColor: "bg-yellow-50", borderColor: "border-yellow-200", tags: ["Phase 11", "Finance", "CBDC"], phase: 11 },
    { id: "treasury", title: "Treasury BeAMS", subtitle: "Budget Estimation Allocation & Management with fiscal reconciliation", route: "/admin/treasury-beams", icon: PieChart, color: "text-amber-700", bgColor: "bg-amber-50", borderColor: "border-amber-200", tags: ["Phase 12", "Finance", "Treasury"], phase: 12 },
  ],
  "Citizen & Welfare": [
    { id: "proactive", title: "Proactive Entitlements", subtitle: "Life-event triggered automatic eligibility detection and pre-application", route: "/citizen/entitlements", icon: Activity, color: "text-green-700", bgColor: "bg-green-50", borderColor: "border-green-200", tags: ["Phase 13", "Welfare", "AI"], phase: 13 },
    { id: "pds", title: "PDS Ration Optimizer", subtitle: "Public Distribution System AI allocation and FPS replenishment", route: "/admin/pds-ration", icon: Utensils, color: "text-orange-700", bgColor: "bg-orange-50", borderColor: "border-orange-200", tags: ["Phase 14", "Welfare", "Food"], phase: 14 },
    { id: "marriage", title: "Marriage Registry", subtitle: "Integrated marriage registration with auto joint entitlement provisioning", route: "/citizen/marriage-registry", icon: Users, color: "text-pink-700", bgColor: "bg-pink-50", borderColor: "border-pink-200", tags: ["Phase 15", "Welfare", "Registry"], phase: 15 },
    { id: "diaspora", title: "Diaspora Apostille", subtitle: "MahaPravasi — Hague 1961 MEA e-Sanad NRI document attestation", route: "/citizen/diaspora", icon: Globe, color: "text-blue-700", bgColor: "bg-blue-50", borderColor: "border-blue-200", tags: ["Phase 10", "Diaspora", "NRI"], phase: 10 },
    { id: "accessibility", title: "Accessibility Assist", subtitle: "Bharati Braille, Marathi SSML phonetics for differently-abled citizens", route: "/citizen/accessibility", icon: Radio, color: "text-teal-700", bgColor: "bg-teal-50", borderColor: "border-teal-200", tags: ["Phase 11", "Accessibility"], phase: 11 },
    { id: "life-events", title: "Life Events Mesh", subtitle: "Birth, death, education and retirement cascading government services", route: "/admin/life-events", icon: Activity, color: "text-violet-700", bgColor: "bg-violet-50", borderColor: "border-violet-200", tags: ["Phase 13", "Welfare", "Events"], phase: 13 },
  ],
  "Land, Justice & Rights": [
    { id: "bhoomi", title: "Bhoomi Geo Cadastre", subtitle: "Satellite-validated Gat polygon clearance including coastal CRZ checks", route: "/admin/bhoomi-cadastre", icon: MapPin, color: "text-amber-700", bgColor: "bg-amber-50", borderColor: "border-amber-200", tags: ["Phase 11", "Land", "GIS"], phase: 11 },
    { id: "nyaya", title: "Tribunal Nyaya AI", subtitle: "Multi-agent quasi-judicial arbitration for revenue and land disputes", route: "/admin/tribunal-nyaya", icon: Scale, color: "text-slate-700", bgColor: "bg-slate-50", borderColor: "border-slate-200", tags: ["Phase 11", "Justice", "AI"], phase: 11 },
    { id: "fra", title: "Vanadhikar FRA Claims", subtitle: "Forest Rights Act tribal claim reconciliation and Patta title deed issuance", route: "/admin/tribal-fra", icon: Satellite, color: "text-green-700", bgColor: "bg-green-50", borderColor: "border-green-200", tags: ["Phase 11", "Tribal", "Rights"], phase: 11 },
    { id: "zk-tax", title: "ZK Property Tax", subtitle: "Zero-Knowledge stamp duty proof — verify income band without revealing salary", route: "/citizen/zk-property-tax", icon: FlaskConical, color: "text-purple-700", bgColor: "bg-purple-50", borderColor: "border-purple-200", tags: ["Phase 13", "ZKP", "Finance"], phase: 13 },
    { id: "tender", title: "Tender Collusion Shield", subtitle: "Municipal tender price clustering and cartel detection AI", route: "/admin/tender-shield", icon: AlertTriangle, color: "text-red-700", bgColor: "bg-red-50", borderColor: "border-red-200", tags: ["Phase 12", "Anti-Corruption"], phase: 12 },
    { id: "police", title: "Police CCTNS Station", subtitle: "Digital police station — FIR, NC report generation and case tracking", route: "/citizen/police-cctns", icon: Shield, color: "text-slate-700", bgColor: "bg-slate-50", borderColor: "border-slate-200", tags: ["Phase 14", "Law", "CCTNS"], phase: 14 },
  ],
  "Infrastructure & Climate": [
    { id: "disaster", title: "Disaster Surge Relief", subtitle: "MahaAapada — satellite flood fusion, evacuation and emergency benefits", route: "/admin/disaster-surge", icon: AlertTriangle, color: "text-red-700", bgColor: "bg-red-50", borderColor: "border-red-200", tags: ["Phase 9", "Disaster", "Satellite"], phase: 9 },
    { id: "crisis", title: "Crisis Logistics", subtitle: "Drone + truck + shelter optimization during civil emergencies", route: "/admin/crisis-logistics", icon: Truck, color: "text-orange-700", bgColor: "bg-orange-50", borderColor: "border-orange-200", tags: ["Phase 12", "Crisis", "Logistics"], phase: 12 },
    { id: "jal", title: "Jal Jeevan Telemetry", subtitle: "Aquifer sensors, daily water quality reporting and tanker dispatch", route: "/admin/jal-jeevan", icon: Droplets, color: "text-blue-700", bgColor: "bg-blue-50", borderColor: "border-blue-200", tags: ["Phase 14", "Water", "IoT"], phase: 14 },
    { id: "ev", title: "EV Grid Balancer", subtitle: "EV charging demand forecasting and peak-shaving with DISCOM integration", route: "/admin/ev-grid", icon: Car, color: "text-cyan-700", bgColor: "bg-cyan-50", borderColor: "border-cyan-200", tags: ["Phase 14", "Energy", "EV"], phase: 14 },
    { id: "emissions", title: "Industrial Emissions", subtitle: "Continuous Emission Monitoring — MPCB pollutant reporting and penalties", route: "/admin/industrial-emissions", icon: Leaf, color: "text-green-700", bgColor: "bg-green-50", borderColor: "border-green-200", tags: ["Phase 15", "Environment"], phase: 15 },
    { id: "solar-feeder", title: "Solar Feeder Grid", subtitle: "MSEDCL solar load balancing and net-metering settlement optimization", route: "/admin/solar-feeder", icon: Sun, color: "text-yellow-700", bgColor: "bg-yellow-50", borderColor: "border-yellow-200", tags: ["Phase 15", "Energy", "Solar"], phase: 15 },
    { id: "drone", title: "Drone PMFBY Survey", subtitle: "AI drone crop damage assessment and insurance settlement automation", route: "/citizen/drone-pmfby", icon: Satellite, color: "text-teal-700", bgColor: "bg-teal-50", borderColor: "border-teal-200", tags: ["Phase 12", "Agriculture"], phase: 12 },
    { id: "green", title: "Green GovTech", subtitle: "Carbon offset, paperless savings, kWh reduction and ESG dashboard", route: "/admin/green-gov", icon: Leaf, color: "text-emerald-700", bgColor: "bg-emerald-50", borderColor: "border-emerald-200", tags: ["Phase 6", "ESG"], phase: 6 },
    { id: "epidemic", title: "Epidemic Surveillance", subtitle: "Disease cluster detection, R0 forecasting and mobile health camp dispatch", route: "/admin/epidemic-surveillance", icon: HeartPulse, color: "text-rose-700", bgColor: "bg-rose-50", borderColor: "border-rose-200", tags: ["Phase 13", "Health", "AI"], phase: 13 },
  ],
  "Voice, AI & Connectivity": [
    { id: "vaani", title: "MahaSetu Vaani", subtitle: "Multilingual Marathi voice AI — speech-to-service for rural inclusion", route: "/citizen/vaani", icon: Mic, color: "text-violet-700", bgColor: "bg-violet-50", borderColor: "border-violet-200", tags: ["Phase 6", "Voice", "AI"], phase: 6 },
    { id: "voice-hotline", title: "Dialectal Voice Hotline", subtitle: "IVRS toll-free agent handling Marathi, Varhadi and Konkani dialects", route: "/citizen/voice-hotline", icon: Radio, color: "text-blue-700", bgColor: "bg-blue-50", borderColor: "border-blue-200", tags: ["Phase 13", "Voice", "IVRS"], phase: 13 },
    { id: "kiosk", title: "Kiosk Solar Telemetry", subtitle: "Gramin CSC battery + solar health with predictive outage alerting", route: "/admin/kiosk-solar", icon: Sun, color: "text-amber-700", bgColor: "bg-amber-50", borderColor: "border-amber-200", tags: ["Phase 13", "Edge", "Solar"], phase: 13 },
    { id: "edge", title: "Gramin Edge Sync", subtitle: "Offline CSC store-and-forward with sync heartbeat across 52,000 kiosks", route: "/admin/edge-sync", icon: Wifi, color: "text-indigo-700", bgColor: "bg-indigo-50", borderColor: "border-indigo-200", tags: ["Phase 4", "Edge", "IoT"], phase: 4 },
    { id: "mesh", title: "Autonomous Mesh", subtitle: "Self-healing P2P mesh for disaster-resilient offline government connectivity", route: "/admin/mesh-autonomous", icon: Radio, color: "text-cyan-700", bgColor: "bg-cyan-50", borderColor: "border-cyan-200", tags: ["Phase 9", "Mesh", "Resilience"], phase: 9 },
    { id: "sdk", title: "Developer SDK Hub", subtitle: "OpenAPI 3.1 sandbox, rate-limited partner onboarding and webhook registration", route: "/admin/developer-sdk", icon: Cpu, color: "text-slate-700", bgColor: "bg-slate-50", borderColor: "border-slate-200", tags: ["Phase 9", "Developer", "API"], phase: 9 },
  ],
};

interface ModuleCardProps { module: LabModule; }
const ModuleCard: React.FC<ModuleCardProps> = ({ module }) => {
  const Icon = module.icon;
  return (
    <Link to={module.route}
      className={`group flex flex-col gap-3 p-4 rounded-2xl border ${module.bgColor} ${module.borderColor} hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${module.bgColor} border ${module.borderColor} shrink-0`}>
          <Icon className={`w-4 h-4 ${module.color}`} />
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${PHASE_COLORS[module.phase] || "bg-gray-100 text-gray-600"}`}>
          Phase {module.phase}
        </span>
      </div>
      <div>
        <h3 className="text-sm font-bold text-slate-900 leading-tight group-hover:text-indigo-700 transition-colors">{module.title}</h3>
        <p className="mt-0.5 text-xs text-slate-500 leading-relaxed line-clamp-2">{module.subtitle}</p>
      </div>
      <div className="flex flex-wrap gap-1 mt-auto">
        {module.tags.slice(1).map(t => (
          <span key={t} className="text-[10px] px-1.5 py-0.5 bg-white/80 text-slate-500 border border-slate-200 rounded-full">{t}</span>
        ))}
      </div>
      <div className="flex items-center text-xs font-semibold text-slate-500 group-hover:text-indigo-600 transition-colors">
        Open Module <ChevronRight className="w-3.5 h-3.5 ml-0.5 group-hover:translate-x-0.5 transition-transform" />
      </div>
    </Link>
  );
};

export const InnovationLabPage: React.FC = () => {
  const [activeGroup, setActiveGroup] = useState<string>("all");
  const totalModules = Object.values(MODULES).reduce((s, a) => s + a.length, 0);
  const groups = Object.keys(MODULES);
  const displayedGroups = activeGroup === "all" ? groups : groups.filter(g => g === activeGroup);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
      {/* Hero */}
      <div className="mb-8 rounded-3xl overflow-hidden relative shadow-2xl"
        style={{background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)"}}>
        <div className="absolute inset-0" style={{backgroundImage: "radial-gradient(circle at 15% 50%, rgba(99,102,241,0.25) 0%, transparent 55%), radial-gradient(circle at 85% 20%, rgba(245,158,11,0.2) 0%, transparent 55%)"}} />
        <div className="relative p-8 lg:p-10">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 border border-indigo-400/40 rounded-full text-xs font-bold text-indigo-300 uppercase tracking-widest mb-4">
                <Beaker className="w-3.5 h-3.5" /> MahaSetu Innovation Lab
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">Platform Module Navigator</h1>
              <p className="mt-2 text-sm text-slate-300 max-w-2xl leading-relaxed">
                All {totalModules} specialized innovation modules across 15 development phases — executive governance, national DPI, environmental IoT, cryptographic security, and rural digital inclusion.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                {[
                  { label: `${totalModules} Live Modules`, color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
                  { label: "94 Tests Passing", color: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
                  { label: "15 Phases Complete", color: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30" },
                  { label: "Problem Statement 26129", color: "bg-slate-500/20 text-slate-300 border-slate-500/30" },
                ].map(b => (
                  <span key={b.label} className={`inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full border font-semibold ${b.color}`}>
                    <CheckCircle2 className="w-3 h-3" /> {b.label}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              <Link to="/admin/capstone-showcase" className="flex items-center gap-2 px-5 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm rounded-2xl shadow-xl transition-colors whitespace-nowrap">
                <Play className="w-4 h-4 fill-slate-950" /> Run E2E Demo
              </Link>
              <Link to="/admin/war-room" className="flex items-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/20 text-white font-bold text-sm rounded-2xl border border-white/20 transition-colors whitespace-nowrap">
                <BarChart3 className="w-4 h-4" /> CM War Room
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button onClick={() => setActiveGroup("all")}
          className={`px-4 py-2 text-xs font-bold rounded-xl border transition-colors ${activeGroup === "all" ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"}`}>
          All ({totalModules})
        </button>
        {groups.map(g => (
          <button key={g} onClick={() => setActiveGroup(activeGroup === g ? "all" : g)}
            className={`px-4 py-2 text-xs font-bold rounded-xl border transition-colors ${activeGroup === g ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"}`}>
            {g.split(" ")[0]} ({MODULES[g].length})
          </button>
        ))}
      </div>

      {/* Module Groups */}
      <div className="space-y-10">
        {displayedGroups.map(group => (
          <div key={group}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1 h-6 bg-indigo-500 rounded-full" />
              <h2 className="text-base font-bold text-slate-900">{group}</h2>
              <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{MODULES[group].length} modules</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {MODULES[group].map(mod => <ModuleCard key={mod.id} module={mod} />)}
            </div>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { value: "84.7%", label: "Turnaround Faster", sub: "vs. 21-day baseline", color: "text-emerald-600" },
          { value: "₹2,845 Cr", label: "Benefits Disbursed", sub: "Statewide direct credit", color: "text-amber-600" },
          { value: "1.48M", label: "Citizens Served", sub: "Active applications", color: "text-indigo-600" },
          { value: "100%", label: "DPDP Compliant", sub: "Data Privacy Act 2023", color: "text-violet-600" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-200 p-5 text-center shadow-sm">
            <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-xs font-bold text-slate-800 mt-0.5">{s.label}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
