import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import {
  TreePine, Award, CheckCircle2, RefreshCw, Compass,
  MapPin, Users, ShieldCheck, FileCheck, Check
} from 'lucide-react';

export const VanadhikarFRAPage: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedClaimId, setSelectedClaimId] = useState('FRA-MH-GAD-ETAPALLI-01');
  const [reconciling, setReconciling] = useState(false);
  const [pattaResult, setPattaResult] = useState<any | null>(null);

  const fetchClaims = async () => {
    try {
      const res = await api.getFRAClaims();
      setData(res);
      if (res.claims?.length && !selectedClaimId) {
        setSelectedClaimId(res.claims[0].claim_id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, []);

  const handleReconcile = async () => {
    setReconciling(true);
    setPattaResult(null);
    try {
      const res = await api.reconcileFRAClaim({
        claim_id: selectedClaimId,
        district_collector_signoff: true
      });
      setPattaResult(res);
      fetchClaims();
    } catch (e: any) {
      alert('Reconciliation failed: ' + e.message);
    } finally {
      setReconciling(false);
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
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-900 rounded-full text-xs font-semibold tracking-wide uppercase mb-3">
          <TreePine className="w-3.5 h-3.5 text-emerald-600" />
          MahaVanadhikar — Forest Rights Act (FRA 2006)
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
          Tribal Forest Rights Digital Cadastre
        </h1>
        <p className="mt-2 text-base text-slate-600">
          Fast-track recognition of Community Forest Rights (CFR) and Individual Forest Rights (IFR) for indigenous tribal communities across Gadchiroli, Nandurbar, Melghat, and Palghar. Unifies Gram Sabha consensus voting with joint Revenue-Forest GPS perimeter boundaries.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Tribal Claims List & Action (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" />
              Tribal Community Land Claims
            </h2>

            <div className="space-y-3">
              {data?.claims?.map((c: any) => (
                <div
                  key={c.claim_id}
                  onClick={() => setSelectedClaimId(c.claim_id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer text-xs space-y-2 ${
                    selectedClaimId === c.claim_id
                      ? 'border-emerald-500 bg-emerald-50/50 shadow-sm'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">{c.gram_panchayat}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      c.status.includes('CONFERRED')
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {c.status}
                    </span>
                  </div>

                  <p className="text-slate-600 text-xs">{c.taluka}, {c.district} • {c.area_acres} Acres</p>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                    <span>Quorum: {c.gram_sabha_quorum_pct}% consensus</span>
                    <span>GPS Walk: {c.joint_gps_walk_completed ? 'Completed' : 'Pending'}</span>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleReconcile}
              disabled={reconciling}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {reconciling ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4" />}
              Reconcile &amp; Issue Vanadhikar Patta Title Deed
            </button>
          </div>
        </div>

        {/* Right: Issued Vanadhikar Patta Deed (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          {pattaResult ? (
            <div className="bg-slate-900 text-white rounded-2xl border border-emerald-500/40 shadow-xl p-6 space-y-4 animate-in fade-in duration-300 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Award className="w-6 h-6 text-emerald-400" />
                  <div>
                    <h3 className="text-xs font-bold text-white tracking-wide uppercase">
                      OFFICIAL VANADHIKAR TITLE DEED (PATTA)
                    </h3>
                    <span className="text-[10px] text-emerald-300 font-mono">{pattaResult.title_deed_number}</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                  CONFERRED
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase text-slate-400 block">Conferred To Community / Gram Sabha</span>
                <p className="text-base font-bold text-white">{pattaResult.gram_panchayat}</p>
                <p className="text-xs text-slate-300 mt-0.5">{pattaResult.taluka}, {pattaResult.district}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] uppercase text-slate-400 block">Recognized Area</span>
                  <span className="text-base font-bold text-emerald-400">{pattaResult.area_recognized_acres} Acres</span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] uppercase text-slate-400 block">Tenure Security</span>
                  <span className="text-xs font-bold text-amber-300">IN PERPETUITY</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase text-slate-400 block mb-0.5">Cryptographic Patta Digest</span>
                <p className="font-mono text-[9px] text-emerald-300 bg-slate-950 p-2 rounded border border-slate-800 break-all select-all">
                  0x{pattaResult.cryptographic_patta_digest}
                </p>
              </div>

              <div className="bg-emerald-950/70 p-3 rounded-xl border border-emerald-800 space-y-1 text-emerald-200">
                <p className="font-bold text-[11px]">Constitutional Title Guarantee</p>
                <p className="text-emerald-300/90 text-[10px]">{pattaResult.land_title_guarantee}</p>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-8 text-center space-y-3">
              <TreePine className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-700">Tribal Patta Standby</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Select a tribal claim to execute joint revenue-forest cadastral boundary reconciliation and generate an unalterable land title deed under the FRA Act 2006.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
