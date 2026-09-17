import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import {
  Flame, ShieldAlert, CheckCircle2, AlertTriangle, RefreshCw,
  Zap, Activity, RotateCcw, ArrowRight, Gauge, Lock, Cpu
} from 'lucide-react';

export const ChaosSimulatorPage: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [triggeringId, setTriggeringId] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const [lastActionMessage, setLastActionMessage] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await api.getChaosStatus();
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleTriggerChaos = async (experimentId: string) => {
    setTriggeringId(experimentId);
    setLastActionMessage(null);
    try {
      const res = await api.triggerChaosExperiment(experimentId, 'HIGH');
      setLastActionMessage(res.telemetry_message);
      await fetchStatus();
    } catch (e: any) {
      alert('Chaos injection failed: ' + e.message);
    } finally {
      setTriggeringId(null);
    }
  };

  const handleResetBaseline = async () => {
    setResetting(true);
    setLastActionMessage(null);
    try {
      const res = await api.resetChaosBaseline();
      setLastActionMessage(res.message);
      await fetchStatus();
    } catch (e: any) {
      alert('Reset failed: ' + e.message);
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  const state = data?.state;
  const isHealthy = !state?.active_experiment;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold tracking-wide uppercase mb-3">
            <Flame className="w-3.5 h-3.5 text-red-600" />
            ChaosSetu — Resilience Stress Testing
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
            Interoperability Chaos & Self-Healing Console
          </h1>
          <p className="mt-2 text-base text-slate-600">
            Stress-test MahaSetu's distributed middleware under catastrophic network partitions, latency spikes, schema drift, and burst loads.
          </p>
        </div>

        <button
          onClick={handleResetBaseline}
          disabled={resetting || isHealthy}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors flex items-center gap-2 self-start cursor-pointer disabled:opacity-40 shadow-sm"
        >
          {resetting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
          Restore 100% Nominal Baseline
        </button>
      </div>

      {/* Live System Resilience Telemetry Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] uppercase text-slate-500 font-semibold block mb-1">Circuit Breaker Mode</span>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isHealthy ? 'bg-emerald-500 animate-pulse' : 'bg-red-500 animate-ping'}`} />
            <span className="text-base font-bold text-slate-900">{state?.circuit_breaker_mode}</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Auto-fallback queue active</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] uppercase text-slate-500 font-semibold block mb-1">Injected Network Latency</span>
          <div className="text-2xl font-black text-slate-900">+{state?.injected_latency_ms} ms</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Baseline: 42ms nominal</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] uppercase text-slate-500 font-semibold block mb-1">Schema Drift Guard</span>
          <div className="text-base font-bold text-indigo-700">
            {state?.schema_drift_active ? 'DRIFT ENGAGED (FUZZY MAPPING)' : 'NOMINAL (CANONICAL V1)'}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">AI normalization standby</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] uppercase text-slate-500 font-semibold block mb-1">Resilience Rating</span>
          <div className="text-base font-bold text-emerald-700">{state?.resilience_grade}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Zero data loss architecture</span>
        </div>
      </div>

      {/* Action Notification Banner */}
      {lastActionMessage && (
        <div className="mb-6 p-4 rounded-xl bg-indigo-950 text-indigo-100 text-xs border border-indigo-900 flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-2 font-mono">
            <Activity className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{lastActionMessage}</span>
          </div>
          <span className="text-[10px] text-indigo-300 font-semibold uppercase shrink-0 ml-4">
            Live Telemetry
          </span>
        </div>
      )}

      {/* Chaos Experiment Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {data?.available_experiments?.map((exp: any) => {
          const isActive = state?.active_experiment === exp.id;
          return (
            <div
              key={exp.id}
              className={`rounded-2xl border p-6 transition-all flex flex-col justify-between ${
                isActive
                  ? 'bg-red-50/70 border-red-400 shadow-md ring-1 ring-red-400/40'
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded">
                    {exp.id}
                  </span>
                  <span className="text-xs font-medium text-slate-500">Target: {exp.target}</span>
                </div>

                <h3 className="text-base font-bold text-slate-900 mb-2">{exp.name}</h3>
                <p className="text-xs text-slate-600 mb-3 leading-relaxed">{exp.description}</p>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70 text-[11px] text-slate-700 space-y-1 mb-4">
                  <span className="font-semibold text-slate-900 block text-[10px] uppercase text-indigo-700">
                    Self-Healing Guarantee:
                  </span>
                  <p>{exp.expected_behavior}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">
                  {isActive ? (
                    <span className="text-red-600 font-bold flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5" /> FAULT ACTIVE
                    </span>
                  ) : (
                    'Ready to inject'
                  )}
                </span>

                <button
                  onClick={() => handleTriggerChaos(exp.id)}
                  disabled={triggeringId === exp.id || isActive}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                >
                  {triggeringId === exp.id ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                  )}
                  {isActive ? 'Fault Engaged' : 'Inject Fault'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
