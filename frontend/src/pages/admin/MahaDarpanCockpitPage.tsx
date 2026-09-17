import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import {
  MapPin, ShieldCheck, CheckCircle2, AlertTriangle, RefreshCw,
  Search, ArrowUpDown, ChevronRight, Send, Building, Award, TrendingUp, Users
} from 'lucide-react';

export const MahaDarpanCockpitPage: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState<any | null>(null);
  const [districtDetails, setDistrictDetails] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [dispatching, setDispatching] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<any | null>(null);

  const fetchSummary = async () => {
    try {
      const res = await api.getDistrictCockpitSummary();
      setData(res);
      if (res.district_leaderboard && res.district_leaderboard.length > 0) {
        handleSelectDistrict(res.district_leaderboard[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const handleSelectDistrict = async (district: any) => {
    setSelectedDistrict(district);
    setLoadingDetails(true);
    setDispatchResult(null);
    try {
      const res = await api.getDistrictDetails(district.district);
      setDistrictDetails(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleDispatchAction = async (actionType: string) => {
    if (!selectedDistrict) return;
    setDispatching(true);
    setDispatchResult(null);
    try {
      const res = await api.dispatchDistrictAction({
        district: selectedDistrict.district,
        action_type: actionType,
        officer_instructions: `High-priority directive issued to ${selectedDistrict.district} Collectorate to resolve departmental bottleneck.`
      });
      setDispatchResult(res);
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

  const kpis = data?.statewide_kpis;
  const filteredDistricts = (data?.district_leaderboard || []).filter((d: any) =>
    d.district.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.division.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-semibold tracking-wide uppercase mb-3">
          <Building className="w-3.5 h-3.5" />
          MahaDarpan — District Collectorate Cockpit
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
          Statewide 36-District Interoperability & GIS Cockpit
        </h1>
        <p className="mt-2 text-base text-slate-600">
          Executive monitoring console for Chief Secretary & District Collectors. Real-time federation scores, SLA adherence leaderboards, and direct administrative dispatch.
        </p>
      </div>

      {/* Top 4 Macro KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">
            <span>Federation Readiness</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{kpis?.state_federation_index_pct}%</div>
          <p className="text-xs text-emerald-700 mt-1 font-medium">Statewide across 36 Districts</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">
            <span>Cross-Dept Applications</span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{(kpis?.total_cross_department_applications || 0).toLocaleString()}</div>
          <p className="text-xs text-slate-500 mt-1 font-medium">Zero duplicate citizen filings</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">
            <span>Avg SLA Compliance</span>
            <CheckCircle2 className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">{kpis?.average_sla_compliance_pct}%</div>
          <p className="text-xs text-emerald-700 mt-1 font-medium">Target &gt; 90% SLA met</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">
            <span>Direct Benefit Disbursed</span>
            <Award className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">₹{kpis?.total_direct_benefit_disbursed_crores} Cr</div>
          <p className="text-xs text-indigo-600 mt-1 font-medium">Transferred to Citizen Accounts</p>
        </div>
      </div>

      {/* Main Content Grid: Leaderboard + District Detail Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* District Leaderboard Table (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-indigo-600" />
                District Federation Leaderboard
              </h2>
              <div className="relative w-48 sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter district or division..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">District</th>
                    <th className="py-3 px-3">Division</th>
                    <th className="py-3 px-3">Federation</th>
                    <th className="py-3 px-3">SLA %</th>
                    <th className="py-3 px-3">Disbursed</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDistricts.map((d: any) => {
                    const isSelected = selectedDistrict?.district === d.district;
                    return (
                      <tr
                        key={d.district}
                        onClick={() => handleSelectDistrict(d)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-indigo-50/80 font-medium' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900">{d.district}</span>
                        </td>
                        <td className="py-3 px-3 text-slate-600">{d.division}</td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                            {d.federation_readiness}%
                          </span>
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-800">{d.sla_adherence_pct}%</td>
                        <td className="py-3 px-3 font-semibold text-slate-900">₹{d.disbursed_crores} Cr</td>
                        <td className="py-3 px-3 text-right">
                          <ChevronRight className={`w-4 h-4 inline-block ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* District Detail & Dispatch Inspector (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {selectedDistrict && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
                    {districtDetails?.division} Division
                  </span>
                  <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">
                    {selectedDistrict.district} Collectorate
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">{districtDetails?.collector_office}</p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {selectedDistrict.status}
                </span>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] uppercase text-slate-500 block">Total Applications</span>
                  <span className="text-base font-bold text-slate-900">
                    {(districtDetails?.total_applications || 0).toLocaleString()}
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] uppercase text-slate-500 block">Completed (100% Verified)</span>
                  <span className="text-base font-bold text-emerald-700">
                    {(districtDetails?.completed_applications || 0).toLocaleString()}
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] uppercase text-slate-500 block">Active Gramin CSC Centers</span>
                  <span className="text-base font-bold text-indigo-700">
                    {districtDetails?.active_kiosks} Centers
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] uppercase text-slate-500 block">Identified Bottleneck</span>
                  <span className="text-xs font-semibold text-amber-700 truncate block">
                    {districtDetails?.bottleneck_department}
                  </span>
                </div>
              </div>

              {/* Top Schemes */}
              <div>
                <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Benefit Disbursal Distribution
                </p>
                <div className="space-y-2">
                  {districtDetails?.top_schemes_disbursed?.map((s: any) => (
                    <div key={s.scheme} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-slate-800 font-medium">{s.scheme}</span>
                      <span className="font-mono text-indigo-600 font-semibold">{s.beneficiaries.toLocaleString()} Citizens</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 1-Click Administrative Directives */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  State Administrative Directives
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    onClick={() => handleDispatchAction('DISPATCH_OFFICER_REBALANCE')}
                    disabled={dispatching}
                    className="py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3 h-3" /> Rebalance Staff
                  </button>
                  <button
                    onClick={() => handleDispatchAction('TRIGGER_EDGE_BURST_SYNC')}
                    disabled={dispatching}
                    className="py-2 px-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-medium text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className="w-3 h-3" /> Edge Burst Sync
                  </button>
                </div>
              </div>

              {/* Dispatch Receipt */}
              {dispatchResult && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-800 space-y-1 animate-in fade-in duration-200">
                  <p className="font-bold flex items-center gap-1.5 text-emerald-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Directive Dispatched: {dispatchResult.dispatch_id}
                  </p>
                  <p className="text-[11px] text-emerald-700">{dispatchResult.telemetry_message}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
