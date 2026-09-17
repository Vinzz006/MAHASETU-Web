import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import {
  ShieldAlert, FileText, CheckCircle2, RefreshCw, Lock,
  Building, User, MapPin, ArrowRight, ShieldCheck, Check
} from 'lucide-react';

export const PoliceCCTNSPage: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [citizenName, setCitizenName] = useState('Pooja Shankar Deshmukh');
  const [contactPhone, setContactPhone] = useState('9822019283');
  const [itemLost, setItemLost] = useState('Original University Degree Certificate & Aadhaar Card');
  const [locationStr, setLocationStr] = useState('Dadar Railway Station Central Concourse, Mumbai');
  const [policeStation, setPoliceStation] = useState('Dadar Police Station');
  const [filing, setFiling] = useState(false);
  const [filingResult, setFilingResult] = useState<any | null>(null);

  const fetchRecords = async () => {
    try {
      const res = await api.getPoliceCCTNSRecords();
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleFile = async (e: React.FormEvent) => {
    e.preventDefault();
    setFiling(true);
    setFilingResult(null);
    try {
      const res = await api.filePoliceLostProperty({
        citizen_name: citizenName,
        contact_phone: contactPhone,
        item_lost: itemLost,
        incident_location: locationStr,
        police_station: policeStation
      });
      setFilingResult(res);
      fetchRecords();
    } catch (e: any) {
      alert('Filing failed: ' + e.message);
    } finally {
      setFiling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-900 rounded-full text-xs font-semibold tracking-wide uppercase mb-3">
          <ShieldAlert className="w-3.5 h-3.5 text-blue-600" />
          MahaRakshak — Police CCTNS Citizen Digital Station
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
          Digital Police Station &amp; Lost Property (NC) Desk
        </h1>
        <p className="mt-2 text-base text-slate-600">
          Direct integration with Maharashtra Police Crime and Criminal Tracking Network &amp; Systems (CCTNS). File Non-Cognizable (NC) lost property reports for duplicate passports, SIM cards, or university certificates without visiting a physical police station.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: File NC Report Form (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              File Non-Cognizable (NC) Lost Property Report
            </h2>

            <form onSubmit={handleFile} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">Citizen Name</label>
                  <input
                    type="text"
                    value={citizenName}
                    onChange={(e) => setCitizenName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">Item / Document Lost</label>
                <input
                  type="text"
                  value={itemLost}
                  onChange={(e) => setItemLost(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">Incident Location</label>
                <input
                  type="text"
                  value={locationStr}
                  onChange={(e) => setLocationStr(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">Police Station</label>
                <select
                  value={policeStation}
                  onChange={(e) => setPoliceStation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="Dadar Police Station">Dadar Police Station (Mumbai Central)</option>
                  <option value="Kothrud Police Station">Kothrud Police Station (Pune)</option>
                  <option value="Sitabuldi Police Station">Sitabuldi Police Station (Nagpur)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={filing}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {filing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4 text-blue-200" />}
                Submit NC Report &amp; Issue Signed CCTNS Certificate
              </button>
            </form>
          </div>
        </div>

        {/* Right: Issued Certificate (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          {filingResult ? (
            <div className="bg-slate-900 text-white rounded-2xl border border-blue-500/40 shadow-xl p-6 space-y-4 animate-in fade-in duration-300 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-blue-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> OFFICIAL NC CERTIFICATE ISSUED
                </span>
                <span className="font-mono text-[10px] text-slate-400">{filingResult.cctns_reference_number}</span>
              </div>

              <div>
                <span className="text-[10px] uppercase text-slate-400 block">Complainant Details</span>
                <p className="font-bold text-white text-sm mt-0.5">{filingResult.citizen_name}</p>
                <p className="text-xs text-blue-300 mt-0.5">Station: {filingResult.jurisdiction_police_station}</p>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] space-y-1">
                <span className="text-[10px] uppercase text-slate-400 block font-semibold">Lost Property Declared</span>
                <p className="text-white font-semibold">{filingResult.item_lost}</p>
                <p className="text-slate-400 text-[10px]">Location: {filingResult.incident_location}</p>
              </div>

              <div>
                <span className="text-[10px] uppercase text-slate-400 block mb-0.5">Digital Signature Hash</span>
                <p className="font-mono text-[10px] text-emerald-400 bg-slate-950 p-2 rounded border border-slate-800 select-all">
                  {filingResult.digital_signature_hash}
                </p>
              </div>

              <div className="p-3 bg-blue-950/60 rounded-xl border border-blue-800 text-[11px] text-blue-200 space-y-1">
                <p className="font-bold">Statutory Legal Admissibility</p>
                <p className="text-[10px] text-blue-300/90">{filingResult.legal_admissibility}</p>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-8 text-center space-y-3">
              <ShieldAlert className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-700">Digital Police Desk Ready</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                File a lost document declaration to receive an instant digitally signed Non-Cognizable certificate valid across passport offices, banks, and telecom operators.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
