import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import {
  Sun, Zap, CheckCircle2, RefreshCw, Activity,
  Tractor, ShieldCheck, Check, Sparkles, Sliders
} from 'lucide-react';

export const SolarFeederGridPage: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFeederId, setSelectedFeederId] = useState('FEEDER-SOLAR-JAL-BHOKAR-02');
  const [optimizing, setOptimizing] = useState(false);
  const [optResult, setOptResult] = useState<any | null>(null);

  const fetchFeeders = async () => {
    try {
      const res = await api.getSolarFeeders();
      setData(res);
      if (res.feeders?.length && !selectedFeederId) {
        setSelectedFeederId(res.feeders[0].feeder_id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeeders();
  }, []);

  const handleOptimize = async () => {
    setOptimizing(true);
    setOptResult(null);
    try {
      const res = await api.optimizeSolarFeeder(selectedFeederId);
      setOptResult(res);
      fetchFeeders();
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
          MahaVidyut — Solar Agricultural Feeder Balancer (MSKVY 2.0)
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
          Agricultural Solar Feeder &amp; Daytime Irrigation Grid
        </h1>
        <p className="mt-2 text-base text-slate-600">
          Smart load balancing across Maharashtra's 7,000 MW Mukhyamantri Saur Krushi Vahini Yojana (MSKVY 2.0). Guarantees reliable daytime solar power to rural agricultural pumps while dynamically forecasting substation feeder loads.
        </p>
      </div>

      {/* Top Feeder Macro Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase block mb-1">Installed Solar Feeder Capacity</span>
          <span className="text-2xl font-black text-amber-600">{data?.total_installed_solar_mw} MW</span>
          <p className="text-xs text-slate-500 mt-1">MSKVY 2.0 Dedicated Substations</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase block mb-1">Live Generation</span>
          <span className="text-2xl font-black text-emerald-600">{data?.live_solar_generation_mw} MW</span>
          <p className="text-xs text-slate-500 mt-1">Real-time Inverter Telemetry</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase block mb-1">Active Agricultural Pumps</span>
          <span className="text-2xl font-black text-slate-900">{data?.total_farmers_irrigating?.toLocaleString()} Farmers</span>
          <p className="text-xs text-emerald-600 mt-1 font-semibold">100% Day-Time Solar Irrigation</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Solar Feeders (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-600" />
              Rural 33/11kV Dedicated Solar Feeders
            </h2>

            <div className="space-y-3">
              {data?.feeders?.map((f: any) => (
                <div
                  key={f.feeder_id}
                  onClick={() => setSelectedFeederId(f.feeder_id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer text-xs space-y-2 ${
                    selectedFeederId === f.feeder_id
                      ? 'border-amber-500 bg-amber-50/50 shadow-sm'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-900">{f.feeder_id}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      f.feeder_status.includes('REQUIRED') ? 'bg-amber-100 text-amber-800 animate-pulse' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {f.feeder_status}
                    </span>
                  </div>

                  <div>
                    <span className="font-bold text-slate-900 text-sm">{f.substation_name}</span>
                    <p className="text-slate-500 text-[11px] mt-0.5">{f.district} • {f.connected_farmer_pumps} Pumps</p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-600 pt-1 border-t border-slate-200/60">
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block">Capacity</span>
                      <span className="font-semibold">{f.solar_capacity_mw} MW</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block">Generation</span>
                      <span className="font-bold text-amber-600">{f.current_generation_mw} MW</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block">Daylight Power</span>
                      <span className="font-bold text-emerald-600">{f.daytime_power_hours_delivered} hrs</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleOptimize}
              disabled={optimizing}
              className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {optimizing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sliders className="w-4 h-4 text-amber-400" />}
              Balance Feeder &amp; Guarantee 8-Hour Daytime Solar Feed
            </button>
          </div>
        </div>

        {/* Right: Optimization Drawer (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          {optResult ? (
            <div className="bg-slate-900 text-white rounded-2xl border border-amber-500/40 shadow-xl p-6 space-y-4 animate-in fade-in duration-300 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-amber-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> FEEDER LOAD STABILIZED
                </span>
                <span className="font-mono text-[10px] text-slate-400">{optResult.optimization_token}</span>
              </div>

              <div>
                <span className="text-[10px] uppercase text-slate-400 block">Optimized Substation</span>
                <p className="font-bold text-white text-base mt-0.5">{optResult.substation_name}</p>
                <p className="text-xs text-amber-300 mt-0.5">Guaranteed Daytime Irrigation: {optResult.guaranteed_daytime_hours} Hours</p>
              </div>

              <div className="p-3 bg-emerald-950/60 rounded-xl border border-emerald-800 text-[11px] text-emerald-200 space-y-1">
                <span className="text-[10px] uppercase text-emerald-400 block font-semibold">Farmer SMS Broadcast</span>
                <p className="font-bold">{optResult.farmer_alert}</p>
              </div>

              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-[10px] text-slate-400">
                Grid Safety: {optResult.transformer_trip_risk}
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-8 text-center space-y-3">
              <Sun className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-700">Feeder Balancer Standby</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Select an agricultural solar feeder to review generation metrics and execute automated dynamic reactive load balancing to guarantee daytime power for farmers.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
