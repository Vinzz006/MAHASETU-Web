import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import {
  Crown, TrendingUp, ShieldCheck, RefreshCw, BarChart3,
  CheckCircle2, MapPin, IndianRupee, Users, Clock, Zap, Sliders
} from 'lucide-react';

export const ExecutiveWarRoomPage: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [budgetMultiplier, setBudgetMultiplier] = useState(1.25);
  const [incomeExpansion, setIncomeExpansion] = useState(15);
  const [targetSLA, setTargetSLA] = useState(2);
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState<any | null>(null);

  const fetchMacroPulse = async () => {
    try {
      const res = await api.getWarRoomMacroPulse();
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMacroPulse();
  }, []);

  const handleSimulate = async () => {
    setSimulating(true);
    setSimResult(null);
    try {
      const res = await api.simulatePolicyShift({
        welfare_budget_multiplier: budgetMultiplier,
        income_ceiling_expansion_pct: incomeExpansion,
        fast_track_sla_days: targetSLA
      });
      setSimResult(res);
    } catch (e: any) {
      alert('Policy simulation failed: ' + e.message);
    } finally {
      setSimulating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  const metrics = data?.statewide_macro_metrics;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
      {/* Header */}
      <div className="mb-8 bg-gradient-to-r from-slate-900 via-[#0f2942] to-slate-900 text-white p-6 rounded-3xl border border-amber-500/30 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full text-xs font-semibold tracking-wide uppercase mb-2 border border-amber-500/30">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              Chief Minister's Executive War Room (MahaDrishti)
            </div>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl text-white">
              Statewide Macro Governance &amp; Policy Command Room
            </h1>
            <p className="mt-1 text-xs text-slate-300 max-w-2xl leading-relaxed">
              Real-time delivery pulse for the Chief Minister &amp; Chief Secretary of Maharashtra. Tracking all 36 districts across Konkan, Western Maharashtra, Marathwada, Vidarbha, and Khandesh.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-slate-950/80 px-4 py-2.5 rounded-2xl border border-amber-500/20 text-center">
              <span className="text-[10px] text-slate-400 block uppercase">Average Turnaround</span>
              <span className="text-lg font-black text-amber-400">{metrics?.average_turnaround_time_days} Days</span>
              <span className="text-[10px] text-emerald-400 block">{metrics?.turnaround_velocity_improvement_pct}% Faster</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top 4 Macro KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">
            <span>Citizens Served</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {(metrics?.total_citizen_transactions_processed || 0).toLocaleString()}
          </div>
          <p className="text-xs text-emerald-600 mt-1 font-medium">Cumulative lifetime processed</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">
            <span>Direct Funds Disbursed</span>
            <IndianRupee className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700">
            ₹{metrics?.total_direct_benefit_disbursed_crores?.toLocaleString()} Cr
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">100% Aadhaar APBS credited</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">
            <span>SLA Compliance</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {metrics?.statewide_sla_compliance_pct}%
          </div>
          <p className="text-xs text-emerald-600 mt-1 font-medium">Zero statutory breach tolerance</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">
            <span>Monitored Divisions</span>
            <MapPin className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {metrics?.total_divisions_monitored} Regions
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">36 Collectorates connected</p>
        </div>
      </div>

      {/* Main Grid: Regional Heatmap (7 cols) + Policy Shift Simulator (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Regional Performance Grid (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-600" />
                Regional Division Performance Matrix
              </h2>
              <span className="text-xs font-semibold text-slate-500">Live Telemetry</span>
            </div>

            <div className="p-4 space-y-3.5">
              {data?.regional_breakdown?.map((reg: any) => (
                <div key={reg.division_name} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900">{reg.division_name}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      reg.status === 'EXEMPLARY_GREEN' ? 'bg-emerald-100 text-emerald-800' :
                      reg.status === 'OPTIMAL_GREEN' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {reg.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs pt-1">
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block">Applications</span>
                      <span className="font-semibold text-slate-800">{reg.active_applications.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block">Funds Disbursed</span>
                      <span className="font-semibold text-emerald-700">₹{reg.disbursed_funds_cr} Cr</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block">SLA Compliance</span>
                      <span className="font-bold text-indigo-700">{reg.sla_compliance_pct}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Policy Shift Simulator (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-500" />
              Executive Policy Shift Simulator
            </h2>

            <p className="text-xs text-slate-600 leading-relaxed">
              Model the fiscal and operational impact of expanding state welfare eligibility parameters and tightening delivery turnaround targets.
            </p>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Welfare Budget Multiplier</span>
                  <span className="font-mono text-amber-600">{budgetMultiplier}x</span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="2.0"
                  step="0.05"
                  value={budgetMultiplier}
                  onChange={(e) => setBudgetMultiplier(parseFloat(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Income Ceiling Expansion</span>
                  <span className="font-mono text-amber-600">+{incomeExpansion}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="5"
                  value={incomeExpansion}
                  onChange={(e) => setIncomeExpansion(parseInt(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Fast-Track SLA Target</span>
                  <span className="font-mono text-amber-600">{targetSLA} Days</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="1"
                  value={targetSLA}
                  onChange={(e) => setTargetSLA(parseInt(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>
            </div>

            <button
              onClick={handleSimulate}
              disabled={simulating}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {simulating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4 text-amber-400" />}
              Model Macroeconomic Impact
            </button>

            {/* Simulation Results */}
            {simResult && (
              <div className="bg-slate-950 text-white rounded-2xl p-5 border border-slate-800 shadow-xl space-y-3 animate-in fade-in duration-300 text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-bold text-amber-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> PROJECTION CALCULATED
                  </span>
                  <span className="text-[10px] text-slate-400">FEASIBLE</span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">New Beneficiaries</span>
                    <span className="text-base font-bold text-white">
                      +{simResult.projected_impacts.additional_citizens_covered.toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Additional Outlay</span>
                    <span className="text-base font-bold text-emerald-400">
                      ₹{simResult.projected_impacts.projected_additional_fiscal_outlay_cr} Cr
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-emerald-300 bg-emerald-950/70 p-2.5 rounded border border-emerald-800">
                  {simResult.projected_impacts.feasibility_verdict}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
