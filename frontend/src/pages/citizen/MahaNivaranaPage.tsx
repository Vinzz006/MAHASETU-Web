import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import {
  LifeBuoy, Search, AlertTriangle, CheckCircle2, RefreshCw,
  Send, Sparkles, Clock, ArrowRight, Zap, ShieldAlert, FileText, Check
} from 'lucide-react';

export const MahaNivaranaPage: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [remediatingId, setRemediatingId] = useState<string | null>(null);

  // Form State
  const [appNumber, setAppNumber] = useState('MH-APP-2026-000184');
  const [citizenName, setCitizenName] = useState('Demo Citizen');
  const [district, setDistrict] = useState('Pune');
  const [category, setCategory] = useState('INCOME_CALCULATION');
  const [description, setDescription] = useState(
    'My application was halted at Department B for income threshold verification, but my valid tehsildar certificate shows income below the ₹3 lakh ceiling.'
  );

  const fetchCases = async () => {
    try {
      const res = await api.getNivaranaCases();
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.submitNivaranaGrievance({
        application_number: appNumber,
        citizen_name: citizenName,
        district: district,
        category: category,
        description: description
      });
      setDescription('');
      await fetchCases();
    } catch (e: any) {
      alert('Submission failed: ' + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemediate = async (caseId: string) => {
    setRemediatingId(caseId);
    try {
      await api.remediateNivaranaCase({
        case_id: caseId,
        action: 'TRIGGER_WORKFLOW_RETRY',
        officer_notes: 'Automated canonical schema normalization applied. Department B re-verification triggered successfully.'
      });
      await fetchCases();
    } catch (e: any) {
      alert('Remediation failed: ' + e.message);
    } finally {
      setRemediatingId(null);
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
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-semibold tracking-wide uppercase mb-3">
          <LifeBuoy className="w-3.5 h-3.5" />
          MahaSetu Nivarana
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
          AI Citizen Grievance Ombudsperson & Root-Cause Tracker
        </h1>
        <p className="mt-2 text-base text-slate-600">
          Instant root-cause diagnostics for delayed or flagged applications. MahaSetu AI deep-traces transactional logs, isolates departmental schema discrepancies, and executes 1-click remediation.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Grievance Submission Form (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              File an Interoperability Grievance
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Universal Application ID
                </label>
                <input
                  type="text"
                  value={appNumber}
                  onChange={(e) => setAppNumber(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Citizen Name
                  </label>
                  <input
                    type="text"
                    value={citizenName}
                    onChange={(e) => setCitizenName(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    District
                  </label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                  >
                    <option value="Pune">Pune</option>
                    <option value="Nagpur">Nagpur</option>
                    <option value="Nashik">Nashik</option>
                    <option value="Chhatrapati Sambhaji Nagar">Chh. Sambhaji Nagar</option>
                    <option value="Solapur">Solapur</option>
                    <option value="Amravati">Amravati</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Issue Classification
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                >
                  <option value="INCOME_CALCULATION">Income Bracket / Eligibility Discrepancy</option>
                  <option value="LAND_RECORD_MISMATCH">Mahabhulekh 7/12 Land Record Unit Mismatch</option>
                  <option value="BANK_DBT_DISBURSAL">DBT Disbursal / PFMS e-Kuber Clearing Lag</option>
                  <option value="WORKFLOW_TIMEOUT">Inter-Departmental SLA Timeout Delay</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Describe Your Issue
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Submit & Trigger AI Root-Cause Diagnostic
              </button>
            </form>
          </div>
        </div>

        {/* Right: Active Cases & AI Root-Cause Diagnostic Reports (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              Diagnosed Cases & Remediation Ledger ({data?.cases?.length || 0})
            </h2>
            <span className="text-xs font-medium text-slate-500">
              Avg AI Confidence: {data?.average_root_cause_confidence}%
            </span>
          </div>

          <div className="space-y-4">
            {data?.cases?.map((c: any) => {
              const isResolved = c.status === 'RESOLVED';
              return (
                <div
                  key={c.case_id}
                  className={`rounded-2xl border p-5 transition-all ${
                    isResolved
                      ? 'bg-slate-50/80 border-slate-200'
                      : 'bg-white border-amber-300/80 shadow-sm ring-1 ring-amber-400/20'
                  }`}
                >
                  {/* Case Header */}
                  <div className="flex items-start justify-between gap-4 mb-3 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                          {c.ticket_number}
                        </span>
                        <span className="text-xs font-semibold text-slate-700">
                          {c.citizen_name} ({c.district})
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-mono">App ID: {c.application_number}</p>
                    </div>
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0 ${
                        isResolved
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}
                    >
                      {isResolved ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> RESOLVED
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> AI DIAGNOSED
                        </>
                      )}
                    </span>
                  </div>

                  {/* Complaint */}
                  <div className="mb-4">
                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-0.5">Citizen Complaint</p>
                    <p className="text-sm text-slate-800 italic bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
                      "{c.citizen_complaint}"
                    </p>
                  </div>

                  {/* AI Deep Trace Findings */}
                  <div className="bg-indigo-950 text-indigo-100 rounded-xl p-4 text-xs space-y-2 mb-4 border border-indigo-900">
                    <div className="flex items-center justify-between text-[11px] text-amber-400 font-bold border-b border-indigo-800/60 pb-1.5">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" /> AI ROOT-CAUSE DIAGNOSTIC
                      </span>
                      <span>Confidence: {c.ai_diagnostics?.confidence_score}%</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Isolated Department</span>
                        <span className="font-semibold text-white">{c.ai_diagnostics?.root_cause_department}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Correlated Transaction</span>
                        <span className="font-mono text-indigo-300">{c.ai_diagnostics?.correlated_transaction_id}</span>
                      </div>
                    </div>

                    <div className="pt-1">
                      <span className="text-slate-400 block text-[10px] uppercase">Technical Signature</span>
                      <p className="font-mono text-[11px] text-amber-300/90 break-words">
                        {c.ai_diagnostics?.technical_error_signature}
                      </p>
                    </div>

                    <div className="pt-1">
                      <span className="text-slate-400 block text-[10px] uppercase">Recommended Remedy</span>
                      <p className="text-slate-200 text-[11px] leading-relaxed">
                        {c.ai_diagnostics?.recommended_remedy}
                      </p>
                    </div>
                  </div>

                  {/* Actions / Status */}
                  <div className="flex items-center justify-between pt-1">
                    {isResolved ? (
                      <div className="text-xs text-emerald-700 flex items-center gap-1.5 font-medium">
                        <Check className="w-4 h-4 text-emerald-600" />
                        Remediation Action: {c.remediation_action}
                      </div>
                    ) : (
                      <button
                        onClick={() => handleRemediate(c.case_id)}
                        disabled={remediatingId === c.case_id}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {remediatingId === c.case_id ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Zap className="w-3.5 h-3.5 text-amber-400" />
                        )}
                        Execute 1-Click Automated Remediation
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
