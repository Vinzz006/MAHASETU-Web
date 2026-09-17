import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import {
  Trash2, ShieldCheck, CheckCircle2, RefreshCw, AlertCircle,
  FileCheck, Lock, EyeOff, ShieldAlert, Award, ArrowRight
} from 'lucide-react';

export const DPDPErasurePage: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [citizenMobile, setCitizenMobile] = useState('9999999999');
  const [erasing, setErasing] = useState(false);
  const [erasureResult, setErasureResult] = useState<any | null>(null);

  const fetchScorecard = async () => {
    try {
      const res = await api.getDPDPPrivacyScorecard(citizenMobile);
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScorecard();
  }, []);

  const handleRequestErasure = async () => {
    setErasing(true);
    setErasureResult(null);
    try {
      const res = await api.requestDPDPErasure({
        citizen_mobile: citizenMobile,
        requested_departments: ['DEPT_B_ELIGIBILITY', 'DEPT_A_CIVIL'],
        reason: 'Service application completed; exercising statutory Right to be Forgotten under DPDP Act 2023.'
      });
      setErasureResult(res);
      fetchScorecard();
    } catch (e: any) {
      alert('Erasure request failed: ' + e.message);
    } finally {
      setErasing(false);
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
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-900 rounded-full text-xs font-semibold tracking-wide uppercase mb-3">
          <Lock className="w-3.5 h-3.5 text-purple-600" />
          MahaNirasana — DPDP Act 2023 Sovereignty
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
          Right-to-be-Forgotten &amp; Data Erasure Ledger
        </h1>
        <p className="mt-2 text-base text-slate-600">
          Your data, your control. In strict accordance with India's Digital Personal Data Protection (DPDP) Act 2023, inspect which departments hold your personal data, check retention expiry dates, and execute a verifiable cryptographic data purge.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Departmental Data Footprint (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <EyeOff className="w-4 h-4 text-purple-600" />
                Cross-Department Data Footprint &amp; Retention TTL
              </h2>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                {data?.dpdp_compliance_status}
              </span>
            </div>

            <div className="space-y-3.5 mb-6">
              {data?.departmental_footprints?.map((dept: any) => (
                <div key={dept.department} className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{dept.department}</span>
                    <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded ${
                      dept.ttl_remaining_days === 0
                        ? 'bg-red-100 text-red-700 font-bold'
                        : 'bg-slate-200 text-slate-700'
                    }`}>
                      TTL: {dept.ttl_remaining_days} Days
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {dept.held_attributes.map((attr: string) => (
                      <span key={attr} className="bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded font-mono text-[10px]">
                        {attr}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-200/60">
                    <span>Basis: {dept.retention_basis}</span>
                    <span className="font-semibold text-purple-700">{dept.erasure_eligibility}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Erasure Trigger Station */}
            <div className="border-t border-slate-200 pt-5 space-y-4">
              <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p>
                  Requesting erasure will permanently purge staging buffers and non-essential verification caches across Department B and temporary relays. Statutory fiscal audit records (e.g. CAG bank transfers) are preserved under Section 12(3) of the Act.
                </p>
              </div>

              <button
                onClick={handleRequestErasure}
                disabled={erasing}
                className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {erasing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Execute Verifiable Right-to-be-Forgotten (DPDP Purge)
              </button>
            </div>
          </div>
        </div>

        {/* Right: Cryptographic Erasure Certificate (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {erasureResult ? (
            <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-xl p-6 space-y-4 animate-in fade-in duration-300 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> CRYPTOGRAPHIC ERASURE SEALED
                </span>
                <span className="font-mono text-[10px] text-amber-300">{erasureResult.erasure_transaction_id}</span>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] uppercase text-slate-400 block">Purged Datasets</span>
                {erasureResult.purged_records.map((r: string) => (
                  <div key={r} className="bg-slate-950 p-2 rounded border border-slate-800 text-[11px] text-emerald-300">
                    ✓ {r}
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-800 space-y-1">
                <span className="text-[10px] uppercase text-slate-400 block">Certificate URN</span>
                <p className="font-mono text-[9px] text-purple-300 bg-slate-950 p-2 rounded border border-slate-800 break-all select-all">
                  {erasureResult.erasure_certificate.certificate_urn}
                </p>
                <p className="text-[10px] text-slate-400 pt-1">
                  Issued by: {erasureResult.erasure_certificate.issued_by} • {erasureResult.erasure_certificate.legal_backing}
                </p>
              </div>

              <div className="bg-purple-950/70 p-3 rounded-xl border border-purple-800 text-[11px] text-purple-200">
                <p className="font-bold mb-0.5">Immutable Audit Defense</p>
                <p className="text-purple-300/90">
                  This cryptographic proof guarantees your non-statutory records have been purged from MahaSetu gateways and cannot be retrieved by unauthorized parties.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-8 text-center space-y-3">
              <Lock className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-700">DPDP Privacy Compliance Ready</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Trigger the erasure request to simulate an end-to-end Right to be Forgotten workflow, producing an official certificate signed by the MahaSetu Data Protection Officer.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
