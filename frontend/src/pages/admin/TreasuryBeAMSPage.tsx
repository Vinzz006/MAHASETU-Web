import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import {
  Coins, IndianRupee, ShieldCheck, CheckCircle2, RefreshCw,
  TrendingDown, TrendingUp, AlertTriangle, Building, Send, Check
} from 'lucide-react';

export const TreasuryBeAMSPage: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [department, setDepartment] = useState('Agriculture & Farmers Welfare');
  const [schemeCode, setSchemeCode] = useState('SCHEME-PM-KISAN-MH-01');
  const [amountCr, setAmountCr] = useState(25.5);
  const [reconciling, setReconciling] = useState(false);
  const [reconcileResult, setReconcileResult] = useState<any | null>(null);

  const fetchLiquidity = async () => {
    try {
      const res = await api.getTreasuryLiquidityPulse();
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiquidity();
  }, []);

  const handleReconcile = async (e: React.FormEvent) => {
    e.preventDefault();
    setReconciling(true);
    setReconcileResult(null);
    try {
      const res = await api.reconcileTreasurySanction({
        department,
        scheme_code: schemeCode,
        requested_amount_cr: amountCr
      });
      setReconcileResult(res);
      fetchLiquidity();
    } catch (e: any) {
      alert('Sanction reconciliation failed: ' + e.message);
    } finally {
      setReconciling(false);
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
          <Coins className="w-3.5 h-3.5 text-amber-600" />
          MahaNidhi — Treasury &amp; BeAMS Liquidity Auditor
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
          State Consolidated Fund &amp; BeAMS Liquidity Auditor
        </h1>
        <p className="mt-2 text-base text-slate-600">
          Direct synchronization with Maharashtra's Budget Estimation, Allocation &amp; Monitoring System (BeAMS) and Koshwahini. Real-time verification of departmental budget headroom before committing multi-crore public welfare sanctions.
        </p>
      </div>

      {/* Top Macro Exchequer Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-xl mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-amber-400 uppercase tracking-widest block mb-1">
            Consolidated Fund of Maharashtra (Exchequer Reserve)
          </span>
          <span className="text-3xl font-black text-white">
            ₹{data?.state_consolidated_fund_exchequer_balance_cr?.toLocaleString()} Crores
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="bg-slate-950/80 px-4 py-2 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase">Statewide Burn Rate</span>
            <span className="text-base font-bold text-amber-300">
              {data?.beams_macro_summary?.statewide_burn_rate_pct}%
            </span>
          </div>
          <div className="bg-slate-950/80 px-4 py-2 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase">Allocated Headroom</span>
            <span className="text-base font-bold text-emerald-400">
              ₹{data?.beams_macro_summary?.available_headroom_cr?.toLocaleString()} Cr
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Department BeAMS Allocations (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building className="w-4 h-4 text-indigo-600" />
              Departmental Quarterly Budget Heads (BeAMS)
            </h2>

            <div className="space-y-3">
              {data?.department_allocations?.map((dept: any) => (
                <div key={dept.budget_head} className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 text-sm">{dept.department}</span>
                      <p className="text-[11px] font-mono text-slate-500">Head: {dept.budget_head}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      dept.liquidity_status === 'LIQUID_GREEN' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {dept.liquidity_status}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-600 pt-1">
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block">Sanctioned</span>
                      <span className="font-semibold text-slate-900">₹{dept.quarterly_sanction_cr} Cr</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block">Disbursed</span>
                      <span className="font-semibold text-indigo-700">₹{dept.disbursed_to_date_cr} Cr</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block">Headroom</span>
                      <span className="font-bold text-emerald-700">₹{dept.available_headroom_cr} Cr</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Pre-Sanction Liquidity Auditor Form (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-500" />
              Pre-Commitment Sanction Reconciler
            </h3>

            <form onSubmit={handleReconcile} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">Department</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="Agriculture & Farmers Welfare">Agriculture &amp; Farmers Welfare</option>
                  <option value="Social Justice & Special Assistance">Social Justice &amp; Special Assistance</option>
                  <option value="Tribal Development Department">Tribal Development Department</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">Scheme Code</label>
                  <input
                    type="text"
                    value={schemeCode}
                    onChange={(e) => setSchemeCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">Amount (₹ Cr)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={amountCr}
                    onChange={(e) => setAmountCr(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={reconciling}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {reconciling ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Coins className="w-4 h-4 text-amber-400" />}
                Reconcile &amp; Grant Treasury Authorization
              </button>
            </form>
          </div>

          {/* Reconcile Result Box */}
          {reconcileResult && (
            <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 p-6 space-y-3 animate-in fade-in duration-300 text-xs shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> {reconcileResult.status}
                </span>
                <span className="font-mono text-[10px] text-slate-400">{reconcileResult.reconciliation_decision}</span>
              </div>

              <div>
                <span className="text-[10px] uppercase text-slate-400 block mb-0.5">Treasury Authorization Token</span>
                <p className="font-mono text-xs font-bold text-amber-400 bg-slate-950 p-2 rounded border border-slate-800 select-all">
                  {reconcileResult.treasury_authorization_token}
                </p>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-300 pt-1">
                <span>Remaining Headroom: ₹{reconcileResult.remaining_department_headroom_cr} Cr</span>
                <span className="text-emerald-400 font-semibold">{reconcileResult.overdraft_risk}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
