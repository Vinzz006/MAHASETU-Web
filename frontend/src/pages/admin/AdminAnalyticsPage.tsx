import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client";
import {
  BarChart3, Shield, AlertTriangle, CheckCircle2, RefreshCw, Activity,
  Users, FileText, Clock, TrendingUp, TrendingDown, Lock, MapPin,
  Zap, Building2, ArrowRight, AlertCircle, Star, Database
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Analytics {
  summary: {
    total_applications: number;
    completed: number;
    in_progress: number;
    rework_required: number;
    exceptions: number;
    completion_rate_pct: number;
    total_citizens: number;
    total_staff: number;
    avg_apps_per_citizen: number;
  };
  funnel: Array<{ stage: string; count: number; pct: number }>;
  consent_compliance_pct: number;
  authorized_consents: number;
  total_consents: number;
  sla_breaches: number;
  sla_baseline_days: number;
  transactions_last_hour: number;
  department_analytics: Array<{
    department_id: string; total_transactions: number; success_rate: number; status: string;
  }>;
  top_districts: Array<{ district: string; count: number }>;
  platform_health: "HEALTHY" | "DEGRADED" | "AT_RISK";
  timestamp: string;
}

// ---------------------------------------------------------------------------
// KPI Card
// ---------------------------------------------------------------------------
function KpiCard({ label, value, sub, icon: Icon, color, trend }: {
  label: string; value: string | number; sub?: string;
  icon: React.ComponentType<any>; color: string; trend?: "up" | "down" | "neutral";
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center`} style={{ background: color + "18" }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        {trend && trend !== "neutral" && (
          <div className={`flex items-center gap-1 text-[10px] font-bold ${trend === "up" ? "text-emerald-600" : "text-rose-600"}`}>
            {trend === "up" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          </div>
        )}
      </div>
      <div className="text-2xl font-black text-slate-900 mb-0.5">{value}</div>
      <div className="text-xs font-bold text-slate-600">{label}</div>
      {sub && <div className="text-[10px] text-slate-400 mt-0.5">{sub}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Application Funnel
// ---------------------------------------------------------------------------
const FUNNEL_COLORS: Record<string, string> = {
  "Submitted":   "#6366f1",
  "In Progress": "#3b82f6",
  "Sanctioned":  "#22c55e",
  "Action Reqd": "#f59e0b",
  "Exception":   "#ef4444",
};

function FunnelChart({ funnel }: { funnel: Analytics["funnel"] }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-5">
        <BarChart3 className="w-4 h-4 text-indigo-600" />
        <h3 className="text-sm font-bold text-slate-800">Application Pipeline Funnel</h3>
      </div>
      <div className="space-y-3">
        {funnel.map(row => (
          <div key={row.stage}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-semibold text-slate-700">{row.stage}</span>
              <span className="font-black text-slate-900">{row.count} <span className="text-slate-400 font-medium">({row.pct}%)</span></span>
            </div>
            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.max(row.pct, row.count > 0 ? 4 : 0)}%`, background: FUNNEL_COLORS[row.stage] || "#6366f1" }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Department Health Matrix
// ---------------------------------------------------------------------------
const DEPT_LABELS: Record<string, string> = {
  DEPT_A:    "Department A · Identity",
  DEPT_B:    "Department B · Eligibility",
  DEPT_C:    "Department C · Employment",
  LEGACY_01: "Legacy Registry · Civil",
};
const DEPT_TYPES: Record<string, string> = {
  DEPT_A:    "Modern REST API",
  DEPT_B:    "Heterogeneous JSON",
  DEPT_C:    "Workflow Engine",
  LEGACY_01: "Mainframe Pipe-Delimited",
};

function DeptHealthMatrix({ depts }: { depts: Analytics["department_analytics"] }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-5">
        <Building2 className="w-4 h-4 text-blue-700" />
        <h3 className="text-sm font-bold text-slate-800">Department Integration Health</h3>
      </div>
      <div className="space-y-3">
        {depts.map(dept => {
          const isHealthy  = dept.status === "HEALTHY";
          const isDegraded = dept.status === "DEGRADED";
          return (
            <div key={dept.department_id} className={`rounded-xl border p-3.5 ${
              isHealthy ? "border-emerald-200 bg-emerald-50/50" :
              isDegraded ? "border-amber-200 bg-amber-50/50" :
              "border-rose-200 bg-rose-50/50"
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="text-xs font-bold text-slate-800">{DEPT_LABELS[dept.department_id] || dept.department_id}</div>
                  <div className="text-[9px] font-mono text-slate-400 mt-0.5">{DEPT_TYPES[dept.department_id]}</div>
                </div>
                <div className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                  isHealthy ? "bg-emerald-500 text-white" :
                  isDegraded ? "bg-amber-500 text-white" : "bg-rose-500 text-white"
                }`}>{dept.status}</div>
              </div>
              <div className="flex items-center gap-3 text-[10px]">
                <div>
                  <span className="text-slate-500">Transactions: </span>
                  <strong className="text-slate-700">{dept.total_transactions}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Success Rate: </span>
                  <strong className={isHealthy ? "text-emerald-700" : isDegraded ? "text-amber-700" : "text-rose-700"}>
                    {dept.success_rate}%
                  </strong>
                </div>
              </div>
              <div className="h-1.5 bg-white rounded-full overflow-hidden mt-2">
                <div className={`h-full rounded-full ${isHealthy ? "bg-emerald-500" : isDegraded ? "bg-amber-400" : "bg-rose-500"}`}
                  style={{ width: `${dept.success_rate}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Consent Compliance Gauge
// ---------------------------------------------------------------------------
function ConsentGauge({ pct, authorized, total }: { pct: number; authorized: number; total: number }) {
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (pct / 100) * circumference;
  const color = pct >= 90 ? "#22c55e" : pct >= 70 ? "#f59e0b" : "#ef4444";

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-5">
        <Lock className="w-4 h-4 text-violet-700" />
        <h3 className="text-sm font-bold text-slate-800">DPDP Consent Compliance</h3>
      </div>
      <div className="flex items-center gap-6">
        <div className="relative w-24 h-24 shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r="40" fill="none" stroke="#f1f5f9" strokeWidth="10" />
            <circle cx="50" cy="50" r="40" fill="none" stroke={color} strokeWidth="10"
              strokeDasharray={circumference} strokeDashoffset={offset}
              strokeLinecap="round" className="transition-all duration-700" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-black text-slate-900">{pct}%</span>
          </div>
        </div>
        <div className="space-y-2">
          <div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Authorized</div>
            <div className="text-xl font-black text-emerald-600">{authorized}</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Total Issued</div>
            <div className="text-xl font-black text-slate-700">{total}</div>
          </div>
          <div className="text-[9px] font-semibold px-2 py-1 bg-violet-50 text-violet-700 border border-violet-200 rounded-full">
            DPDP Act 2023 · Purpose-Limited
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Top Districts bar
// ---------------------------------------------------------------------------
function TopDistricts({ districts }: { districts: Analytics["top_districts"] }) {
  const max = Math.max(...districts.map(d => d.count), 1);
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-5">
        <MapPin className="w-4 h-4 text-sky-700" />
        <h3 className="text-sm font-bold text-slate-800">Top Districts by Applications</h3>
      </div>
      {districts.length === 0
        ? <p className="text-xs text-slate-400 text-center py-4">No district data yet</p>
        : <div className="space-y-3">
            {districts.map((d, i) => (
              <div key={d.district}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-700">
                    {i === 0 && <Star className="w-3 h-3 text-amber-400 inline mr-1 fill-amber-400" />}
                    {d.district}
                  </span>
                  <span className="font-black text-slate-900">{d.count}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-sky-500 transition-all duration-700"
                    style={{ width: `${(d.count / max) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
      }
    </div>
  );
}

// ---------------------------------------------------------------------------
// SLA Alert banner
// ---------------------------------------------------------------------------
function SlaAlert({ breaches, baseline }: { breaches: number; baseline: number }) {
  if (breaches === 0) {
    return (
      <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
        <div className="text-xs text-emerald-800">
          <strong className="font-bold">Zero SLA Breaches</strong> — All in-flight applications are within the {baseline}-day processing target.
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3 bg-amber-50 border border-amber-300 rounded-2xl p-4">
      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
      <div className="text-xs text-amber-900">
        <strong className="font-bold">{breaches} SLA Breach{breaches > 1 ? "es" : ""} Detected</strong> — Applications exceeding the {baseline}-day target.
        <Link to="/admin/dashboard" className="ml-2 text-amber-700 underline underline-offset-2 font-bold">
          Review in Admin Dashboard →
        </Link>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export const AdminAnalyticsPage: React.FC = () => {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async (manual = false) => {
    if (manual) setRefreshing(true);
    try {
      const result = await api.getGovernanceAnalytics();
      setData(result);
      setLastRefresh(new Date());
    } catch (e) {
      console.error("Analytics load failed", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(), 15000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500 font-semibold">Loading governance analytics…</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <p className="text-sm text-slate-600">Unable to load analytics. Check your connection.</p>
      </div>
    );
  }

  const healthColor = data.platform_health === "HEALTHY" ? "#22c55e" : data.platform_health === "DEGRADED" ? "#f59e0b" : "#ef4444";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full uppercase tracking-widest mb-2 w-fit">
            <BarChart3 className="w-3 h-3" /> MahaDrishti · Governance Intelligence
          </div>
          <h1 className="text-2xl font-black text-slate-900">Platform Analytics Dashboard</h1>
          <p className="text-xs text-slate-500 mt-1">
            Live cross-role metrics · Auto-refreshes every 15s
            <span className="ml-2 text-slate-400">Last: {lastRefresh.toLocaleTimeString()}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Platform health badge */}
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-black"
            style={{ borderColor: healthColor + "60", background: healthColor + "12", color: healthColor }}>
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: healthColor }} />
            {data.platform_health}
          </div>
          <button onClick={() => loadData(true)} disabled={refreshing}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50">
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} /> Refresh
          </button>
          <Link to="/admin/dashboard"
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors">
            Admin Dashboard <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* SLA Alert */}
      <div className="mb-6">
        <SlaAlert breaches={data.sla_breaches} baseline={data.sla_baseline_days} />
      </div>

      {/* KPI Scoreboard */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <KpiCard label="Total Applications" value={data.summary.total_applications} icon={FileText} color="#6366f1" trend="up" />
        <KpiCard label="Sanctioned" value={data.summary.completed} sub={`${data.summary.completion_rate_pct}% completion`} icon={CheckCircle2} color="#22c55e" trend="up" />
        <KpiCard label="In Progress" value={data.summary.in_progress} sub="Active pipeline" icon={Activity} color="#3b82f6" trend="neutral" />
        <KpiCard label="Action Required" value={data.summary.rework_required} sub="Rework / flagged" icon={AlertTriangle} color="#f59e0b" trend={data.summary.rework_required > 0 ? "down" : "neutral"} />
        <KpiCard label="Citizens Onboarded" value={data.summary.total_citizens} sub="Registered portal users" icon={Users} color="#8b5cf6" trend="up" />
        <KpiCard label="Txns / Last Hour" value={data.transactions_last_hour} sub="Cross-dept throughput" icon={Zap} color="#10b981" trend="up" />
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Funnel — 2 cols */}
        <div className="lg:col-span-2">
          <FunnelChart funnel={data.funnel} />
        </div>
        {/* Consent gauge — 1 col */}
        <ConsentGauge
          pct={data.consent_compliance_pct}
          authorized={data.authorized_consents}
          total={data.total_consents}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <DeptHealthMatrix depts={data.department_analytics} />
        <TopDistricts districts={data.top_districts} />
      </div>

      {/* Bottom stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "SLA Baseline",   value: `${data.sla_baseline_days} days`, icon: Clock,     color: "#6366f1" },
          { label: "SLA Breaches",   value: data.sla_breaches,                icon: AlertTriangle, color: data.sla_breaches > 0 ? "#ef4444" : "#22c55e" },
          { label: "Staff Users",    value: data.summary.total_staff,          icon: Shield,    color: "#f59e0b" },
          { label: "Avg Apps/Citizen", value: data.summary.avg_apps_per_citizen, icon: Database, color: "#8b5cf6" },
        ].map(m => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: m.color + "18" }}>
                <Icon className="w-4 h-4" style={{ color: m.color }} />
              </div>
              <div>
                <div className="text-base font-black text-slate-900">{m.value}</div>
                <div className="text-[10px] text-slate-500 font-semibold">{m.label}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
