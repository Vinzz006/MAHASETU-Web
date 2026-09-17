import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import {
  Droplet, Truck, CheckCircle2, RefreshCw, Gauge,
  Waves, AlertTriangle, MapPin, Send, Check
} from 'lucide-react';

export const JalJeevanTelemetryPage: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSensorId, setSelectedSensorId] = useState('JAL-LAT-AUSA-01');
  const [tankerCapacity, setTankerCapacity] = useState(12000);
  const [dispatching, setDispatching] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<any | null>(null);

  const fetchSensors = async () => {
    try {
      const res = await api.getJalJeevanSensors();
      setData(res);
      if (res.sensors?.length && !selectedSensorId) {
        setSelectedSensorId(res.sensors[0].sensor_id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSensors();
  }, []);

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setDispatching(true);
    setDispatchResult(null);
    try {
      const res = await api.dispatchJalJeevanTanker({
        sensor_id: selectedSensorId,
        tanker_capacity_litres: tankerCapacity
      });
      setDispatchResult(res);
      fetchSensors();
    } catch (e: any) {
      alert('Dispatch failed: ' + e.message);
    } finally {
      setDispatching(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <RefreshCw className="w-8 h-8 animate-spin text-sky-500" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-sky-100 text-sky-900 rounded-full text-xs font-semibold tracking-wide uppercase mb-3">
          <Droplet className="w-3.5 h-3.5 text-sky-600" />
          MahaJal — Jal Jeevan Aquifer &amp; Groundwater Telemetry
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
          Aquifer Groundwater &amp; Potable Water Telemetry
        </h1>
        <p className="mt-2 text-base text-slate-600">
          Continuous IoT monitoring of deep groundwater depletion (mbgl) and village tap flow (LPCD) across Marathwada and Vidarbha. Triggers automated GPS-tracked emergency water tanker dispatches to villages facing severe aquifer stress.
        </p>
      </div>

      {/* Top Telemetry Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase block mb-1">Regional Avg Groundwater Depth</span>
          <span className="text-2xl font-black text-red-600">{data?.regional_average_groundwater_mbgl} mbgl</span>
          <p className="text-xs text-slate-500 mt-1">Meters Below Ground Level</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase block mb-1">Avg Potable Tap Supply</span>
          <span className="text-2xl font-black text-sky-700">{data?.regional_average_supply_lpcd} LPCD</span>
          <p className="text-xs text-slate-500 mt-1">National Benchmark: {data?.har_ghar_jal_benchmark_lpcd} LPCD</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase block mb-1">Monitored Watersheds</span>
          <span className="text-2xl font-black text-slate-900">{data?.total_watersheds_monitored} Basins</span>
          <p className="text-xs text-emerald-600 mt-1 font-semibold">100% Real-Time IoT Uplink</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Watershed Sensors (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Gauge className="w-4 h-4 text-sky-600" />
              Active Groundwater &amp; Aquifer Depletion Gauges
            </h2>

            <div className="space-y-3">
              {data?.sensors?.map((s: any) => (
                <div
                  key={s.sensor_id}
                  onClick={() => setSelectedSensorId(s.sensor_id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer text-xs space-y-2 ${
                    selectedSensorId === s.sensor_id
                      ? 'border-sky-500 bg-sky-50/50 shadow-sm'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-900">{s.sensor_id}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      s.drought_stage.includes('CRITICAL') ? 'bg-red-100 text-red-800 animate-pulse' : 'bg-sky-100 text-sky-800'
                    }`}>
                      {s.drought_stage}
                    </span>
                  </div>

                  <div>
                    <span className="font-bold text-slate-900 text-sm">{s.village_name}</span>
                    <p className="text-slate-500 text-[11px] mt-0.5">{s.district} • Population {s.population?.toLocaleString()}</p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-600 pt-1 border-t border-slate-200/60">
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block">Groundwater</span>
                      <span className="font-black text-red-600">{s.groundwater_level_mbgl} mbgl</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block">Tap Supply</span>
                      <span className="font-bold text-sky-700">{s.tap_water_supply_lpcd} LPCD</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block">Soil Moisture</span>
                      <span className="font-semibold text-slate-700">{s.soil_moisture_index}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Emergency Tanker Dispatch (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Truck className="w-4 h-4 text-sky-600" />
              Emergency Potable Water Tanker Route Activator
            </h3>

            <form onSubmit={handleDispatch} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">Target Watershed</label>
                <select
                  value={selectedSensorId}
                  onChange={(e) => setSelectedSensorId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                >
                  {data?.sensors?.map((s: any) => (
                    <option key={s.sensor_id} value={s.sensor_id}>
                      {s.village_name} ({s.district})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                  Tanker Capacity (Litres)
                </label>
                <select
                  value={tankerCapacity}
                  onChange={(e) => setTankerCapacity(parseInt(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                >
                  <option value={10000}>10,000 Litres (Medium Tanker)</option>
                  <option value={12000}>12,000 Litres (Heavy Duty Tanker)</option>
                  <option value={20000}>20,000 Litres (Dual Axle Reservoir Tanker)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={dispatching}
                className="w-full py-3 px-4 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {dispatching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
                Authorize Emergency GPS Potable Water Tanker
              </button>
            </form>
          </div>

          {/* Dispatch Result Drawer */}
          {dispatchResult ? (
            <div className="bg-slate-900 text-white rounded-2xl border border-sky-500/40 shadow-xl p-6 space-y-4 animate-in fade-in duration-300 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-sky-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> POTABLE WATER TANKER DISPATCHED
                </span>
                <span className="font-mono text-[10px] text-slate-400">{dispatchResult.tanker_trip_id}</span>
              </div>

              <div>
                <span className="text-[10px] uppercase text-slate-400 block">Destination Village</span>
                <p className="font-bold text-white text-sm mt-0.5">{dispatchResult.destination_village} ({dispatchResult.district})</p>
                <p className="text-xs text-sky-300 mt-0.5">Payload: {dispatchResult.potable_water_litres?.toLocaleString()} Litres Potable Water</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Tanker No</span>
                  <span className="text-xs font-mono font-bold text-white">{dispatchResult.gps_registered_tanker_no}</span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Estimated Arrival</span>
                  <span className="text-xs font-bold text-emerald-400">{dispatchResult.eta_minutes} Minutes</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 bg-slate-950 p-2 rounded border border-slate-800">
                Source: {dispatchResult.source_reservoir} • {dispatchResult.iot_flow_sensor_verification}
              </p>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-8 text-center space-y-3">
              <Droplet className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-700">Aquifer Relief Standby</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Select a drought-stressed watershed to inspect real-time IoT groundwater depth and authorize an emergency GPS-tracked potable water tanker.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
