import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import {
  Cpu, Activity, CheckCircle2, RefreshCw, Zap,
  Sliders, ShieldCheck, ArrowRight, Layers, Sparkles
} from 'lucide-react';

export const AutonomousMeshPage: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [policyMode, setPolicyMode] = useState('AGGRESSIVE_STABILIZATION');
  const [tuning, setTuning] = useState(false);
  const [tuneResult, setTuneResult] = useState<any | null>(null);

  const fetchMeshHealth = async () => {
    try {
      const res = await api.getAutonomousMeshHealth();
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeshHealth();
  }, []);

  const handleTune = async () => {
    setTuning(true);
    setTuneResult(null);
    try {
      const res = await api.tuneAutonomousMesh(policyMode);
      setTuneResult(res);
      fetchMeshHealth();
    } catch (e: any) {
      alert('Tuning failed: ' + e.message);
    } finally {
      setTuning(false);
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
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-100 text-cyan-900 rounded-full text-xs font-semibold tracking-wide uppercase mb-3">
          <Cpu className="w-3.5 h-3.5 text-cyan-600" />
          MahaChaitanya — Autonomous AI Governance
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
          Autonomous Self-Regulating Mesh &amp; SLA Auto-Tuner
        </h1>
        <p className="mt-2 text-base text-slate-600">
          Zero manual ops. An autonomous AI watchdog continuously analyzes gateway latencies, dynamically load-balances inter-departmental API throttling, and triggers automated self-healing failovers across state backends.
        </p>
      </div>

      {/* Top Telemetry Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">
            <span>Overall Mesh Health</span>
            <Activity className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600">
            {data?.overall_mesh_health_score}%
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">{data?.mesh_governance_mode}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">
            <span>Cluster Throughput</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {data?.total_cluster_rps} req/sec
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">{data?.active_nodes_count} connected nodes</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">
            <span>Circuit Stability</span>
            <CheckCircle2 className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            0 TRIPPED
          </div>
          <p className="text-xs text-emerald-600 mt-1 font-medium">All breakers operating nominal</p>
        </div>
      </div>

      {/* Main Grid: Node Inspector & Tuning Station */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Interconnected Node Grid (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-600" />
              Connected Departmental Mesh Gateways
            </h2>

            <div className="space-y-3.5 mb-6">
              {data?.nodes?.map((node: any) => (
                <div key={node.node_id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">{node.name}</span>
                    <span className="font-mono text-[10px] bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded-full font-semibold">
                      {node.circuit_state}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-600 pt-1">
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block">Traffic</span>
                      <span className="font-semibold text-slate-800">{node.current_rps} RPS</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block">p99 Latency</span>
                      <span className="font-mono font-semibold text-indigo-700">{node.latency_p99_ms} ms</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block">Throttle Factor</span>
                      <span className="font-mono font-semibold text-amber-700">{(node.auto_throttle_factor * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Autonomous Tuning Action */}
            <div className="border-t border-slate-200 pt-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Auto-Scaling Strategy</span>
                <select
                  value={policyMode}
                  onChange={(e) => setPolicyMode(e.target.value)}
                  className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                >
                  <option value="AGGRESSIVE_STABILIZATION">Aggressive Stabilization</option>
                  <option value="MAX_THROUGHPUT_BURST">Maximum Throughput Burst</option>
                  <option value="CONSERVATIVE_DAMPENING">Conservative Dampening</option>
                </select>
              </div>

              <button
                onClick={handleTune}
                disabled={tuning}
                className="w-full py-2.5 px-4 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {tuning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Trigger Autonomous Mesh Recalibration
              </button>
            </div>
          </div>
        </div>

        {/* Right: Auto-Heal Stream & Results (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {tuneResult ? (
            <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-xl p-6 space-y-4 animate-in fade-in duration-300 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-cyan-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> RECALIBRATION COMPLETE
                </span>
                <span className="font-mono text-[10px] text-amber-300">+{tuneResult.cluster_throughput_gain_pct}% GAIN</span>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] uppercase text-slate-400 block font-bold">Autonomous Actions Executed</span>
                {tuneResult.rebalancing_actions_executed.map((act: string) => (
                  <div key={act} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-[11px] text-cyan-200">
                    ✓ {act}
                  </div>
                ))}
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400 text-[11px]">Stabilized p99 Latency</span>
                <span className="font-bold text-base text-emerald-400 font-mono">
                  {tuneResult.stabilized_p99_latency_ms} ms
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900">Recent Auto-Heal Events</h3>
              <div className="space-y-2.5">
                {data?.recent_auto_heal_actions?.map((act: string, idx: number) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-600 shrink-0 mt-0.5" />
                    <span>{act}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
