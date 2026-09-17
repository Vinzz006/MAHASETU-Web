import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useDemo } from "../../context/DemoContext";
import { api } from "../../api/client";
import {
  Shield, CheckCircle2, ArrowRight, Layers, Lock, FileText, Activity,
  Database, Zap, Globe, Users, Award, ChevronRight, Play,
  Fingerprint, GitBranch, BarChart3, Cpu, Leaf, Droplets,
  Radio, Scale, MapPin, Building2, RefreshCw, Star, Beaker, TrendingUp
} from "lucide-react";

// ---------------------------------------------------------------------------
// Animated counter hook
// ---------------------------------------------------------------------------
function useCountUp(target: number, duration = 1800, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start || target === 0) return;
    let startTime: number | null = null;
    const startVal = 0;
    function step(timestamp: number) {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // cubic ease-out
      setCount(Math.floor(startVal + (target - startVal) * eased));
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
}

// ---------------------------------------------------------------------------
// Live stats strip
// ---------------------------------------------------------------------------
function LiveStatsStrip({ stats }: { stats: any }) {
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStarted(true); }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const apps = useCountUp(stats?.total_applications ?? 0, 1600, started);
  const citizens = useCountUp(stats?.total_citizens ?? 0, 1400, started);
  const modules = useCountUp(stats?.total_modules ?? 35, 1200, started);
  const districts = useCountUp(stats?.districts_covered ?? 36, 1000, started);

  const items = [
    { value: apps,     suffix: "+",   label: "Applications Processed", icon: FileText,  color: "text-amber-400" },
    { value: citizens, suffix: "+",   label: "Citizens Registered",    icon: Users,     color: "text-sky-400"   },
    { value: modules,  suffix: "+",   label: "Innovation Modules",     icon: Beaker,    color: "text-violet-400"},
    { value: districts,suffix: "",    label: "Districts Covered",      icon: MapPin,    color: "text-emerald-400"},
  ];

  return (
    <div ref={ref} className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/10 rounded-2xl overflow-hidden border border-white/15 mt-8">
      {items.map(({ value, suffix, label, icon: Icon, color }) => (
        <div key={label} className="bg-white/5 backdrop-blur-sm px-6 py-5 text-center">
          <Icon className={`w-5 h-5 ${color} mx-auto mb-1.5`} />
          <div className={`text-3xl font-black ${color}`}>{value.toLocaleString("en-IN")}{suffix}</div>
          <div className="text-[10px] text-white/60 font-medium mt-0.5">{label}</div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Architecture flow diagram
// ---------------------------------------------------------------------------
const PIPELINE = [
  { step: 1, name: "Citizen Applies",       dept: "PORTAL",  color: "#6366f1", icon: Users      },
  { step: 2, name: "Consent Gateway",       dept: "PORTAL",  color: "#8b5cf6", icon: Lock       },
  { step: 3, name: "Identity Verify",       dept: "DEPT_A",  color: "#3b82f6", icon: Fingerprint },
  { step: 4, name: "Eligibility Check",     dept: "DEPT_B",  color: "#0ea5e9", icon: CheckCircle2},
  { step: 5, name: "Employment Sanction",   dept: "DEPT_C",  color: "#10b981", icon: Award      },
  { step: 6, name: "Admin Sign-off",        dept: "ADMIN",   color: "#f59e0b", icon: Shield     },
  { step: 7, name: "Audit & Notarise",      dept: "AUDITOR", color: "#ef4444", icon: Lock       },
  { step: 8, name: "DBT Disbursement",      dept: "PORTAL",  color: "#22c55e", icon: Zap        },
];

function ArchitectureFlow() {
  const [activeStep, setActiveStep] = useState<number | null>(null);
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full uppercase tracking-widest mb-2">
          <GitBranch className="w-3 h-3" /> MH-CANONICAL-v2.1 Workflow
        </div>
        <h3 className="text-xl font-black text-slate-900">8-Step Interoperability Pipeline</h3>
        <p className="text-xs text-slate-500 mt-1">One application ID. All departments. Zero re-submissions.</p>
      </div>

      {/* Pipeline nodes */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {PIPELINE.map((node, i) => {
          const Icon = node.icon;
          const isActive = activeStep === node.step;
          return (
            <React.Fragment key={node.step}>
              <button
                onMouseEnter={() => setActiveStep(node.step)}
                onMouseLeave={() => setActiveStep(null)}
                className={`relative flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all duration-200 cursor-default w-24 ${
                  isActive ? "border-2 shadow-lg scale-105 -translate-y-1" : "border-slate-200 bg-white"
                }`}
                style={isActive ? { borderColor: node.color, background: node.color + "10" } : {}}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: node.color + "20", border: `1.5px solid ${node.color}40` }}>
                  <Icon className="w-4 h-4" style={{ color: node.color }} />
                </div>
                <span className="text-[9px] font-black text-slate-800 text-center leading-tight">{node.name}</span>
                <span className="text-[8px] font-mono text-slate-400">{node.dept}</span>
                <span className="absolute -top-2 -left-2 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black text-white"
                  style={{ background: node.color }}>{node.step}</span>
              </button>
              {i < PIPELINE.length - 1 && (
                <ArrowRight className="w-3.5 h-3.5 text-slate-300 shrink-0 hidden sm:block" />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Canonical model info strip */}
      <div className="mt-6 grid grid-cols-3 gap-3">
        {[
          { label: "Canonical Model", value: "MH-CANONICAL-v2.1", icon: Database },
          { label: "Event Bus",       value: "MahaSetu EventBridge", icon: Radio  },
          { label: "Audit Standard",  value: "SHA-256 Merkle RFC 6962", icon: Lock},
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-slate-50 rounded-xl border border-slate-200 p-3 text-center">
            <Icon className="w-3.5 h-3.5 text-slate-500 mx-auto mb-1" />
            <div className="text-[9px] text-slate-400 uppercase tracking-wider">{label}</div>
            <div className="text-[10px] font-bold text-slate-700 mt-0.5 leading-tight">{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Feature grid (15 phases condensed to 12 feature cards)
// ---------------------------------------------------------------------------
const FEATURES = [
  { icon: Shield,      title: "Zero-Trust Security",      desc: "OWASP A+, JWT, DPDP Act 2023 compliance",              color: "text-indigo-600",  bg: "bg-indigo-50",  border: "border-indigo-100" },
  { icon: Lock,        title: "Merkle Audit Ledger",       desc: "RFC 6962 tamper-proof SHA-256 notarization",           color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
  { icon: Globe,       title: "National DPI Gateway",      desc: "PFMS, DigiLocker, APBS, ABHA integration",            color: "text-blue-600",    bg: "bg-blue-50",    border: "border-blue-100" },
  { icon: Radio,       title: "Marathi Voice AI",          desc: "Speech-to-service for 52,000 rural kiosks",           color: "text-violet-600",  bg: "bg-violet-50",  border: "border-violet-100" },
  { icon: Cpu,         title: "Post-Quantum Sandbox",      desc: "CRYSTALS-Kyber/Dilithium PQC readiness",              color: "text-slate-600",   bg: "bg-slate-50",   border: "border-slate-100" },
  { icon: BarChart3,   title: "CM Executive War Room",     desc: "MahaDrishti — 36-district live governance pulse",     color: "text-amber-600",   bg: "bg-amber-50",   border: "border-amber-100" },
  { icon: Leaf,        title: "Climate & ESG Telemetry",   desc: "Carbon offset, CEMS emissions, solar feeder grid",    color: "text-green-600",   bg: "bg-green-50",   border: "border-green-100" },
  { icon: Droplets,    title: "Jal Jeevan IoT",            desc: "Aquifer sensor network across 36 districts",          color: "text-sky-600",     bg: "bg-sky-50",     border: "border-sky-100" },
  { icon: Scale,       title: "Tribunal Nyaya AI",         desc: "Multi-agent quasi-judicial land dispute resolution",  color: "text-rose-600",    bg: "bg-rose-50",    border: "border-rose-100" },
  { icon: Zap,         title: "Smart Escrow e-RUPI",       desc: "Programmable CBDC vouchers via RBI e-RUPI rails",     color: "text-yellow-600",  bg: "bg-yellow-50",  border: "border-yellow-100" },
  { icon: Activity,    title: "Disaster Surge Relief",     desc: "Satellite flood fusion & evacuation automation",      color: "text-red-600",     bg: "bg-red-50",     border: "border-red-100" },
  { icon: Building2,   title: "Interstate Portability",    desc: "ONOSP migrant welfare across state boundaries",       color: "text-teal-600",    bg: "bg-teal-50",    border: "border-teal-100" },
];

// ---------------------------------------------------------------------------
// Demo persona panel
// ---------------------------------------------------------------------------
const PERSONAS = [
  { role: "CITIZEN" as const,     label: "Citizen",    sub: "Apply & track your scheme",  to: "/citizen/dashboard", color: "bg-indigo-600 hover:bg-indigo-500 text-white",                        icon: Users       },
  { role: "OFFICER" as const,     label: "Officer",    sub: "Process dept applications",  to: "/officer/dashboard", color: "bg-blue-600 hover:bg-blue-500 text-white",                           icon: FileText    },
  { role: "ADMIN" as const,       label: "Admin",      sub: "Governance & sign-offs",     to: "/admin/dashboard",   color: "bg-slate-800 hover:bg-slate-700 text-white",                         icon: Shield      },
  { role: "AUDITOR" as const,     label: "Auditor",    sub: "Compliance & audit trails",  to: "/auditor/dashboard", color: "bg-amber-500 hover:bg-amber-400 text-slate-950",                     icon: Lock        },
];

// ---------------------------------------------------------------------------
// Main LandingPage
// ---------------------------------------------------------------------------
export const LandingPage: React.FC = () => {
  const { switchPersona } = useAuth();
  const { setIsInspectorOpen } = useDemo();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    api.getPlatformStats().then(setStats).catch(() => {});
  }, []);

  return (
    <div className="flex flex-col">

      {/* ================================================================
          HERO SECTION
      ================================================================ */}
      <section className="relative overflow-hidden text-white"
        style={{ background: "linear-gradient(160deg, #080f1f 0%, #0f2942 40%, #1a3d6b 75%, #0f2942 100%)" }}>

        {/* Ambient glow layers */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full opacity-20"
            style={{ background: "radial-gradient(circle, #6366f1 0%, transparent 70%)", transform: "translateY(-50%)" }} />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, #f59e0b 0%, transparent 70%)", transform: "translateY(40%)" }} />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-14">
          {/* Badge */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 bg-amber-400/15 border border-amber-400/40 text-amber-300 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              Government of Maharashtra · Problem Statement 26129
            </div>
          </div>

          {/* Headline */}
          <div className="text-center">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white mb-4 leading-none">
              <span className="block">महासेतु</span>
              <span className="block text-3xl sm:text-4xl lg:text-5xl mt-2 text-amber-400 font-extrabold">MAHASETU</span>
            </h1>

            <p className="text-lg sm:text-xl font-bold text-amber-300 mb-3">
              One Citizen. One Consent. One Application Journey.
            </p>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed mb-2">
              Maharashtra's unified interoperability middleware — connecting every department,
              legacy system, and DPI without a single line of departmental code rewrite.
            </p>
            <div className="inline-flex items-center gap-2 text-xs text-emerald-400 font-bold">
              <TrendingUp className="w-4 h-4" />
              84.7% faster service delivery · 21 days → 3.2 days
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="/services"
              className="flex items-center gap-2 px-6 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm rounded-2xl shadow-xl hover:shadow-amber-400/25 transition-all">
              <Layers className="w-4 h-4" /> Explore All Schemes
            </Link>
            <Link to="/admin/capstone-showcase"
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-2xl border border-indigo-400/30 shadow-xl transition-all">
              <Play className="w-4 h-4 fill-white" /> Judge Showcase Demo
            </Link>
            <button onClick={() => setIsInspectorOpen(true)}
              className="flex items-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold text-sm rounded-2xl border border-white/20 transition-all">
              <Database className="w-4 h-4 text-amber-400" /> Canonical Engine Inspector
            </button>
          </div>

          {/* Live Stats */}
          {stats && <LiveStatsStrip stats={stats} />}

          {/* Compliance badges */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            {["DPDP Act 2023", "W3C Verifiable Credentials", "RFC 6962 Merkle Audit", "NIST PQC Ready", "15 Phases · 35+ Modules"].map(b => (
              <span key={b} className="inline-flex items-center gap-1 text-[10px] px-2.5 py-1 bg-white/8 border border-white/15 rounded-full text-white/70 font-semibold">
                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />{b}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          DEMO PERSONA QUICK LAUNCH
      ================================================================ */}
      <section className="bg-slate-900 border-b border-slate-800 py-5 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Quick Demo Launch</p>
            <p className="text-sm font-bold text-white mt-0.5">Switch persona to explore the full platform →</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {PERSONAS.map(({ role, label, sub, to, color, icon: Icon }) => (
              <Link key={role} to={to} onClick={() => switchPersona(role)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors ${color} shadow-sm`}>
                <Icon className="w-3.5 h-3.5" />
                <div className="text-left">
                  <div>{label} View</div>
                  <div className="opacity-70 font-normal text-[10px]">{sub}</div>
                </div>
              </Link>
            ))}
            <Link to="/admin/innovation-lab"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white transition-colors shadow-sm">
              <Beaker className="w-3.5 h-3.5" />
              <div>Innovation Lab</div>
            </Link>
          </div>
        </div>
      </section>

      {/* ================================================================
          CORE VALUE PILLARS
      ================================================================ */}
      <section className="py-14 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full uppercase tracking-widest mb-3">
              <Layers className="w-3 h-3" /> Architecture
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">Three Foundational Pillars</h2>
            <p className="text-sm text-slate-500 max-w-xl mx-auto">
              MahaSetu doesn't replace legacy systems — it orchestrates secure, consent-driven data exchange through standardized canonical models.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[
              { icon: Layers,  color: "text-blue-700",    bg: "bg-blue-50",    border: "border-blue-200",   title: "Universal Application Passport",
                desc: "One Universal Application ID (MH-APP-2026-XXXXXX) tracks the citizen's multi-department journey end-to-end without re-entry.",
                badge: "Single Window Experience" },
              { icon: Lock,    color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", title: "Cryptographic Consent Gateway",
                desc: "Citizen data never crosses department boundaries without explicit, auditable, cryptographic consent per the DPDP Act 2023.",
                badge: "DPDP Act 2023 Compliant" },
              { icon: Activity, color: "text-amber-700",  bg: "bg-amber-50",   border: "border-amber-200",  title: "Non-Invasive Interoperability",
                desc: "Legacy mainframe registries, REST APIs, and SOAP services connect via lightweight adapters — zero internal rewrites required.",
                badge: "Legacy Adapter Ready" },
            ].map(p => {
              const Icon = p.icon;
              return (
                <div key={p.title} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
                  <div className={`w-11 h-11 rounded-xl ${p.bg} border ${p.border} flex items-center justify-center mb-4`}>
                    <Icon className={`w-5 h-5 ${p.color}`} />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2">{p.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">{p.desc}</p>
                  <div className={`text-[10px] font-bold flex items-center gap-1 ${p.color}`}>
                    <CheckCircle2 className="w-3.5 h-3.5" />{p.badge}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Architecture flow */}
          <ArchitectureFlow />
        </div>
      </section>

      {/* ================================================================
          BEFORE / AFTER IMPACT
      ================================================================ */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 border-t border-slate-200">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-black text-slate-900 mb-1">Measurable Service Delivery Impact</h2>
            <p className="text-xs text-slate-500">Simulated benchmark illustrating operational transformation</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Before */}
            <div className="bg-white rounded-2xl border border-rose-200 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="px-2.5 py-1 bg-rose-100 text-rose-700 text-[10px] font-black rounded-lg uppercase tracking-wide">Before</div>
                <span className="text-sm font-bold text-slate-800">Fragmented Model</span>
              </div>
              <div className="space-y-3">
                {[
                  ["Information Re-entry", "3–4 separate portal submissions"],
                  ["Department Portals",   "3 independent tracking IDs"],
                  ["Average Processing",   "21+ working days"],
                  ["Cross-dept. Coordination", "Manual citizen burden"],
                  ["Audit Trail",          "Siloed, paper-based"],
                ].map(([label, val]) => (
                  <div key={label} className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">{label}</span>
                    <strong className="text-rose-700">{val}</strong>
                  </div>
                ))}
              </div>
            </div>
            {/* After */}
            <div className="bg-white rounded-2xl border border-emerald-300 p-6 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[9px] font-black px-3 py-1 rounded-bl-lg">MAHASETU</div>
              <div className="flex items-center gap-2 mb-4">
                <div className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-lg uppercase tracking-wide">After</div>
                <span className="text-sm font-bold text-slate-800">Unified Platform</span>
              </div>
              <div className="space-y-3">
                {[
                  ["Information Entry",     "1 unified form · data reused"],
                  ["Application Tracking",  "1 Universal Application ID"],
                  ["Average Processing",    "3.2 days (84.7% faster)"],
                  ["Cross-dept. Coordination", "Event-driven automation"],
                  ["Audit Trail",           "SHA-256 Merkle · RFC 6962"],
                ].map(([label, val]) => (
                  <div key={label} className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">{label}</span>
                    <strong className="text-emerald-700">{val}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Key metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { value: "84.7%", label: "Turnaround Faster",    color: "text-emerald-600" },
              { value: "₹2,845 Cr", label: "Benefits Disbursed", color: "text-amber-600" },
              { value: "36",       label: "Districts Covered",  color: "text-blue-600"   },
              { value: "100%",     label: "DPDP Compliant",     color: "text-violet-600" },
            ].map(m => (
              <div key={m.label} className="bg-white rounded-2xl border border-slate-200 p-4 text-center shadow-sm">
                <div className={`text-2xl font-black ${m.color}`}>{m.value}</div>
                <div className="text-[10px] font-bold text-slate-600 mt-0.5">{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          FEATURE SHOWCASE GRID (15 phases)
      ================================================================ */}
      <section className="py-14 px-4 sm:px-6 lg:px-8 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 text-[10px] font-bold text-violet-700 bg-violet-50 border border-violet-200 px-3 py-1 rounded-full uppercase tracking-widest mb-3">
              <Beaker className="w-3 h-3" /> Innovation Lab · 15 Phases · 35+ Modules
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">Platform Capability Showcase</h2>
            <p className="text-sm text-slate-500 max-w-xl mx-auto">
              Beyond core interoperability — 35+ specialized government modules for executive intelligence, climate tech, cryptography, and rural inclusion.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {FEATURES.map(f => {
              const Icon = f.icon;
              return (
                <div key={f.title} className={`${f.bg} rounded-2xl border ${f.border} p-4 hover:shadow-md hover:-translate-y-0.5 transition-all`}>
                  <div className={`w-9 h-9 rounded-xl ${f.bg} border ${f.border} flex items-center justify-center mb-3`}>
                    <Icon className={`w-4 h-4 ${f.color}`} />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1">{f.title}</h3>
                  <p className="text-[10px] text-slate-500 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
          <div className="text-center">
            <Link to="/admin/innovation-lab"
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-2xl transition-colors shadow-lg">
              <Beaker className="w-4 h-4" /> Explore All 35+ Innovation Lab Modules <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ================================================================
          BOTTOM CTA
      ================================================================ */}
      <section className="py-12 px-4 border-t border-slate-200"
        style={{ background: "linear-gradient(135deg, #0f2942 0%, #1a3d6b 100%)" }}>
        <div className="max-w-4xl mx-auto text-center text-white">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-400/20 border border-amber-400/40 rounded-full text-[10px] font-bold text-amber-300 uppercase tracking-widest mb-4">
            <Star className="w-3 h-3 fill-amber-400" /> Smart India Hackathon 2025 · Problem Statement 26129
          </div>
          <h2 className="text-2xl sm:text-3xl font-black mb-3">Ready to Transform Government Service Delivery?</h2>
          <p className="text-sm text-slate-300 max-w-2xl mx-auto mb-6">
            Experience the full end-to-end platform — from citizen application to DBT disbursement — in a single live demonstration.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link to="/admin/capstone-showcase"
              className="flex items-center gap-2 px-6 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm rounded-2xl shadow-xl transition-all">
              <Play className="w-4 h-4 fill-slate-950" /> Run Full E2E Showcase
            </Link>
            <Link to="/services"
              className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold text-sm rounded-2xl border border-white/20 transition-all">
              <Layers className="w-4 h-4" /> Browse Service Catalog
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};
