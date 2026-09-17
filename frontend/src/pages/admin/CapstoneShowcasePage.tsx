import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import {
  Award, Sparkles, CheckCircle2, RefreshCw, Zap,
  Play, Layers, ArrowRight, ShieldCheck, Check, Globe
} from 'lucide-react';

export const CapstoneShowcasePage: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [runningE2E, setRunningE2E] = useState(false);
  const [e2eResult, setE2eResult] = useState<any | null>(null);

  const fetchSummary = async () => {
    try {
      const res = await api.getCapstoneSummary();
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const handleRunE2E = async () => {
    setRunningE2E(true);
    setE2eResult(null);
    try {
      const res = await api.runCapstoneEndToEnd();
      setE2eResult(res);
    } catch (e: any) {
      alert('End-to-end simulation failed: ' + e.message);
    } finally {
      setRunningE2E(false);
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
      {/* Header */}
      <div className="mb-8 bg-gradient-to-r from-amber-950 via-slate-900 to-indigo-950 text-white p-8 rounded-3xl border border-amber-500/40 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-400 text-slate-950 rounded-full text-xs font-black tracking-wide uppercase mb-3">
              <Award className="w-4 h-4 text-slate-950" />
              SMART INDIA HACKATHON — PROBLEM STATEMENT 26129
            </div>
            <h1 className="text-3xl font-black tracking-tight sm:text-5xl text-white">
              MAHASETU v10 ENTERPRISE PINNACLE
            </h1>
            <p className="mt-2 text-sm text-slate-300 max-w-2xl leading-relaxed">
              Unified Interoperability Layer for the Government of Maharashtra. Delivering end-to-end sovereignty across 10 complete phases: from Canonical Schema transformations and ZKP digital wallets to disaster surge relief and the Chief Minister's Executive War Room.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <button
              onClick={handleRunE2E}
              disabled={runningE2E}
              className="w-full sm:w-auto px-6 py-4 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-sm rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
            >
              {runningE2E ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-slate-950" />}
              Execute Full Platform End-to-End Simulation
            </button>
          </div>
        </div>
      </div>

      {/* Live Simulation Trace Result Banner */}
      {e2eResult && (
        <div className="mb-8 bg-slate-900 text-white rounded-3xl border border-amber-500/30 p-6 shadow-2xl animate-in fade-in duration-300 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              <div>
                <h3 className="text-base font-black text-white">END-TO-END PLATFORM SIMULATION COMPLETE</h3>
                <span className="font-mono text-xs text-amber-400">{e2eResult.simulation_application_id}</span>
              </div>
            </div>
            <span className="text-xs font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-3 py-1 rounded-full">
              TOTAL LATENCY: {e2eResult.execution_duration_ms} ms (8 MODULES EXECUTED)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {e2eResult.pipeline_steps?.map((st: any) => (
              <div key={st.step} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-amber-400">Step {st.step}</span>
                  <span className="font-mono text-slate-400">{st.latency_ms}ms</span>
                </div>
                <p className="font-bold text-white text-xs">{st.module}</p>
                <span className="text-[10px] text-emerald-400 font-mono block">✓ {st.status}</span>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Transaction Digest: {e2eResult.global_transaction_digest.slice(0, 32)}...</span>
            <span className="font-bold text-emerald-400">{e2eResult.verdict}</span>
          </div>
        </div>
      )}

      {/* 10-Phase Architectural Matrix Grid */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-600" />
          Complete 10-Phase Architecture Matrix
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {data?.phases?.map((p: any) => (
            <div key={p.phase} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2.5 hover:border-amber-400 transition-colors">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
                  {p.phase}
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>

              <h3 className="text-base font-bold text-slate-900">{p.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{p.focus}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Key Architectural Highlights Strip */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 mb-4">Empirical Platform Outcomes</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="font-bold text-indigo-600 block mb-0.5">Turnaround Speed</span>
            <p className="text-slate-700">{data?.key_achievements?.turnaround_reduction}</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="font-bold text-indigo-600 block mb-0.5">Unified Model</span>
            <p className="text-slate-700">{data?.key_achievements?.zero_redundancy}</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="font-bold text-indigo-600 block mb-0.5">Statutory Standard</span>
            <p className="text-slate-700">{data?.key_achievements?.statutory_compliance}</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="font-bold text-indigo-600 block mb-0.5">Eco Sustainability</span>
            <p className="text-slate-700">{data?.key_achievements?.paperless_eco_savings}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
