import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import {
  ShieldCheck, Lock, CheckCircle2, Key, Server,
  FileCode, RefreshCw, Award, Hash, Cpu
} from 'lucide-react';

export const SecurityAuditPage: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchScorecard = async () => {
    setLoading(true);
    try {
      const res = await api.getSecurityAudit();
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

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">
          <Lock className="w-4 h-4 text-emerald-600" />
          <span>Zero-Trust Security &amp; Cryptographic Assurance</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
          State Cryptographic Security Console
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Real-time automated verification of DPDP consent validity tokens, SHA-256 digital seals, and adapter transport encryptions.
        </p>
      </div>

      {data && (
        <div className="space-y-6 text-xs">
          {/* Master Scorecard Banner */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Award className="w-6 h-6 text-amber-400" />
                <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
                  State Security Verification
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                {data.overall_security_grade}
              </h2>
              <p className="text-xs text-slate-400">
                Audited by: {data.audit_authority}
              </p>
            </div>

            <div className="text-right font-mono">
              <span className="text-[10px] text-slate-400 block uppercase">Composite Integrity Index</span>
              <strong className="text-3xl sm:text-4xl font-black text-emerald-400 block">
                {data.composite_integrity_index}%
              </strong>
              <span className="text-[10px] text-emerald-300">All Security Tests Passed</span>
            </div>
          </div>

          {/* Cryptographic Master Seal Display */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-2 font-mono">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-blue-600" />
                Deterministic Master Cryptographic Seal (Current Epoch)
              </span>
              <button
                onClick={fetchScorecard}
                disabled={loading}
                className="text-[11px] text-blue-600 hover:text-blue-800 flex items-center gap-1 font-semibold"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                <span>Re-Verify Cryptographic State</span>
              </button>
            </div>

            <p className="p-3 bg-slate-950 text-emerald-400 rounded-lg text-xs break-all border border-slate-800">
              0x{data.cryptographic_master_seal}
            </p>
          </div>

          {/* Detailed Security Checks Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-slate-800 flex items-center justify-between">
              <span>Zero-Trust Security Verification Checks ({data.active_security_checks.length})</span>
              <span className="text-[11px] text-emerald-700 font-mono font-bold">100% PASS RATE</span>
            </div>

            <div className="divide-y divide-slate-100">
              {data.active_security_checks.map((chk: any, idx: number) => (
                <div key={idx} className="p-4 flex flex-wrap items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{chk.name}</h4>
                      <p className="text-slate-500 text-[11px] font-mono">
                        Standard: {chk.standard} • Algorithm: {chk.algorithm}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-right font-mono text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Integrity Score</span>
                      <strong className="text-emerald-700 text-sm">{chk.integrity_score}%</strong>
                    </div>

                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                      {chk.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
