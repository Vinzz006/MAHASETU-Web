import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import {
  Sparkles, CheckCircle2, ShieldCheck, ArrowRight, RefreshCw,
  Gift, Layers, UserCheck, Check, Send, Award, Clock
} from 'lucide-react';

export const ProactiveEntitlementsPage: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSchemes, setSelectedSchemes] = useState<string[]>([
    'SCHEME-YOUTH-SKILL-2026',
    'SCHEME-AROGYA-2026'
  ]);
  const [drafting, setDrafting] = useState(false);
  const [bundleResult, setBundleResult] = useState<any | null>(null);

  const fetchRecommendations = async () => {
    try {
      const res = await api.getProactiveRecommendations();
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const toggleScheme = (schemeId: string) => {
    if (selectedSchemes.includes(schemeId)) {
      if (selectedSchemes.length === 1) return;
      setSelectedSchemes(selectedSchemes.filter(id => id !== schemeId));
    } else {
      setSelectedSchemes([...selectedSchemes, schemeId]);
    }
  };

  const handleAutoDraft = async () => {
    setDrafting(true);
    setBundleResult(null);
    try {
      const res = await api.autoDraftSchemeBundle({
        selected_scheme_ids: selectedSchemes
      });
      setBundleResult(res);
    } catch (e: any) {
      alert('Drafting failed: ' + e.message);
    } finally {
      setDrafting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  const profile = data?.citizen_profile_analyzed;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-900 rounded-full text-xs font-semibold tracking-wide uppercase mb-3">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          MahaPrerna — Proactive AI Governance
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
          Proactive Scheme Entitlements & 1-Click Bundling
        </h1>
        <p className="mt-2 text-base text-slate-600">
          "Sarkaar Aaplya Daari" (Government at Your Doorstep). MahaSetu AI evaluates your pre-verified canonical attributes and alerts you to welfare subsidies you qualify for *before* you need to search for them.
        </p>
      </div>

      {/* Citizen Profile Snapshot Strip */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 mb-8 border border-slate-800 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-amber-400 font-bold">
              Analyzed Canonical Citizen Profile
            </span>
            <h3 className="text-lg font-bold text-white mt-0.5">
              {profile?.citizen_name} • {profile?.district} District
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Verified Income: ₹{profile?.annual_income_inr?.toLocaleString()}/yr • Land: {profile?.land_holding_acres} Acres • Status: {profile?.employment_status}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-slate-800/80 px-3 py-2 rounded-xl border border-slate-700 text-center">
              <span className="text-[10px] text-slate-400 block uppercase">Matched Schemes</span>
              <span className="text-base font-bold text-amber-400">{data?.total_proactive_matches} Eligible</span>
            </div>
            <div className="bg-slate-800/80 px-3 py-2 rounded-xl border border-slate-700 text-center">
              <span className="text-[10px] text-slate-400 block uppercase">Estimated Benefit</span>
              <span className="text-base font-bold text-emerald-400">₹{data?.total_potential_annual_benefit_inr?.toLocaleString()}/yr</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Matched Schemes List (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Gift className="w-5 h-5 text-indigo-600" />
              Eligible Public Benefit Programs
            </h2>
            <span className="text-xs font-semibold text-slate-500">
              Select schemes to bundle
            </span>
          </div>

          <div className="space-y-3.5">
            {data?.recommendations?.map((scheme: any) => {
              const isSelected = selectedSchemes.includes(scheme.scheme_id);
              return (
                <div
                  key={scheme.scheme_id}
                  onClick={() => toggleScheme(scheme.scheme_id)}
                  className={`cursor-pointer rounded-2xl border p-5 transition-all ${
                    isSelected
                      ? 'bg-amber-50/70 border-amber-400 shadow-sm ring-1 ring-amber-400/30'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center mt-1 transition-colors ${
                        isSelected ? 'bg-amber-500 text-slate-950 font-bold' : 'border border-slate-300 bg-white'
                      }`}>
                        {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wide">
                          {scheme.ministry}
                        </span>
                        <h3 className="text-base font-bold text-slate-900 mt-0.5">{scheme.title}</h3>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full shrink-0">
                      {scheme.match_percentage}% Match
                    </span>
                  </div>

                  <div className="ml-8 space-y-2">
                    <p className="text-xs font-semibold text-emerald-800 bg-emerald-50 p-2 rounded-lg border border-emerald-200/60">
                      Entitlement Benefit: {scheme.eligible_benefit}
                    </p>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {scheme.justification}
                    </p>

                    <div className="pt-2 flex flex-wrap gap-1.5 text-[10px]">
                      {scheme.pre_verified_prerequisites?.map((prereq: string) => (
                        <span key={prereq} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                          ✓ {prereq}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: 1-Click Multi-Scheme Auto-Draft Station (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Layers className="w-5 h-5 text-indigo-600" />
              <h3 className="text-base font-bold text-slate-900">
                1-Click Application Bundle Builder
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              MahaSetu eliminates repeated form-filling. When you draft this bundle, all selected departments receive your pre-verified attributes directly from the Canonical Model.
            </p>

            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 space-y-2 text-xs">
              <span className="text-[10px] uppercase text-slate-500 font-semibold block">
                Selected for Unified Dispatch ({selectedSchemes.length})
              </span>
              <ul className="space-y-1">
                {selectedSchemes.map((sid) => {
                  const item = data?.recommendations?.find((s: any) => s.scheme_id === sid);
                  return (
                    <li key={sid} className="text-slate-800 font-medium flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      {item?.title || sid}
                    </li>
                  );
                })}
              </ul>
            </div>

            <button
              onClick={handleAutoDraft}
              disabled={drafting || selectedSchemes.length === 0}
              className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {drafting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              Auto-Draft Unified Application Bundle
            </button>

            {/* Bundle Result Display */}
            {bundleResult && (
              <div className="bg-emerald-950 text-emerald-100 rounded-2xl p-5 border border-emerald-900 shadow-lg space-y-3 animate-in fade-in duration-300 text-xs">
                <div className="flex items-center justify-between border-b border-emerald-800 pb-2">
                  <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> BUNDLE DRAFTED
                  </span>
                  <span className="font-mono text-[10px] text-amber-300">{bundleResult.bundle_id}</span>
                </div>

                <div className="space-y-2">
                  {bundleResult.drafted_applications?.map((app: any) => (
                    <div key={app.drafted_application_id} className="bg-emerald-900/60 p-2.5 rounded-lg border border-emerald-800/80">
                      <p className="font-bold text-white text-xs">{app.title}</p>
                      <div className="flex items-center justify-between text-[11px] text-emerald-300 mt-1">
                        <span className="font-mono">{app.drafted_application_id}</span>
                        <span>SLA: ~{app.estimated_disbursal_window_days} Days</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 text-[11px] text-emerald-200 border-t border-emerald-800/60">
                  <p>{bundleResult.next_step}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
