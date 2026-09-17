import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import {
  ShieldAlert, AlertTriangle, CheckCircle2, XCircle, Search,
  Filter, Eye, ArrowRight, ShieldCheck, FileWarning, DollarSign, Building
} from 'lucide-react';

export const FraudDetectorPage: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAnomaly, setSelectedAnomaly] = useState<any | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadAnomalies = async () => {
    try {
      const res = await api.getFraudAnomalies();
      setData(res);
      if (res.anomalies?.length > 0 && !selectedAnomaly) {
        setSelectedAnomaly(res.anomalies[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnomalies();
  }, []);

  const handleResolve = async (action: string) => {
    if (!selectedAnomaly) return;
    setSubmitting(true);
    try {
      await api.resolveFraudAnomaly(selectedAnomaly.id, action, actionNotes || 'Audit review verified by officer.');
      alert(`Action '${action}' applied successfully.`);
      setActionNotes('');
      await loadAnomalies();
    } catch (e: any) {
      alert('Failed: ' + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs font-bold text-rose-600 uppercase tracking-wider mb-1">
          <ShieldAlert className="w-4 h-4 text-rose-600" />
          <span>Cross-Department Discrepancy &amp; Anti-Fraud Intelligence</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
          Cross-Department Anomaly &amp; Fraud Detector
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Detects cross-registry discrepancies (conflicting income declarations, duplicate land 7/12 claims) that isolated department portals can never detect independently.
        </p>
      </div>

      {/* KPI Cards */}
      {data?.summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 text-xs">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Anomalies</span>
            <strong className="text-2xl font-black text-slate-900 block mt-1">
              {data.summary.total_anomalies_detected}
            </strong>
            <span className="text-[10px] text-slate-500 mt-1 block">Cross-referenced live</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-sm">
            <span className="text-rose-600 block text-[10px] uppercase font-bold">High Risk Pending</span>
            <strong className="text-2xl font-black text-rose-600 block mt-1">
              {data.summary.pending_high_risk}
            </strong>
            <span className="text-[10px] text-rose-500 mt-1 block">Requires officer review</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-sm">
            <span className="text-emerald-700 block text-[10px] uppercase font-bold">Fraud Loss Prevented</span>
            <strong className="text-2xl font-black text-emerald-700 block mt-1">
              ₹ {(data.summary.estimated_fraud_loss_prevented_inr / 100000).toFixed(1)} Lakh
            </strong>
            <span className="text-[10px] text-slate-500 mt-1 block">Estimated public savings</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Benefits Frozen</span>
            <strong className="text-2xl font-black text-amber-700 block mt-1">
              {data.summary.benefits_frozen}
            </strong>
            <span className="text-[10px] text-slate-500 mt-1 block">Legal inquiry triggered</span>
          </div>
        </div>
      )}

      {/* Main Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: List */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-xs">
          <div className="p-3.5 bg-slate-50 border-b border-slate-200 font-bold text-slate-800 flex items-center justify-between">
            <span>Flagged Applications</span>
            <span className="text-[11px] text-slate-500 font-normal">
              {data?.anomalies?.length} records
            </span>
          </div>

          <div className="divide-y divide-slate-100 max-h-[560px] overflow-y-auto">
            {data?.anomalies?.map((a: any) => {
              const isSelected = selectedAnomaly?.id === a.id;
              const isHigh = a.severity === 'HIGH';
              return (
                <div
                  key={a.id}
                  onClick={() => setSelectedAnomaly(a)}
                  className={`p-3.5 cursor-pointer transition-colors ${
                    isSelected ? 'bg-rose-50/80 border-l-4 border-rose-600' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-bold text-slate-900">{a.beneficiary_name}</span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded font-mono ${
                        isHigh ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      Risk: {a.risk_score}
                    </span>
                  </div>

                  <div className="text-[11px] font-mono text-blue-900 font-semibold mb-1">
                    {a.application_number}
                  </div>

                  <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                    {a.description}
                  </p>

                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                    <span>{a.district}</span>
                    <span
                      className={`font-semibold ${
                        a.status === 'BENEFIT_FROZEN' ? 'text-rose-600' : a.status === 'CLEARED_BY_OFFICER' ? 'text-emerald-600' : 'text-amber-700'
                      }`}
                    >
                      {a.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Deep Inspector */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6 text-xs space-y-6">
          {selectedAnomaly ? (
            <>
              {/* Header */}
              <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">
                      {selectedAnomaly.beneficiary_name}
                    </h3>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                        selectedAnomaly.severity === 'HIGH' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {selectedAnomaly.severity} SEVERITY • RISK {selectedAnomaly.risk_score}/100
                    </span>
                  </div>
                  <p className="text-slate-500 text-xs mt-0.5 font-mono">
                    Universal ID: {selectedAnomaly.application_number} • District: {selectedAnomaly.district}
                  </p>
                </div>

                <span className="text-[11px] font-mono font-bold px-2 py-1 rounded bg-slate-100 text-slate-700">
                  {selectedAnomaly.id}
                </span>
              </div>

              {/* Narrative */}
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Discrepancy Findings
                </span>
                <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-xl text-slate-800 leading-relaxed text-xs">
                  {selectedAnomaly.description}
                </div>
              </div>

              {/* Cross-Department Comparison */}
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2">
                  Cross-Registry Data Discrepancy Evidence
                </span>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono text-[11px] space-y-2">
                  {Object.entries(selectedAnomaly.discrepancy_details).map(([k, v]: [string, any]) => (
                    <div key={k} className="flex items-center justify-between border-b border-slate-200/70 pb-1">
                      <span className="text-slate-500 uppercase text-[10px]">{k.replace(/_/g, ' ')}:</span>
                      <strong className="text-slate-900">{typeof v === 'number' && k.includes('income') ? `₹ ${v.toLocaleString()}` : String(v)}</strong>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action History */}
              {selectedAnomaly.action_taken && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 text-xs">
                  <strong>Recorded Resolution:</strong> {selectedAnomaly.action_taken}
                </div>
              )}

              {/* Action Console */}
              <div className="pt-4 border-t border-slate-200 space-y-3">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                  Statutory Officer Action &amp; Audit Trail
                </span>

                <input
                  type="text"
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder="Enter audit justification or verification reference..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => handleResolve('FREEZE_BENEFIT')}
                    disabled={submitting}
                    className="px-4 py-2 bg-rose-700 hover:bg-rose-600 text-white font-bold rounded-lg text-xs transition-colors shadow flex items-center gap-1.5"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Freeze Benefit &amp; Trigger Audit</span>
                  </button>

                  <button
                    onClick={() => handleResolve('CLEAR_ANOMALY')}
                    disabled={submitting}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-lg text-xs transition-colors shadow flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Clear Anomaly (Clerical Override)</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="py-20 text-center text-slate-400">
              Select an anomaly from the left queue to inspect evidence.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
