import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import {
  Wheat, Truck, CheckCircle2, RefreshCw, ShoppingBag,
  ShieldCheck, AlertTriangle, Building, Send, Check
} from 'lucide-react';

export const PDSRationOptimizerPage: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFpsId, setSelectedFpsId] = useState('FPS-AUR-PAITHAN-02');
  const [replenishQuintals, setReplenishQuintals] = useState(150.0);
  const [dispatching, setDispatching] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<any | null>(null);

  const fetchFPSNodes = async () => {
    try {
      const res = await api.getPDSRationNodes();
      setData(res);
      if (res.shops?.length && !selectedFpsId) {
        setSelectedFpsId(res.shops[0].fps_id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFPSNodes();
  }, []);

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setDispatching(true);
    setDispatchResult(null);
    try {
      const res = await api.dispatchPDSReplenishment({
        fps_id: selectedFpsId,
        replenish_quintals: replenishQuintals
      });
      setDispatchResult(res);
      fetchFPSNodes();
    } catch (e: any) {
      alert('Dispatch failed: ' + e.message);
    } finally {
      setDispatching(false);
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
          <Wheat className="w-3.5 h-3.5 text-amber-600" />
          MahaAnna — Public Distribution System (PDS) Optimizer
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
          PDS Ration &amp; Grain Supply Chain Optimizer
        </h1>
        <p className="mt-2 text-base text-slate-600">
          Real-time grain stock inventory and biometric e-PoS monitoring across Maharashtra's 52,000+ Fair Price Shops (FPS). Prevents stock-outs and grain leakage via predictive warehouse buffer transfers and geofenced RFID convoy dispatch.
        </p>
      </div>

      {/* Top Reserve Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase block mb-1">State Wheat Reserves</span>
          <span className="text-2xl font-black text-amber-700">{data?.total_wheat_reserve_quintals?.toLocaleString()} Quintals</span>
          <p className="text-xs text-slate-500 mt-1">MSWC Silos &amp; Depots</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase block mb-1">State Rice Reserves</span>
          <span className="text-2xl font-black text-emerald-700">{data?.total_rice_reserve_quintals?.toLocaleString()} Quintals</span>
          <p className="text-xs text-slate-500 mt-1">FCI Central Pool Inflow</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase block mb-1">Active Beneficiaries</span>
          <span className="text-2xl font-black text-slate-900">{data?.total_beneficiaries_active?.toLocaleString()} NFSA/PHH</span>
          <p className="text-xs text-emerald-600 mt-1 font-semibold">100% Aadhaar-ePoS Authenticated</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Monitored Fair Price Shops (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-amber-600" />
              Fair Price Shop (FPS) Buffer Health
            </h2>

            <div className="space-y-3">
              {data?.shops?.map((fps: any) => (
                <div
                  key={fps.fps_id}
                  onClick={() => setSelectedFpsId(fps.fps_id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer text-xs space-y-2 ${
                    selectedFpsId === fps.fps_id
                      ? 'border-amber-500 bg-amber-50/50 shadow-sm'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-900">{fps.fps_id}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      fps.buffer_stock_pct < 20 ? 'bg-red-100 text-red-800 animate-pulse' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {fps.stock_status}
                    </span>
                  </div>

                  <div>
                    <span className="font-bold text-slate-900 text-sm">{fps.fps_name}</span>
                    <p className="text-slate-500 text-[11px] mt-0.5">{fps.district} • {fps.beneficiaries_covered} Cardholders</p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-600 pt-1 border-t border-slate-200/60">
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block">Wheat</span>
                      <span className="font-semibold">{fps.wheat_stock_quintals} Qtl</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block">Rice</span>
                      <span className="font-semibold">{fps.rice_stock_quintals} Qtl</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block">e-PoS Sales</span>
                      <span className="font-bold text-indigo-600">{fps.epos_transactions_today} tx</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Replenishment Dispatch Form (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Truck className="w-4 h-4 text-amber-500" />
              Automated Warehouse Convoy Dispatcher
            </h3>

            <form onSubmit={handleDispatch} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">Target FPS Node</label>
                <select
                  value={selectedFpsId}
                  onChange={(e) => setSelectedFpsId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                >
                  {data?.shops?.map((fps: any) => (
                    <option key={fps.fps_id} value={fps.fps_id}>
                      {fps.fps_name} ({fps.district})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                  Replenishment Volume (Quintals)
                </label>
                <input
                  type="number"
                  value={replenishQuintals}
                  onChange={(e) => setReplenishQuintals(parseFloat(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={dispatching}
                className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {dispatching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
                Dispatch Geofenced Grain Transport Convoy
              </button>
            </form>
          </div>

          {/* Dispatch Result Drawer */}
          {dispatchResult && (
            <div className="bg-slate-900 text-white rounded-2xl border border-amber-500/40 shadow-xl p-6 space-y-4 animate-in fade-in duration-300 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-amber-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> GRAIN CONVOY EN ROUTE
                </span>
                <span className="font-mono text-[10px] text-slate-400">{dispatchResult.convoy_id}</span>
              </div>

              <div>
                <span className="text-[10px] uppercase text-slate-400 block">Destination Depository</span>
                <p className="font-bold text-white text-sm mt-0.5">{dispatchResult.fps_name}</p>
                <p className="text-xs text-amber-300 mt-0.5">Dispatched: {dispatchResult.dispatched_grain_quintals} Quintals</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Vehicle No</span>
                  <span className="text-xs font-mono font-bold text-white">{dispatchResult.truck_tracking_vehicle_no}</span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Estimated ETA</span>
                  <span className="text-xs font-bold text-emerald-400">{dispatchResult.eta_hours} Hours</span>
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-300">
                <span className="text-[10px] text-slate-400 block uppercase mb-0.5">Anti-Diversion Security</span>
                <span className="font-mono text-xs text-amber-400">{dispatchResult.anti_diversion_seal}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
