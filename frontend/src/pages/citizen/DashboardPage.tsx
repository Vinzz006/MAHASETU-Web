import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";
import {
  FileText, ArrowRight, CheckCircle2, Clock, AlertTriangle, Plus, Shield,
  Search, User, Bell, RefreshCw, ChevronRight, Sparkles, Activity,
  BarChart3, Lock, Zap, Award, TrendingUp, GitBranch, Inbox
} from "lucide-react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const PIPELINE_STAGES = [
  { key: "APPLICATION_CREATED", label: "Created", dept: "PORTAL", step: 1 },
  { key: "CONSENT_GRANTED",     label: "Consent",  dept: "PORTAL", step: 2 },
  { key: "IDENTITY_VERIFIED",   label: "Identity", dept: "DEPT_A", step: 3 },
  { key: "ELIGIBILITY_VERIFIED",label: "Eligible", dept: "DEPT_B", step: 4 },
  { key: "APPROVAL_STARTED",    label: "Dept C",   dept: "DEPT_C", step: 5 },
  { key: "COMPLETED",           label: "Sanctioned",dept:"ADMIN",  step: 6 },
];

function getPipelineStep(status: string): number {
  const s = PIPELINE_STAGES.find((p) => p.key === status);
  return s ? s.step : (status === "REWORK" || status === "EXCEPTION" ? -1 : 0);
}

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------
function StatusBadge({ status }: { status: string }) {
  if (status === "COMPLETED")
    return <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] px-2.5 py-0.5 rounded-full font-bold"><CheckCircle2 className="w-3 h-3" />Sanctioned</span>;
  if (status === "REWORK")
    return <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-[10px] px-2.5 py-0.5 rounded-full font-bold animate-pulse"><AlertTriangle className="w-3 h-3" />Action Required</span>;
  if (status === "EXCEPTION")
    return <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 text-[10px] px-2.5 py-0.5 rounded-full font-bold"><AlertTriangle className="w-3 h-3" />Exception</span>;
  return <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-[10px] px-2.5 py-0.5 rounded-full font-bold"><Clock className="w-3 h-3" />In Progress</span>;
}

// ---------------------------------------------------------------------------
// Mini pipeline visualizer
// ---------------------------------------------------------------------------
function PipelineBar({ status }: { status: string }) {
  const step = getPipelineStep(status);
  const isError = status === "REWORK" || status === "EXCEPTION";
  const total = PIPELINE_STAGES.length;

  return (
    <div className="flex items-center gap-0.5 mt-2">
      {PIPELINE_STAGES.map((stage, i) => {
        const done = !isError && step > stage.step;
        const active = !isError && step === stage.step;
        const errAt = isError && i === Math.min(step === -1 ? 4 : step, total - 1);
        return (
          <React.Fragment key={stage.key}>
            <div className="relative group">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black transition-all
                ${done ? "bg-emerald-500 text-white" : active ? "bg-blue-600 text-white ring-2 ring-blue-300 ring-offset-1" :
                  errAt ? "bg-rose-500 text-white ring-2 ring-rose-300 ring-offset-1" : "bg-slate-200 text-slate-500"}`}
              >
                {done ? "✓" : stage.step}
              </div>
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-900 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                {stage.label}
              </div>
            </div>
            {i < total - 1 && (
              <div className={`flex-1 h-0.5 ${done ? "bg-emerald-400" : "bg-slate-200"}`} style={{ minWidth: 8 }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stat Card
// ---------------------------------------------------------------------------
function StatCard({ icon: Icon, label, value, sub, color, bg }: {
  icon: React.FC<any>; label: string; value: number | string; sub?: string; color: string; bg: string;
}) {
  return (
    <div className={`${bg} rounded-2xl p-4 border border-slate-200/60 shadow-sm flex items-start gap-3`}>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${bg} border border-slate-200`}>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div>
        <div className={`text-xl font-black ${color}`}>{value}</div>
        <div className="text-xs font-bold text-slate-700">{label}</div>
        {sub && <div className="text-[10px] text-slate-400">{sub}</div>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Profile completion meter
// ---------------------------------------------------------------------------
function ProfileMeter({ pct, hasProfile }: { pct: number; hasProfile: boolean }) {
  if (pct >= 100) return null;
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-4">
      <div className="relative w-14 h-14 shrink-0">
        <svg viewBox="0 0 36 36" className="w-14 h-14 -rotate-90">
          <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#fde68a" strokeWidth="3" />
          <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#f59e0b" strokeWidth="3"
            strokeDasharray={`${pct} ${100 - pct}`} strokeLinecap="round" />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-amber-700">{pct}%</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-bold text-amber-800">
          {hasProfile ? `Profile ${pct}% Complete` : "Profile not created yet"}
        </div>
        <div className="text-[10px] text-amber-600 mt-0.5">
          Complete your Resident Profile to unlock faster scheme eligibility pre-filling and auto-verification.
        </div>
        <Link to="/resident-profile" className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 hover:text-amber-900 transition-colors">
          Complete Profile <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Live indicator
// ---------------------------------------------------------------------------
function LivePulse({ active = true }: { active?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${active ? "text-emerald-400" : "text-slate-400"}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-emerald-400 animate-pulse" : "bg-slate-400"}`} />
      {active ? "LIVE SSE" : "SYNCED"}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Application card
// ---------------------------------------------------------------------------
function ApplicationCard({ app, onRefresh }: { app: any; onRefresh: () => void }) {
  const isRework = app.status === "REWORK";
  const isCompleted = app.status === "COMPLETED";
  const isException = app.status === "EXCEPTION";

  return (
    <div className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all ${
      isRework ? "border-amber-300 ring-1 ring-amber-200" :
      isException ? "border-rose-300 ring-1 ring-rose-200" :
      isCompleted ? "border-emerald-200" : "border-slate-200"
    }`}>
      <div className="p-5">
        {/* Top row */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-xs font-extrabold text-blue-900 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
              {app.application_number}
            </span>
            <StatusBadge status={app.status} />
          </div>
          <span className="text-[10px] text-slate-400">
            Updated {new Date(app.updated_at || app.created_at).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}
          </span>
        </div>

        {/* Service name */}
        <h3 className="text-base font-bold text-slate-900 mb-1">{app.service_name}</h3>
        <p className="text-[11px] text-slate-500 mb-3">
          Current step: <strong className="font-mono text-slate-700">{app.current_department}</strong>
          {" "}&bull;{" "}Applied {new Date(app.created_at).toLocaleDateString("en-IN")}
        </p>

        {/* Pipeline bar */}
        <PipelineBar status={app.status} />

        {/* Rework alert */}
        {isRework && app.rejection_reason && (
          <div className="mt-3 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[10px] text-amber-800">
            <strong>Action Required:</strong> {app.rejection_reason}
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between gap-3 bg-slate-50/60 rounded-b-2xl">
        <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
          <GitBranch className="w-3 h-3" />
          <span>Universal Passport Tracking Active</span>
        </div>
        <div className="flex items-center gap-2">
          {isRework && (
            <Link to={`/applications/${app.id}/track`}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-white text-[10px] font-black rounded-lg transition-colors">
              Resubmit
            </Link>
          )}
          <Link to={`/applications/${app.id}/track`}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-950 hover:bg-blue-900 text-white text-[10px] font-bold rounded-lg transition-colors">
            <Search className="w-3 h-3" />
            Track Journey
          </Link>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Quick-action cards
// ---------------------------------------------------------------------------
const QUICK_ACTIONS = [
  { label: "Apply for New Scheme", sub: "Browse 40+ government services", icon: Plus, to: "/services", color: "bg-blue-950 text-white hover:bg-blue-800" },
  { label: "My Documents Locker", sub: "DigiLocker-synced vault", icon: Lock, to: "/citizen/locker", color: "bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100" },
  { label: "Check Entitlements", sub: "Proactive scheme eligibility", icon: Sparkles, to: "/citizen/entitlements", color: "bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100" },
  { label: "Grievance Portal", sub: "File RTI or complaint", icon: Inbox, to: "/citizen/nivarana", color: "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100" },
  { label: "Voice Assistant", sub: "Marathi speech-to-service", icon: Activity, to: "/citizen/vaani", color: "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100" },
  { label: "View Credentials", sub: "W3C Verifiable Credentials", icon: Award, to: "/citizen/credentials", color: "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100" },
];

// ---------------------------------------------------------------------------
// Main DashboardPage
// ---------------------------------------------------------------------------
export const DashboardPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [applications, setApplications] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [liveConnected, setLiveConnected] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  const loadData = async () => {
    try {
      const [apps, summ] = await Promise.all([
        api.getApplications(),
        api.getCitizenDashboardSummary().catch(() => null),
      ]);
      setApplications(apps);
      setSummary(summ);
    } catch (err) {
      console.warn("Failed to load citizen dashboard", err);
    } finally {
      setLoading(false);
      setSummaryLoading(false);
    }
  };

  // SSE live feed with proper connection lifecycle and unmount cleanup
  useEffect(() => {
    loadData();
    let es: EventSource | null = null;
    let fallbackInterval: ReturnType<typeof setInterval> | null = null;

    try {
      const url = api.getApplicationLiveFeedUrl();
      es = new EventSource(url);
      esRef.current = es;

      es.onopen = () => {
        setLiveConnected(true);
        if (fallbackInterval) {
          clearInterval(fallbackInterval);
          fallbackInterval = null;
        }
      };

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "application_update" && data.applications) {
            setApplications(data.applications);
          }
        } catch {
          // ignore keepalive comments / ping
        }
      };

      es.onerror = () => {
        setLiveConnected(false);
        // Fall back to polling interval if SSE disconnects or encounters error
        if (!fallbackInterval) {
          fallbackInterval = setInterval(() => {
            api.getApplications().then(setApplications).catch(() => {});
          }, 8000);
        }
      };
    } catch (err) {
      console.warn("SSE initialization failed, using polling fallback", err);
      fallbackInterval = setInterval(() => {
        api.getApplications().then(setApplications).catch(() => {});
      }, 8000);
    }

    return () => {
      if (es) {
        es.close();
      }
      esRef.current = null;
      if (fallbackInterval) {
        clearInterval(fallbackInterval);
      }
    };
  }, []);

  const reworkApps = applications.filter((a) => a.status === "REWORK");
  const inProgressApps = applications.filter((a) => !["COMPLETED", "REWORK", "EXCEPTION"].includes(a.status));
  const completedApps = applications.filter((a) => a.status === "COMPLETED");

  const profilePct = summary?.profile_completion_pct ?? 0;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">

      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl mb-8 shadow-xl"
        style={{ background: "linear-gradient(135deg, #0f2942 0%, #1a3d6b 60%, #0f2942 100%)" }}>
        <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle at 80% 30%, rgba(251,191,36,0.15) 0%, transparent 60%)" }} />
        <div className="relative px-6 sm:px-8 py-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 text-amber-400 text-[10px] font-bold uppercase tracking-widest mb-1">
              <Shield className="w-3.5 h-3.5" />
              Citizen Service Passport &bull; Problem Statement 26129
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              Namaskar, {currentUser?.name?.split(" ")[0] || "Demo Citizen"} 🙏
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Government of Maharashtra interoperability platform &bull; {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>

            {/* Summary badges */}
            {!summaryLoading && summary && (
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="text-[10px] bg-white/10 text-white px-2.5 py-1 rounded-full border border-white/20 font-semibold">
                  {summary.total_applications} Applications
                </span>
                {summary.action_required && (
                  <span className="text-[10px] bg-amber-400 text-slate-900 px-2.5 py-1 rounded-full font-black animate-pulse">
                    ⚡ {summary.status_breakdown.rework_required} Action Required
                  </span>
                )}
                {summary.unread_notifications > 0 && (
                  <span className="text-[10px] bg-indigo-500/30 text-indigo-200 px-2.5 py-1 rounded-full border border-indigo-400/30 font-semibold">
                    <Bell className="inline w-2.5 h-2.5 mr-0.5" />{summary.unread_notifications} Notifications
                  </span>
                )}
                <LivePulse active={liveConnected} />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 shrink-0">
            <Link to="/services"
              className="flex items-center gap-2 px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-2xl shadow-lg transition-colors">
              <Plus className="w-4 h-4" /> Apply for New Scheme
            </Link>
            <Link to="/resident-profile"
              className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-2xl border border-white/20 transition-colors">
              <User className="w-4 h-4" /> My Resident Profile
            </Link>
          </div>
        </div>
      </div>

      {/* Profile completion alert */}
      {!summaryLoading && (
        <div className="mb-6">
          <ProfileMeter pct={profilePct} hasProfile={summary?.has_profile ?? false} />
        </div>
      )}

      {/* Stats Scorecard */}
      {!summaryLoading && summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <StatCard icon={FileText} label="Total Applications" value={summary.total_applications}
            sub="All time" color="text-blue-700" bg="bg-blue-50" />
          <StatCard icon={TrendingUp} label="In Progress" value={summary.status_breakdown.in_progress}
            sub="Across departments" color="text-indigo-700" bg="bg-indigo-50" />
          <StatCard icon={CheckCircle2} label="Sanctioned" value={summary.status_breakdown.completed}
            sub="Benefits approved" color="text-emerald-700" bg="bg-emerald-50" />
          <StatCard icon={Bell} label="Unread Alerts" value={summary.unread_notifications}
            sub={summary.action_required ? "Action needed!" : "All caught up"}
            color={summary.action_required ? "text-amber-700" : "text-slate-500"} bg={summary.action_required ? "bg-amber-50" : "bg-slate-50"} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Applications list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Your Active Applications</h2>
              <p className="text-[10px] text-slate-500 mt-0.5">Live cross-department pipeline tracking — auto-refreshes every 8s</p>
            </div>
            <div className="flex items-center gap-2">
              <LivePulse active={liveConnected} />
              <button onClick={loadData} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1,2].map(i => (
                <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse h-40" />
              ))}
            </div>
          ) : applications.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center shadow-sm">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <FileText className="w-6 h-6 text-slate-400" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm mb-1">No Applications Yet</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto mb-5">
                Apply for government schemes with one-click consent. You will receive a Universal Application ID to track your entire journey cross-department.
              </p>
              <Link to="/services"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-950 text-white rounded-xl text-xs font-bold hover:bg-blue-900 transition-colors">
                Browse Services Catalog <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <>
              {/* Rework apps first (urgent) */}
              {reworkApps.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-700">
                    <AlertTriangle className="w-3.5 h-3.5" /> Action Required ({reworkApps.length})
                  </div>
                  {reworkApps.map(app => <ApplicationCard key={app.id} app={app} onRefresh={loadData} />)}
                </div>
              )}

              {/* In-progress */}
              {inProgressApps.length > 0 && (
                <div className="space-y-3">
                  {reworkApps.length > 0 && (
                    <div className="flex items-center gap-2 text-xs font-bold text-blue-700">
                      <Clock className="w-3.5 h-3.5" /> In Progress ({inProgressApps.length})
                    </div>
                  )}
                  {inProgressApps.map(app => <ApplicationCard key={app.id} app={app} onRefresh={loadData} />)}
                </div>
              )}

              {/* Completed */}
              {completedApps.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Sanctioned ({completedApps.length})
                  </div>
                  {completedApps.map(app => <ApplicationCard key={app.id} app={app} onRefresh={loadData} />)}
                </div>
              )}
            </>
          )}
        </div>

        {/* Right: Quick actions + info */}
        <div className="space-y-4">
          {/* Quick Actions */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-bold text-slate-900">Quick Actions</span>
            </div>
            <div className="divide-y divide-slate-100">
              {QUICK_ACTIONS.map((action) => {
                const Icon = action.icon;
                return (
                  <Link key={action.label} to={action.to}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors group">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      action.color.includes("bg-blue-950") ? "bg-blue-950" : "bg-slate-100"
                    }`}>
                      <Icon className={`w-3.5 h-3.5 ${action.color.includes("bg-blue-950") ? "text-amber-400" : "text-slate-600"}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-800 group-hover:text-blue-700 transition-colors">{action.label}</div>
                      <div className="text-[10px] text-slate-400 truncate">{action.sub}</div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Platform trust indicators */}
          <div className="bg-slate-900 rounded-2xl p-5 text-white">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-white">Security & Privacy</span>
            </div>
            <div className="space-y-2.5">
              {[
                { label: "End-to-End Encrypted", icon: Lock },
                { label: "DPDP Act 2023 Compliant", icon: Shield },
                { label: "W3C Verifiable Credentials", icon: Award },
                { label: "Zero Duplicate Data Stores", icon: CheckCircle2 },
                { label: "Single Consent — All Depts", icon: BarChart3 },
              ].map(({ label, icon: Icon }) => (
                <div key={label} className="flex items-center gap-2 text-[10px] text-slate-300">
                  <Icon className="w-3 h-3 text-emerald-400 shrink-0" />
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* Latest notification shortcut */}
          {summary?.unread_notifications > 0 && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Bell className="w-3.5 h-3.5 text-indigo-600" />
                <span className="text-xs font-bold text-indigo-900">{summary.unread_notifications} New Notification{summary.unread_notifications > 1 ? "s" : ""}</span>
              </div>
              <p className="text-[10px] text-indigo-600 mb-2">You have unread government service updates.</p>
              <Link to="/citizen/notifications" className="text-[10px] font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-0.5">
                View all <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
