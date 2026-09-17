import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import {
  Lock, ShieldCheck, CheckCircle2, RefreshCw, EyeOff,
  Cpu, Key, FileCheck, ArrowRight, Zap, Database
} from 'lucide-react';

export const ConfidentialMPCPage: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [partyA, setPartyA] = useState('DEPT_REVENUE');
  const [partyB, setPartyB] = useState('DEPT_SOCIAL_WELFARE');
  const [criterion, setCriterion] = useState('INCOME_LEQ_300K_AND_LAND_LEQ_5ACRES');
  const [computing, setComputing] = useState(false);
  const [psiResult, setPsiResult] = useState<any | null>(null);

  const fetchSessions = async () => {
    try {
      const res = await api.getMPCSessions();
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleRunPSI = async () => {
    setComputing(true);
    setPsiResult(null);
    try {
      const res = await api.verifyBlindMatch({
        citizen_blind_hash: 'CIT-DEMO-9999999999',
        party_a_id: partyA,
        party_b_id: partyB,
        criterion: criterion
      });
      setPsiResult(res);
    } catch (e: any) {
      alert('MPC verification failed: ' + e.message);
    } finally {
      setComputing(false);
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
          <EyeOff className="w-3.5 h-3.5 text-emerald-600" />
          MahaVault — Confidential Computing
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
          Multi-Party Computation & Private Set Intersection
        </h1>
        <p className="mt-2 text-base text-slate-600">
          Cross-department eligibility verification without revealing databases. Department A and Department B compute matching criteria cryptographically without sharing raw citizen records with each other or the central hub.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Active MPC Sessions (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-600" />
              Active Confidential Computing Frameworks
            </h2>

            <div className="space-y-3.5 mb-6">
              {data?.sessions?.map((sess: any) => (
                <div key={sess.session_id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                      {sess.session_id}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      {sess.status}
                    </span>
                  </div>

                  <p className="text-xs font-bold text-slate-900">{sess.purpose}</p>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1">
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block">Party A</span>
                      <span className="font-medium text-slate-800">{sess.party_a}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block">Party B</span>
                      <span className="font-medium text-slate-800">{sess.party_b}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-200/60">
                    <span>Protocol: {sess.protocol}</span>
                    <span className="font-mono text-emerald-700 font-bold">{sess.raw_data_leakage}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Interactive PSI Simulator */}
            <div className="border-t border-slate-200 pt-5 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-indigo-600" />
                Run Blind Private Set Intersection (PSI)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">Party A (Data Owner)</label>
                  <select
                    value={partyA}
                    onChange={(e) => setPartyA(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="DEPT_REVENUE">Department of Revenue & Land</option>
                    <option value="DEPT_LABOUR">Labour & Employment Directorate</option>
                    <option value="DEPT_HIGHER_EDU">Higher & Technical Education</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">Party B (Evaluating Department)</label>
                  <select
                    value={partyB}
                    onChange={(e) => setPartyB(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="DEPT_SOCIAL_WELFARE">Social Welfare & DBT</option>
                    <option value="DEPT_AGRICULTURE">Department of Agriculture</option>
                    <option value="DEPT_HEALTH">Public Health Department</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">Evaluated Blind Criterion</label>
                <input
                  type="text"
                  value={criterion}
                  onChange={(e) => setCriterion(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 font-mono text-slate-800"
                />
              </div>

              <button
                onClick={handleRunPSI}
                disabled={computing}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {computing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 text-amber-400" />}
                Execute Blind Private Set Intersection
              </button>
            </div>
          </div>
        </div>

        {/* Right: PSI Mathematical Proof Inspector (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {psiResult ? (
            <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-xl p-6 space-y-4 animate-in fade-in duration-300 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> CONFIDENTIAL MATCH VERIFIED
                </span>
                <span className="text-[10px] font-mono text-slate-400">Zero-Knowledge PSI</span>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-0.5">Party A Blinded Token</p>
                <p className="font-mono text-[10px] text-indigo-300 bg-slate-950 p-2 rounded border border-slate-800">
                  {psiResult.blind_token_party_a}
                </p>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-0.5">Party B Blinded Token</p>
                <p className="font-mono text-[10px] text-indigo-300 bg-slate-950 p-2 rounded border border-slate-800">
                  {psiResult.blind_token_party_b}
                </p>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-0.5">Intersection Certificate</p>
                <p className="font-mono text-[10px] text-amber-300 bg-slate-950 p-2 rounded border border-slate-800 break-all select-all">
                  {psiResult.intersection_certificate}
                </p>
              </div>

              <div className="bg-emerald-950/80 p-3 rounded-xl border border-emerald-800 text-emerald-200 space-y-1">
                <p className="font-bold text-emerald-400">Zero Data Leakage Guarantee</p>
                <p className="text-[11px] text-emerald-300/90 leading-relaxed">
                  {psiResult.data_leakage_guarantee}
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-8 text-center space-y-3">
              <Key className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-700">Cryptographic Privacy Barrier</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Execute the Private Set Intersection to observe cryptographic blinding, where two departments verify citizen eligibility without exposing any unrelated citizen data.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
