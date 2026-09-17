import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import {
  Scale, ShieldAlert, CheckCircle2, RefreshCw, Gavel,
  Clock, IndianRupee, Users, ArrowRight, FileCheck, AlertTriangle
} from 'lucide-react';

export const TribunalNyayaPage: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState<string>('RTSA-MH-PUN-2026-042');
  const [arbitrating, setArbitrating] = useState(false);
  const [decreeResult, setDecreeResult] = useState<any | null>(null);

  const fetchDisputes = async () => {
    try {
      const res = await api.getTribunalDisputes();
      setData(res);
      if (res.disputes?.length && !selectedCase) {
        setSelectedCase(res.disputes[0].case_number);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, []);

  const handleArbitrate = async () => {
    setArbitrating(true);
    setDecreeResult(null);
    try {
      const res = await api.arbitrateTribunalDispute(selectedCase);
      setDecreeResult(res);
    } catch (e: any) {
      alert('Arbitration failed: ' + e.message);
    } finally {
      setArbitrating(false);
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
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-900 rounded-full text-xs font-semibold tracking-wide uppercase mb-3">
          <Scale className="w-3.5 h-3.5 text-amber-600" />
          MahaNyaya — RTSA 2015 Quasi-Judicial Tribunal
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
          Multi-Agent Autonomous Grievance Tribunal
        </h1>
        <p className="mt-2 text-base text-slate-600">
          Enforceable justice under the Maharashtra Right to Public Services Act (RTSA) 2015. When government departments breach statutory delivery deadlines, MahaNyaya convenes a 3-agent autonomous panel (Investigator, Legal Counsel, and Ombudsman) to issue binding compensation orders deducted from defaulting desk pools.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Active Escalated Disputes (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Escalated Citizen Disputes Under RTSA 2015
            </h2>

            <div className="space-y-3">
              {data?.disputes?.map((d: any) => (
                <div
                  key={d.case_number}
                  onClick={() => setSelectedCase(d.case_number)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer text-xs space-y-2 ${
                    selectedCase === d.case_number
                      ? 'border-amber-500 bg-amber-50/50 shadow-sm'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-900">{d.case_number}</span>
                    <span className="text-[10px] font-bold bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                      +{d.days_elapsed - d.statutory_sla_days} DAYS OVERDUE
                    </span>
                  </div>

                  <div>
                    <span className="font-bold text-slate-900 text-sm">{d.citizen_name}</span>
                    <p className="text-slate-600 text-xs mt-0.5">{d.service_requested}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                    <span>Defaulting Desk: {d.defaulting_officer}</span>
                    <span>Elapsed: {d.days_elapsed} / {d.statutory_sla_days} days SLA</span>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleArbitrate}
              disabled={arbitrating}
              className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {arbitrating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Gavel className="w-4 h-4 text-amber-400" />}
              Convene 3-Agent Quasi-Judicial Deliberation
            </button>
          </div>
        </div>

        {/* Right: Multi-Agent Findings & Judicial Decree (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          {decreeResult ? (
            <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-xl p-6 space-y-4 animate-in fade-in duration-300 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-amber-400 flex items-center gap-1.5">
                  <Gavel className="w-4 h-4" /> QUASI-JUDICIAL DECREE PROMULGATED
                </span>
                <span className="font-mono text-[10px] text-slate-400">{decreeResult.case_number}</span>
              </div>

              {/* 3 Agents' Findings */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase text-slate-400 block font-bold">Multi-Agent Deliberation Panel</span>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="font-bold text-indigo-400 block text-[11px]">1. Investigative Agent</span>
                  <p className="text-slate-300 text-[10px] mt-0.5">{decreeResult.multi_agent_deliberation.investigative_agent.verdict}</p>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="font-bold text-amber-400 block text-[11px]">2. Statutory Legal Agent</span>
                  <p className="text-slate-300 text-[10px] mt-0.5">{decreeResult.multi_agent_deliberation.statutory_legal_agent.verdict}</p>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="font-bold text-emerald-400 block text-[11px]">3. Department Ombudsman</span>
                  <p className="text-slate-300 text-[10px] mt-0.5">{decreeResult.multi_agent_deliberation.department_ombudsman_agent.verdict}</p>
                </div>
              </div>

              {/* Citizen Relief & Compensation */}
              <div className="bg-amber-950/60 p-4 rounded-xl border border-amber-500/40 space-y-2 text-amber-200">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs uppercase text-amber-300">Statutory Citizen Compensation</span>
                  <span className="text-base font-black text-amber-400">
                    ₹{decreeResult.quasi_judicial_decree.citizen_compensation_inr}
                  </span>
                </div>
                <p className="text-[10px] text-slate-300">
                  Source: {decreeResult.quasi_judicial_decree.compensation_deduction_source}
                </p>
                <p className="text-[10px] text-emerald-300 font-semibold pt-1 border-t border-amber-500/30">
                  Relief: {decreeResult.quasi_judicial_decree.citizen_relief}
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-8 text-center space-y-3">
              <Scale className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-700">Tribunal Panel on Standby</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Select an overdue grievance and convene the 3-agent deliberation to observe autonomous statutory penalty calculation and immediate citizen compensation awards.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
