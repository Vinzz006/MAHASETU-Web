import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import {
  Leaf, Trees, Award, FileText, CheckCircle2, RefreshCw,
  TrendingDown, ShieldCheck, MapPin, Download, Check
} from 'lucide-react';

export const GreenGovTechPage: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDistrict, setSelectedDistrict] = useState('Pune');
  const [certificate, setCertificate] = useState<any | null>(null);
  const [loadingCert, setLoadingCert] = useState(false);

  const fetchFootprint = async () => {
    try {
      const res = await api.getGreenFootprint();
      setData(res);
      handleFetchCert('Pune');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchCert = async (distName: string) => {
    setSelectedDistrict(distName);
    setLoadingCert(true);
    try {
      const certRes = await api.getDistrictGreenCertificate(distName);
      setCertificate(certRes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingCert(false);
    }
  };

  useEffect(() => {
    fetchFootprint();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  const totals = data?.statewide_totals;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-900 rounded-full text-xs font-semibold tracking-wide uppercase mb-3">
          <Leaf className="w-3.5 h-3.5 text-emerald-600" />
          MahaHarit — Green GovTech &amp; ESG
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
          Carbon-Neutral Data Exchange &amp; Environmental Accounting Ledger
        </h1>
        <p className="mt-2 text-base text-slate-600">
          Quantifying the ecological impact of digital interoperability. By connecting government systems directly, MahaSetu eliminates millions of physical forms, avoids transit emissions, and preserves Maharashtra's forests.
        </p>
      </div>

      {/* Top 4 Green KPI Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">
            <span>Paper Eliminated</span>
            <FileText className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {(totals?.physical_paper_sheets_eliminated || 0).toLocaleString()}
          </div>
          <p className="text-xs text-emerald-700 mt-1 font-medium">Physical application sheets saved</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">
            <span>Forest Trees Preserved</span>
            <Trees className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {totals?.mature_forest_trees_preserved} Trees
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">Timber harvest prevented</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">
            <span>Citizen Travel Avoided</span>
            <TrendingDown className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {(totals?.citizen_physical_travel_km_saved || 0).toLocaleString()} km
          </div>
          <p className="text-xs text-sky-700 mt-1 font-medium">Physical office visits replaced</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">
            <span>CO₂ Emissions Mitigated</span>
            <Leaf className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {totals?.metric_tons_co2_avoided} MT
          </div>
          <p className="text-xs text-emerald-700 mt-1 font-medium">Net greenhouse reduction</p>
        </div>
      </div>

      {/* Main Grid: District Leaderboard + Eco Certificate Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* District Eco-Leaderboard (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                District Green Governance Leaderboard
              </h2>
              <span className="text-xs font-semibold text-slate-500">Mission LiFE Aligned</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">District</th>
                    <th className="py-3 px-3">Paper Saved</th>
                    <th className="py-3 px-3">Travel Saved</th>
                    <th className="py-3 px-3">CO₂ Offset</th>
                    <th className="py-3 px-3 text-right">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data?.district_rankings?.map((d: any) => {
                    const isSelected = selectedDistrict === d.district;
                    return (
                      <tr
                        key={d.district}
                        onClick={() => handleFetchCert(d.district)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-emerald-50/70 font-medium' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="py-3 px-4 font-bold text-slate-900">{d.district}</td>
                        <td className="py-3 px-3 font-mono">{d.paper_sheets_saved.toLocaleString()}</td>
                        <td className="py-3 px-3 font-mono">{d.travel_km_eliminated.toLocaleString()} km</td>
                        <td className="py-3 px-3 font-semibold text-emerald-700">{(d.co2_offset_kg / 1000).toFixed(1)} MT</td>
                        <td className="py-3 px-3 text-right">
                          <span className="inline-block bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                            {d.green_index_score}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Verifiable District Green Certificate (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {certificate && (
            <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-950 text-white rounded-2xl border border-emerald-800/60 shadow-xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-emerald-800/60 pb-3">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-400" />
                  <h3 className="text-xs font-bold text-white tracking-wide uppercase">ECO-GOVERNANCE CERTIFICATE</h3>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-900/80 px-2 py-0.5 rounded">
                  {certificate.green_rating}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400">Awarded To</span>
                <h4 className="text-lg font-black text-white">{certificate.district} Collectorate</h4>
                <p className="text-xs text-emerald-300 mt-1 leading-relaxed italic">
                  "{certificate.citation}"
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
                <div className="bg-slate-900/90 p-3 rounded-xl border border-emerald-900/60">
                  <span className="text-[10px] uppercase text-slate-400 block">Carbon Offset</span>
                  <span className="text-base font-bold text-emerald-400">
                    {(certificate.co2_mitigated_kg / 1000).toFixed(1)} Metric Tons
                  </span>
                </div>
                <div className="bg-slate-900/90 p-3 rounded-xl border border-emerald-900/60">
                  <span className="text-[10px] uppercase text-slate-400 block">Trees Preserved</span>
                  <span className="text-base font-bold text-amber-400">
                    {certificate.trees_saved} Mature Trees
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block mb-0.5">Digital Stamp Hash</span>
                <p className="font-mono text-[9px] text-indigo-300 bg-slate-950 p-2 rounded border border-emerald-900/60 break-all select-all">
                  {certificate.digital_stamp}
                </p>
              </div>

              <div className="pt-2 border-t border-emerald-900/60 flex items-center justify-between text-[10px] text-slate-400">
                <span>Certificate ID: {certificate.certificate_id}</span>
                <span>SDG Goal 13 Certified</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
