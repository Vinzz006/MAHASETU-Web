import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import {
  HeartHandshake, ShieldAlert, CheckCircle2, RefreshCw,
  Navigation, Plane, MapPin, Activity, Radio, Send
} from 'lucide-react';

export const CrisisLogisticsPage: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [sourceNode, setSourceNode] = useState('NODE-RAI-MAHAD-01');
  const [destination, setDestination] = useState('Poladpur Remote Tribal Hamlet');
  const [payloadType, setPayloadType] = useState('EMERGENCY_ANTIVENOM_AND_O_NEG_BLOOD');
  const [dispatching, setDispatching] = useState(false);
  const [corridorResult, setCorridorResult] = useState<any | null>(null);

  const fetchNodes = async () => {
    try {
      const res = await api.getCrisisEvacuationNodes();
      setData(res);
      if (res.active_disaster_mesh_nodes?.length && !sourceNode) {
        setSourceNode(res.active_disaster_mesh_nodes[0].node_id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNodes();
  }, []);

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setDispatching(true);
    setCorridorResult(null);
    try {
      const res = await api.activateCrisisCorridor({
        source_node: sourceNode,
        destination_cluster: destination,
        payload_type: payloadType
      });
      setCorridorResult(res);
    } catch (e: any) {
      alert('Corridor activation failed: ' + e.message);
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
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-100 text-red-900 rounded-full text-xs font-semibold tracking-wide uppercase mb-3">
          <HeartHandshake className="w-3.5 h-3.5 text-red-600" />
          MahaRahat — Crisis Evacuation &amp; Logistics Mesh
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
          Disaster Evacuation Shelters &amp; Medical Drone Mesh
        </h1>
        <p className="mt-2 text-base text-slate-600">
          Real-time humanitarian crisis logistics across coastal Konkan and flood basins. Coordinates NDRF/SDRF shelter occupancies, emergency ICU bed reserves, and activates autonomous DGCA-cleared green corridors for medical drone dispatches.
        </p>
      </div>

      {/* Top Shelter Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase block mb-1">Total Shelter Capacity</span>
          <span className="text-2xl font-black text-slate-900">{data?.total_shelter_capacity?.toLocaleString()} Persons</span>
          <p className="text-xs text-slate-500 mt-1">Across 3 regional crisis bases</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase block mb-1">Current Sheltered Citizens</span>
          <span className="text-2xl font-black text-indigo-700">{data?.current_sheltered_citizens?.toLocaleString()} Evacuated</span>
          <p className="text-xs text-emerald-600 mt-1 font-medium">{data?.available_shelter_headroom?.toLocaleString()} Beds Headroom</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase block mb-1">Available Emergency ICU Beds</span>
          <span className="text-2xl font-black text-red-600">{data?.available_icu_beds} Beds Ready</span>
          <p className="text-xs text-slate-500 mt-1">Staffed with medical officers</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Disaster Evacuation Nodes (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-red-600" />
              Active Cyclone &amp; Flood Relief Shelters
            </h2>

            <div className="space-y-3">
              {data?.active_disaster_mesh_nodes?.map((n: any) => (
                <div key={n.node_id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 text-sm">{n.shelter_name}</span>
                      <p className="text-[11px] text-slate-500">{n.district} • {n.ndrf_battalion_stationed}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      n.status === 'OPERATIONAL_READY' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {n.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-600 pt-1">
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block">Occupancy</span>
                      <span className="font-semibold">{n.current_occupancy} / {n.capacity_persons}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block">Headroom</span>
                      <span className="font-bold text-emerald-700">{n.available_capacity} free</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block">ICU Beds</span>
                      <span className="font-bold text-red-600">{n.icu_beds_available} beds</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Green Corridor Drone Dispatch (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Plane className="w-4 h-4 text-emerald-600" />
              Activate Medical Drone Green Corridor
            </h3>

            <form onSubmit={handleDispatch} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">Launch Node</label>
                <select
                  value={sourceNode}
                  onChange={(e) => setSourceNode(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="NODE-RAI-MAHAD-01">Mahad Relief Center (Raigad)</option>
                  <option value="NODE-RAT-CHIPLUN-02">Vashishti River Basin (Ratnagiri)</option>
                  <option value="NODE-KOL-SHIROLI-03">Panchganga Base (Kolhapur)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">Destination Hamlet</label>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">Payload Specification</label>
                <select
                  value={payloadType}
                  onChange={(e) => setPayloadType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="EMERGENCY_ANTIVENOM_AND_O_NEG_BLOOD">Emergency Anti-Venom &amp; O-Neg Blood</option>
                  <option value="PORTABLE_AED_AND_INSULIN">Cardiac Defibrillator (AED) &amp; Insulin</option>
                  <option value="WATER_PURIFICATION_AND_COMM_BEACON">Water Purification &amp; Satellite Beacon</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={dispatching}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {dispatching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Authorize Beyond-Visual-Line-of-Sight (BVLOS) Drone Dispatch
              </button>
            </form>
          </div>

          {/* Corridor Result */}
          {corridorResult && (
            <div className="bg-slate-900 text-white rounded-2xl border border-emerald-500/40 p-6 space-y-3 animate-in fade-in duration-300 text-xs shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> AIRSPACE CORRIDOR ACTIVE
                </span>
                <span className="font-mono text-[10px] text-slate-400">{corridorResult.drone_callsign}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Flight Time</span>
                  <span className="text-base font-bold text-white">{corridorResult.estimated_flight_minutes} min</span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Clearance</span>
                  <span className="text-xs font-bold text-emerald-400 truncate block">DGCA BVLOS</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-300 bg-slate-950 p-2 rounded border border-slate-800">
                {corridorResult.ground_contact}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
