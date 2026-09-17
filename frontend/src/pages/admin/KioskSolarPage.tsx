import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import {
  Sun, Zap, CheckCircle2, RefreshCw, BatteryCharging,
  Radio, Shield, Power, ArrowRight, ShieldCheck, Check
} from 'lucide-react';

export const KioskSolarPage: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedKioskId, setSelectedKioskId] = useState('KIOSK-NAN-DHAD-02');
  const [optimizing, setOptimizing] = useState(false);
  const [optimizeResult, setOptimizeResult] = useState<any | null>(null);

  const fetchTelemetry = async () => {
    try {
      const res = await api.getSolarKioskTelemetry();
      setData(res);
      if (res.kiosks?.length && !selectedKioskId) {
        setSelectedKioskId(res.kiosks[0].kiosk_id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
  }, []);

  const handleOptimize = async () => {
    setOptimizing(true);
    setOptimizeResult(null);
    try {
      const res = await api.optimizeKioskPowerProfile(selectedKioskId);
      setOptimizeResult(res);
      fetchTelemetry();
    } catch (e: any) {
      alert('Optimization failed: ' + e.message);
    } finally {
      setOptimizing(false);
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
          <Sun className="w-3.5 h-3.5 text-amber-600" />
          MahaUrja — Gramin CSC Kiosk Solar Microgrid Telemetry
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
          Off-Grid Rural Kiosk Solar &amp; Battery Telemetry
        </h1>
        <p className="mt-2 text-base text-slate-600">
          Edge power management for remote Common Service Centers (CSCs) in tribal and forest corridors (Gadchiroli, Nandurbar, Melghat). Monitors solar battery charge and throttles edge peripheral power during monsoon cloud deficits.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Monitored Kiosks (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              Off-Grid Tribal Kiosk Nodes
            </h2>

            <div className="space-y-3">
              {data?.kiosks?.map((k: any) => (
                <div
                  key={k.kiosk_id}
                  onClick={() => setSelectedKioskId(k.kiosk_id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer text-xs space-y-2 ${
                    selectedKioskId === k.kiosk_id
                      ? 'border-amber-500 bg-amber-50/50 shadow-sm'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-900">{k.kiosk_id}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      k.battery_soc_pct < 40 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {k.battery_soc_pct}% Battery
                    </span>
                  </div>

                  <div>
                    <span className="font-bold text-slate-900 text-sm">{k.location}</span>
                    <p className="text-slate-500 text-[11px] mt-0.5">{k.district} • {k.power_profile}</p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-600 pt-1 border-t border-slate-200/60">
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block">Solar PV</span>
                      <span className="font-bold text-amber-600">{k.solar_pv_generation_watts} W</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block">Load</span>
                      <span className="font-semibold">{k.inverter_load_watts} W</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block">Offline Queue</span>
                      <span className="font-black text-indigo-700">{k.offline_queued_transactions} tx</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleOptimize}
              disabled={optimizing}
              className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {optimizing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Power className="w-4 h-4" />}
              Activate Ultra-Low Power Edge Conservation Mode
            </button>
          </div>
        </div>

        {/* Right: Optimization Report (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          {optimizeResult ? (
            <div className="bg-slate-900 text-white rounded-2xl border border-amber-500/40 shadow-xl p-6 space-y-4 animate-in fade-in duration-300 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-amber-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> POWER SAVER ENGAGED
                </span>
                <span className="font-mono text-[10px] text-slate-400">{optimizeResult.active_profile}</span>
              </div>

              <div>
                <span className="text-[10px] uppercase text-slate-400 block">Target Kiosk</span>
                <p className="font-bold text-white text-sm mt-0.5">{optimizeResult.location}</p>
                <p className="text-xs text-amber-300 mt-0.5">Extended Runtime: +{optimizeResult.extended_battery_runtime_hours} Hours</p>
              </div>

              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] uppercase text-slate-400 block font-bold">Applied Edge Power Controls</span>
                {optimizeResult.power_saving_actions?.map((act: string, idx: number) => (
                  <p key={idx} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-[11px] text-amber-200">
                    ⚡ {act}
                  </p>
                ))}
              </div>

              <div className="p-3 bg-emerald-950/60 rounded-xl border border-emerald-800 text-[11px] text-emerald-200">
                <p className="font-bold mb-0.5">Offline Queue Security</p>
                <p className="text-[10px] text-emerald-300/90">{optimizeResult.offline_queue_integrity}</p>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-8 text-center space-y-3">
              <Sun className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-700">Microgrid Telemetry Standby</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Select a remote tribal kiosk to evaluate real-time solar generation and trigger low-power conservation profiles ensuring 24x7 offline transaction continuity.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
