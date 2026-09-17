import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import {
  AlertTriangle, ShieldAlert, CheckCircle2, RefreshCw, Send,
  Layers, MapPin, Zap, Users, IndianRupee, FileCheck, Check
} from 'lucide-react';

export const DisasterSurgePage: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState('DISASTER-KONKAN-FLOOD-2026');
  const [targetDistrict, setTargetDistrict] = useState('Ratnagiri');
  const [badgeId, setBadgeId] = useState('IAS-SDMA-CHIEF-01');
  const [disbursing, setDisbursing] = useState(false);
  const [reliefResult, setReliefResult] = useState<any | null>(null);

  const fetchEvents = async () => {
    try {
      const res = await api.getActiveDisasterEvents();
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleTriggerRelief = async () => {
    setDisbursing(true);
    setReliefResult(null);
    try {
      const res = await api.triggerDisasterRelief({
        event_id: selectedEventId,
        target_district: targetDistrict,
        authorized_officer_badge: badgeId
      });
      setReliefResult(res);
    } catch (e: any) {
      alert('Disbursal failed: ' + e.message);
    } finally {
      setDisbursing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  const selectedEvent = data?.events?.find((e: any) => e.event_id === selectedEventId) || data?.events?.[0];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-100 text-red-900 rounded-full text-xs font-semibold tracking-wide uppercase mb-3">
          <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
          MahaAapada — Emergency Disaster Surge
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
          Disaster Crisis Relief &amp; Emergency Welfare Fusion Mesh
        </h1>
        <p className="mt-2 text-base text-slate-600">
          Zero-paperwork emergency relief. When floods, droughts, or hailstorms strike, MahaSetu fuses satellite flood inundation GIS with Revenue land records and Aadhaar DBT bank accounts to disburse emergency relief directly in minutes.
        </p>
      </div>

      {/* Active Disaster Declarations Strip */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
        {data?.events?.map((ev: any) => {
          const isSelected = selectedEventId === ev.event_id;
          return (
            <div
              key={ev.event_id}
              onClick={() => {
                setSelectedEventId(ev.event_id);
                setTargetDistrict(ev.affected_districts[0]);
              }}
              className={`cursor-pointer rounded-2xl border p-5 transition-all ${
                isSelected
                  ? 'bg-red-50/70 border-red-400 shadow-md ring-1 ring-red-400/40'
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded">
                  {ev.event_id}
                </span>
                <span className="text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                  {ev.severity}
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-900">{ev.title}</h3>
              <p className="text-xs text-slate-600 mt-1">
                Affected: {ev.affected_districts.join(', ')} • {ev.gis_inundation_area_sq_km} sq km
              </p>

              <div className="pt-3 border-t border-slate-200/60 mt-3 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">Relief: ₹{ev.approved_relief_per_beneficiary_inr.toLocaleString()} / head</span>
                <span className="text-slate-500 font-medium">{ev.estimated_affected_citizens.toLocaleString()} citizens</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid: Data Fusion Matrix & 1-Click Trigger */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Cross-Department Data Fusion Engine (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              Automated Cross-Department Data Fusion Matrix
            </h2>

            <div className="space-y-3.5 mb-6">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <span className="text-[10px] uppercase font-bold text-indigo-600 block">Layer 1: Geospatial Inundation</span>
                <p className="font-semibold text-slate-800">ISRO Bhuvan / Sentinel Remote Sensing Satellite Maps</p>
                <p className="text-slate-500 text-[11px]">Pinpoints exact GPS boundaries of submerged agricultural plots.</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <span className="text-[10px] uppercase font-bold text-indigo-600 block">Layer 2: Revenue Land Cadastre</span>
                <p className="font-semibold text-slate-800">Mahabhulekh 7/12 Land Registry &amp; Domicile Extract</p>
                <p className="text-slate-500 text-[11px]">Automatically resolves affected parcel numbers to Aadhaar VID holders.</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <span className="text-[10px] uppercase font-bold text-indigo-600 block">Layer 3: Direct Financial Rails</span>
                <p className="font-semibold text-slate-800">PFMS e-Kuber Aadhaar Payment Bridge System (APBS)</p>
                <p className="text-slate-500 text-[11px]">Direct credits bank accounts with zero manual claim forms or intermediary middlemen.</p>
              </div>
            </div>

            {/* 1-Click Trigger Form */}
            <div className="border-t border-slate-200 pt-5 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                Trigger Emergency Batch Disbursal
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">Target District</label>
                  <select
                    value={targetDistrict}
                    onChange={(e) => setTargetDistrict(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500 bg-white"
                  >
                    {selectedEvent?.affected_districts?.map((d: string) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">SDMA Authorized Badge</label>
                  <input
                    type="text"
                    value={badgeId}
                    onChange={(e) => setBadgeId(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
              </div>

              <button
                onClick={handleTriggerRelief}
                disabled={disbursing}
                className="w-full py-3 px-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {disbursing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 text-amber-300" />}
                Authorize Instant Disaster Relief Disbursal
              </button>
            </div>
          </div>
        </div>

        {/* Right: Emergency Disbursal Certificate (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {reliefResult ? (
            <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-xl p-6 space-y-4 animate-in fade-in duration-300 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> EMERGENCY RELIEF DISBURSED
                </span>
                <span className="font-mono text-[10px] text-amber-300">{reliefResult.batch_reference}</span>
              </div>

              <div className="space-y-2">
                <div>
                  <span className="text-[10px] uppercase text-slate-400 block">Disaster Incident</span>
                  <p className="font-bold text-white">{reliefResult.disaster_title}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Beneficiaries</span>
                    <span className="text-base font-bold text-amber-400">
                      {reliefResult.beneficiaries_credited.toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Total Outlay</span>
                    <span className="text-base font-bold text-emerald-400">
                      ₹{(reliefResult.total_fiscal_disbursed_inr / 10000000).toFixed(2)} Cr
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase text-slate-400 block mb-0.5">Audit Seal Hash</span>
                  <p className="font-mono text-[9px] text-indigo-300 bg-slate-950 p-2 rounded border border-slate-800 break-all select-all">
                    {reliefResult.audit_seal_digest}
                  </p>
                </div>
              </div>

              <div className="bg-emerald-950/80 p-3 rounded-xl border border-emerald-800 text-emerald-200">
                <p className="font-bold mb-0.5">Zero Paperwork Mandate</p>
                <p className="text-[11px] text-emerald-300/90">{reliefResult.telemetry_note}</p>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-8 text-center space-y-3">
              <ShieldAlert className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-700">Crisis Response Standby</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Select an active disaster declaration and authorize the emergency disbursal to observe automated multi-department data fusion and instant DBT clearing.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
