import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import {
  Users, RefreshCw, CheckCircle2, ArrowRight, ShieldAlert,
  Sliders, Zap, AlertTriangle, TrendingUp, Sparkles, Building
} from 'lucide-react';

export const WorkforceRebalancerPage: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [priority, setPriority] = useState('MAX_EQUALIZATION');
  const [rebalancing, setRebalancing] = useState(false);
  const [planResult, setPlanResult] = useState<any | null>(null);

  const fetchWorkforce = async () => {
    try {
      const res = await api.getWorkforceOfficerLoad();
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkforce();
  }, []);

  const handleRebalance = async () => {
    setRebalancing(true);
    setPlanResult(null);
    try {
      const res = await api.rebalanceWorkforce(priority);
      setPlanResult(res);
      fetchWorkforce();
    } catch (e: any) {
      alert('Workforce rebalance failed: ' + e.message);
    } finally {
      setRebalancing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-900 rounded-full text-xs font-semibold tracking-wide uppercase mb-3">
          <Users className="w-3.5 h-3.5 text-amber-600" />
          MahaKarma — AI Workforce Optimization
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
          Autonomous Officer Workload Rebalancer
        </h1>
        <p className="mt-2 text-base text-slate-600">
          Eliminate citizen wait times through dynamic workload leveling. When urban desks face application backlogs, MahaKarma autonomously reallocates verification queues to neighboring available officers across taluka boundaries.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Desk Queues & Equalization Trigger (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building className="w-4 h-4 text-indigo-600" />
                Taluka Desk Application Backlogs
              </h2>
              <span className="text-xs text-slate-500 font-semibold">
                Avg: {data?.average_backlog_per_officer} files/desk
              </span>
            </div>

            <div className="space-y-3 mb-6">
              {data?.offices?.map((off: any) => (
                <div key={off.office_id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 text-sm">{off.taluka}</span>
                      <p className="text-[11px] text-slate-500">{off.officer_name}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      off.current_workload_state === 'CRITICAL_SATURATION' ? 'bg-red-100 text-red-800' :
                      off.current_workload_state === 'ELEVATED_BACKLOG' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {off.current_workload_state}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-600 pt-1">
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block">Pending Files</span>
                      <span className="font-black text-sm text-slate-900">{off.pending_files}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block">Daily Velocity</span>
                      <span className="font-semibold text-indigo-700">{off.processing_velocity_per_day} / day</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block">Breach Risk</span>
                      <span className="font-semibold text-red-600">{off.risk_of_sla_breach}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleRebalance}
              disabled={rebalancing}
              className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {rebalancing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Execute AI Autonomous Workload Reallocation
            </button>
          </div>
        </div>

        {/* Right: Reallocation Plan Results (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {planResult ? (
            <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-xl p-6 space-y-4 animate-in fade-in duration-300 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-amber-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> WORKLOAD EQUALIZED
                </span>
                <span className="font-mono text-[10px] text-slate-400">{planResult.reallocation_plan_id}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Files Reassigned</span>
                  <span className="text-base font-bold text-white">
                    {planResult.files_reassigned_count} Files
                  </span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Breaches Prevented</span>
                  <span className="text-base font-bold text-emerald-400">
                    {planResult.projected_sla_breaches_prevented}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] uppercase text-slate-400 block font-bold">Desk File Reallocations</span>
                {planResult.reallocations?.map((r: any, idx: number) => (
                  <div key={idx} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 space-y-0.5">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-white">
                      <span>{r.source} &rarr; {r.destination}</span>
                      <span className="text-amber-400 font-mono">+{r.files_shifted} files</span>
                    </div>
                    <span className="text-[10px] text-emerald-400 block">
                      Estimated Turnaround Saved: ~{r.projected_time_saved_days} days
                    </span>
                  </div>
                ))}
              </div>

              <div className="bg-amber-950/60 p-3 rounded-xl border border-amber-500/30 text-[11px] text-amber-200">
                <p className="font-bold mb-0.5">Efficiency Gain: +{planResult.statewide_desk_efficiency_gain_pct}%</p>
                <p className="text-amber-300/90">
                  Officer queues balanced dynamically. Citizens previously facing multi-day backlog delays will experience immediate review progression.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-8 text-center space-y-3">
              <Users className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-700">Autonomous Leveling Ready</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Trigger the AI rebalancer to shift applications from over-saturated desks in Haveli and Nagpur Rural to available officers in Baramati and Hingna.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
