import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import {
  Sliders, TrendingUp, Users, DollarSign, Activity,
  Clock, ShieldAlert, CheckCircle2, Sparkles, RefreshCw
} from 'lucide-react';

export const PolicySimulatorPage: React.FC = () => {
  const [schemeId, setSchemeId] = useState('farmer-dbt');
  const [incomeCeiling, setIncomeCeiling] = useState(250000);
  const [districtsCount, setDistrictsCount] = useState(36);
  const [slaTargetHours, setSlaTargetHours] = useState(72);
  const [includeLegacy, setIncludeLegacy] = useState(true);

  const [result, setResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const runSimulation = async () => {
    setLoading(true);
    try {
      const data = await api.evaluatePolicyScenario({
        scheme_id: schemeId,
        income_ceiling_inr: incomeCeiling,
        target_districts_count: districtsCount,
        sla_target_hours: slaTargetHours,
        include_legacy_sync: includeLegacy
      });
      setResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runSimulation();
  }, [schemeId, incomeCeiling, districtsCount, slaTargetHours, includeLegacy]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">
          <Sliders className="w-4 h-4 text-amber-600" />
          <span>Predictive Governance &amp; Capacity Modeling</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
          AI Policy Impact &amp; Interop Simulator
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Simulate how altering scheme eligibility criteria impacts beneficiary volumes, department adapter concurrency, and statewide fiscal outlay.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Controls Column */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 text-xs space-y-5">
          <h3 className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-3 flex items-center justify-between">
            <span>Policy Parameters</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </h3>

          {/* Scheme Select */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Select Welfare Scheme
            </label>
            <select
              value={schemeId}
              onChange={(e) => setSchemeId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-slate-50 focus:ring-2 focus:ring-amber-500"
            >
              <option value="employment-support">Maharashtra Employment &amp; Skill Assistance</option>
              <option value="farmer-dbt">MahaDBT Farmer Agricultural Assistance</option>
              <option value="urban-housing">Maharashtra Urban Affordable Housing</option>
              <option value="smart-ration">Unified Food Security &amp; Ration Portability</option>
            </select>
          </div>

          {/* Income Ceiling Slider */}
          <div>
            <div className="flex justify-between mb-1">
              <label className="font-semibold text-slate-700">Income Eligibility Ceiling</label>
              <span className="font-mono font-bold text-blue-900">₹ {incomeCeiling.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min="100000"
              max="600000"
              step="25000"
              value={incomeCeiling}
              onChange={(e) => setIncomeCeiling(Number(e.target.value))}
              className="w-full accent-amber-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>₹1 Lakh (Strict EWS)</span>
              <span>₹6 Lakh (Expanded LIG)</span>
            </div>
          </div>

          {/* Districts Count Slider */}
          <div>
            <div className="flex justify-between mb-1">
              <label className="font-semibold text-slate-700">Participating Districts</label>
              <span className="font-mono font-bold text-emerald-800">{districtsCount} of 36</span>
            </div>
            <input
              type="range"
              min="1"
              max="36"
              step="1"
              value={districtsCount}
              onChange={(e) => setDistrictsCount(Number(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>Pilot (1-5)</span>
              <span>All Maharashtra (36)</span>
            </div>
          </div>

          {/* SLA Target Hours */}
          <div>
            <div className="flex justify-between mb-1">
              <label className="font-semibold text-slate-700">Statutory SLA Window</label>
              <span className="font-mono font-bold text-purple-900">{slaTargetHours} Hours</span>
            </div>
            <input
              type="range"
              min="12"
              max="168"
              step="12"
              value={slaTargetHours}
              onChange={(e) => setSlaTargetHours(Number(e.target.value))}
              className="w-full accent-purple-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>Fast-track (24h)</span>
              <span>Standard (72h)</span>
              <span>7 Days (168h)</span>
            </div>
          </div>

          {/* Legacy 7/12 Toggle */}
          <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
            <span className="font-semibold text-slate-700">Legacy Mainframe Sync</span>
            <input
              type="checkbox"
              checked={includeLegacy}
              onChange={(e) => setIncludeLegacy(e.target.checked)}
              className="w-4 h-4 accent-amber-600 rounded"
            />
          </div>
        </div>

        {/* Results Column */}
        <div className="lg:col-span-2 space-y-6 text-xs">
          {result && (
            <>
              {/* Projected Impact Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Eligible Citizens</span>
                  <strong className="text-2xl font-black text-slate-900 block mt-1">
                    {result.projections.eligible_beneficiaries_statewide.toLocaleString()}
                  </strong>
                  <span className="text-[10px] text-slate-500 mt-1 block">Projected beneficiaries</span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">State Fiscal Outlay</span>
                  <strong className="text-2xl font-black text-emerald-700 block mt-1">
                    ₹ {result.projections.total_fiscal_outlay_crores} Cr
                  </strong>
                  <span className="text-[10px] text-slate-500 mt-1 block">Budget allocation</span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Peak Concurrency</span>
                  <strong className="text-2xl font-black text-blue-900 font-mono block mt-1">
                    {result.infrastructure_capacity_impact.peak_transactions_per_second} TPS
                  </strong>
                  <span className="text-[10px] text-slate-500 mt-1 block">Transactions / second</span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">SLA Breach Risk</span>
                  <strong
                    className={`text-2xl font-black block mt-1 ${
                      result.infrastructure_capacity_impact.sla_breach_risk_pct > 40 ? 'text-rose-600' : 'text-emerald-700'
                    }`}
                  >
                    {result.infrastructure_capacity_impact.sla_breach_risk_pct}%
                  </strong>
                  <span className="text-[10px] text-slate-500 mt-1 block">Risk of queue delay</span>
                </div>
              </div>

              {/* Adapter Concurrency Distribution */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
                <h4 className="font-bold text-slate-900 text-sm flex items-center justify-between">
                  <span>Federated Adapter Concurrency Distribution</span>
                  <span className="text-slate-500 text-xs font-mono">
                    Daily Packets: {result.infrastructure_capacity_impact.daily_interop_transactions.toLocaleString()}
                  </span>
                </h4>

                <div className="space-y-3">
                  {Object.entries(result.infrastructure_capacity_impact.adapter_load_breakdown).map(([adapter, pct]: [string, any]) => (
                    <div key={adapter} className="space-y-1">
                      <div className="flex justify-between text-[11px] font-mono">
                        <span className="text-slate-700 uppercase">{adapter.replace(/_/g, ' ')}</span>
                        <span className="font-bold text-blue-900">{pct}</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-600 to-amber-500 rounded-full transition-all duration-500"
                          style={{ width: pct }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Policy Recommendation Callout */}
              <div
                className={`p-4 rounded-xl border text-xs leading-relaxed font-semibold flex items-start gap-3 ${
                  result.infrastructure_capacity_impact.sla_breach_risk_pct > 40
                    ? 'bg-amber-50 text-amber-900 border-amber-300'
                    : 'bg-emerald-50 text-emerald-950 border-emerald-300'
                }`}
              >
                {result.infrastructure_capacity_impact.sla_breach_risk_pct > 40 ? (
                  <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                )}
                <div>
                  <span className="block font-bold mb-0.5">Policy Recommendation for Chief Secretary:</span>
                  <span>{result.policy_recommendation}</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
