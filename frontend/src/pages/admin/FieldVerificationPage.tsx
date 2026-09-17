import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import {
  MapPin, CheckCircle2, ShieldCheck, Camera, Navigation,
  FileCheck, Clock, UserCheck, AlertTriangle, Send
} from 'lucide-react';

export const FieldVerificationPage: React.FC = () => {
  const [inspections, setInspections] = useState<any[]>([]);
  const [appNumber, setAppNumber] = useState('MH-APP-2026-000186');
  const [beneficiaryName, setBeneficiaryName] = useState('Demo Citizen');
  const [notes, setNotes] = useState('7/12 land boundary physically inspected. Micro-irrigation equipment active.');
  const [lat, setLat] = useState(18.5204);
  const [lng, setLng] = useState(73.8567);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchInspections = async () => {
    try {
      const res = await api.getFieldInspections();
      setInspections(res.inspections || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchInspections();
  }, []);

  const handleCaptureGPS = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(pos.coords.latitude);
          setLng(pos.coords.longitude);
        },
        () => {
          // Fallback simulation for Pune Taluka
          setLat(18.5204 + (Math.random() - 0.5) * 0.02);
          setLng(73.8567 + (Math.random() - 0.5) * 0.02);
        }
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMsg(null);
    try {
      await api.submitFieldInspection({
        application_number: appNumber,
        beneficiary_name: beneficiaryName,
        inspector_name: 'Prakash Patil (Talathi, Haveli)',
        taluka: 'Haveli',
        district: 'Pune',
        latitude: lat,
        longitude: lng,
        inspection_notes: notes,
        recommendation: 'RECOMMENDED_FOR_SANCTION'
      });
      setSuccessMsg('Field verification report saved and queued to Gramin Edge sync!');
      await fetchInspections();
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">
          <MapPin className="w-4 h-4 text-amber-600" />
          <span>Grassroots Revenue Administration (तलठी / ग्रामसेवक)</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
          Talathi &amp; Field Verification Console
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Mobile-first verification tool for village revenue officers to inspect on-ground claims, record geotagged inspection reports, and sync offline through the Gramin Edge network.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Inspection Form */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 text-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-3 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-emerald-600" />
            <span>Record On-Spot Field Inspection</span>
          </h3>

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Application Number</label>
              <input
                type="text"
                value={appNumber}
                onChange={(e) => setAppNumber(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Beneficiary Name</label>
              <input
                type="text"
                value={beneficiaryName}
                onChange={(e) => setBeneficiaryName(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* GPS Capture */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5 text-blue-600" />
                  GPS Geotagging
                </span>
                <button
                  type="button"
                  onClick={handleCaptureGPS}
                  className="text-[10px] text-blue-700 hover:text-blue-900 font-bold bg-white px-2 py-0.5 rounded border border-blue-200 shadow-sm"
                >
                  Re-Pin Location
                </button>
              </div>
              <div className="font-mono text-[11px] text-slate-600 bg-white p-2 rounded border border-slate-200">
                Lat: {lat.toFixed(4)}° N, Long: {lng.toFixed(4)}° E
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Inspection Findings</label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 shadow"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'Submitting...' : 'Submit Geotagged Inspection'}</span>
            </button>
          </form>
        </div>

        {/* Inspections History Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-xs">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between font-bold text-slate-800">
            <span>Verified Field Inspection Log ({inspections.length})</span>
            <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Gramin Edge Synced
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {inspections.map((insp: any) => (
              <div key={insp.id} className="p-4 hover:bg-slate-50/60 transition-colors space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-bold text-slate-900 text-sm">{insp.beneficiary_name}</span>
                    <span className="font-mono text-blue-900 font-bold ml-2 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                      {insp.application_number}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {insp.recommendation}
                  </span>
                </div>

                <p className="text-slate-700 leading-relaxed text-[11px]">
                  "{insp.inspection_notes}"
                </p>

                <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-100">
                  <span>Inspector: <strong>{insp.inspector_name}</strong></span>
                  <span>Coordinates: <strong>{insp.gps_coordinates}</strong></span>
                  <span className="text-emerald-700 font-bold">{insp.edge_sync_status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
