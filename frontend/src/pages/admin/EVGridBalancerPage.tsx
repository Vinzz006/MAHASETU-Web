import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import {
  Bus, Zap, CheckCircle2, RefreshCw, Sun,
  Leaf, AlertTriangle, Battery, ArrowRight, ShieldCheck, Check
} from 'lucide-react';

export const EVGridBalancerPage: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedHubId, setSelectedHubId] = useState('HUB-BEST-MUM-WADALA-01');
  const [balancing, setBalancing] = useState(false);
  const [balanceResult, setBalanceResult] = useState<any | null>(null);

  const fetchHubs = async () => {
    try {
      const res = await api.getEVChargingHubs();
      setData(res);
      if (res.hubs?.length && !selectedHubId) {
        setSelectedHubId(res.hubs[0].hub_id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHubs();
  }, []);

  const handleBalance = async () => {
    setBalancing(true);
    setBalanceResult(null);
    try {
      const res = await api.balanceEVGridLoad(selectedHubId);
      setBalanceResult(res);
      fetchHubs();
    } catch (e: any) {
      alert('Balancing failed: ' + e.message);
    } finally {
      setBalancing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-900 rounded-full text-xs font-semibold tracking-wide uppercase mb-3">
          <Bus className="w-3.5 h-3.5 text-emerald-600" />
          MahaGati — Clean EV Fleet &amp; Smart Charging Grid
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
          State-Wide EV Fleet Charging Grid Balancer
        </h1>
        <p className="mt-2 text-base text-slate-600">
          Smart power grid balancing across Maharashtra's 10,000+ electric buses (MSRTC Shivai, BEST, PMPML). Synchronizes heavy depot megawatt chargers with rooftop solar generation and shifts demand to prevent Mahadiscom transformer overloads.
        </p>
      </div>

      {/* Top Grid Macro Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-xl mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest block mb-1">
            Total Carbon Abatement (Clean Kilometers)
          </span>
          <span className="text-3xl font-black text-white">
            {data?.total_co2_abated_tonnes} Metric Tonnes CO2 Saved
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="bg-slate-950/80 px-4 py-2 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase">Active E-Buses Charging</span>
            <span className="text-base font-bold text-amber-300">
              {data?.total_electric_buses_charging} Buses
            </span>
          </div>
          <div className="bg-slate-950/80 px-4 py-2 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase">Aggregate Load</span>
            <span className="text-base font-bold text-emerald-400">
              {data?.aggregate_grid_load_kva} kVA
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Charging Hubs (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-600" />
              Major Electric Bus Depot Terminals
            </h2>

            <div className="space-y-3">
              {data?.hubs?.map((hub: any) => (
                <div
                  key={hub.hub_id}
                  onClick={() => setSelectedHubId(hub.hub_id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer text-xs space-y-2 ${
                    selectedHubId === hub.hub_id
                      ? 'border-emerald-500 bg-emerald-50/50 shadow-sm'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-900">{hub.hub_id}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      hub.peak_shaving_status.includes('STRESS') ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {hub.peak_shaving_status}
                    </span>
                  </div>

                  <div>
                    <span className="font-bold text-slate-900 text-sm">{hub.depot_name}</span>
                    <p className="text-slate-500 text-[11px] mt-0.5">{hub.operator} • {hub.city}</p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-600 pt-1 border-t border-slate-200/60">
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block">E-Buses</span>
                      <span className="font-bold text-slate-900">{hub.connected_ev_buses} units</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block">Grid Load</span>
                      <span className="font-semibold text-amber-600">{hub.grid_load_kva} kVA</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block">Solar PV</span>
                      <span className="font-bold text-emerald-600">{hub.solar_rooftop_generation_kw} kW</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleBalance}
              disabled={balancing}
              className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {balancing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 text-emerald-400" />}
              Apply Smart Grid Peak-Shaving Balancing
            </button>
          </div>
        </div>

        {/* Right: Grid Balancing Result (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          {balanceResult ? (
            <div className="bg-slate-900 text-white rounded-2xl border border-emerald-500/40 shadow-xl p-6 space-y-4 animate-in fade-in duration-300 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> GRID LOAD BALANCED
                </span>
                <span className="font-mono text-[10px] text-slate-400">{balanceResult.dispatch_job_id}</span>
              </div>

              <div>
                <span className="text-[10px] uppercase text-slate-400 block">Optimized Depot</span>
                <p className="font-bold text-white text-sm mt-0.5">{balanceResult.depot_name}</p>
                <p className="text-xs text-emerald-300 mt-0.5">Profile: {balanceResult.optimized_charging_profile}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Shaved Peak Demand</span>
                  <span className="text-base font-bold text-amber-400">-{balanceResult.shaved_peak_demand_kva} kVA</span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">New Grid Demand</span>
                  <span className="text-base font-bold text-emerald-400">{balanceResult.new_grid_load_kva} kVA</span>
                </div>
              </div>

              <div className="p-3 bg-emerald-950/60 rounded-xl border border-emerald-800 text-[11px] text-emerald-200">
                <p className="font-bold mb-0.5">Substation Transformer Health</p>
                <p className="text-[10px] text-emerald-300/90">{balanceResult.transformer_health_score}</p>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-8 text-center space-y-3">
              <Bus className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-700">Grid Balancer Standby</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Select an EV bus depot terminal to analyze megawatt charging load and execute smart peak-shaving to protect district electrical substations.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
