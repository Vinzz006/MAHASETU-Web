import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Clock, ShieldAlert, CheckCircle2, AlertTriangle, Zap, Check, ArrowRight, TrendingUp } from 'lucide-react';

export const SLAMonitorPage: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [expeditingId, setExpeditingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const res = await api.getSLAMonitoring();
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleExpedite = async (appId: string) => {
    setExpeditingId(appId);
    setSuccessMessage(null);
    try {
      const res = await api.escalateSLA(appId);
      setSuccessMessage(res.message);
      await loadData();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (e: any) {
      alert('Failed to expedite: ' + e.message);
    } finally {
      setExpeditingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">
          <Clock className="w-4 h-4 text-amber-600" />
          <span>Statutory Citizen Charter Compliance</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
          SLA Breach & Auto-Escalation Engine
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Ensures inter-department workflows adhere to Maharashtra Right to Public Services Act (RTSA) delivery timelines.
        </p>
      </div>

      {successMessage && (
        <div className="mb-6 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8 text-xs">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-slate-400 block text-[10px] uppercase font-bold">Statutory SLA Compliance</span>
          <div className="flex items-baseline gap-2 mt-1">
            <strong className="text-2xl font-black text-emerald-700">
              {data?.compliance_rate || 94.2}%
            </strong>
            <span className="text-[10px] text-slate-400">Target: 90%</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-emerald-600 h-full rounded-full"
              style={{ width: `${data?.compliance_rate || 94.2}%` }}
            />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-slate-400 block text-[10px] uppercase font-bold">On-Track Processing</span>
          <strong className="text-2xl font-black text-slate-900 block mt-1">
            {data?.on_track_count || 0}
          </strong>
          <span className="text-[10px] text-emerald-700 font-semibold mt-2 block">
            Within 70% of 72h window
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-slate-400 block text-[10px] uppercase font-bold">Approaching Breach</span>
          <strong className="text-2xl font-black text-amber-600 block mt-1">
            {data?.at_risk_count || 0}
          </strong>
          <span className="text-[10px] text-amber-700 font-semibold mt-2 block">
            &gt; 70% elapsed window
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-slate-400 block text-[10px] uppercase font-bold">Statutory Breaches</span>
          <strong className="text-2xl font-black text-rose-600 block mt-1">
            {data?.breached_count || 0}
          </strong>
          <span className="text-[10px] text-rose-700 font-semibold mt-2 block">
            Auto-escalated to District Officer
          </span>
        </div>
      </div>

      {/* SLA In-Flight Application Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-xs">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <span className="font-bold text-slate-800">
            In-Flight Inter-Department Applications ({data?.applications?.length || 0})
          </span>
          <span className="text-[11px] text-slate-500">
            Statutory RTSA Window: 3 Days (72 Hours)
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500">Evaluating SLA timelines...</div>
        ) : data?.applications?.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">All applications completed within statutory SLA</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-100 text-[10px] uppercase font-bold text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="p-3">Application ID</th>
                  <th className="p-3">Beneficiary</th>
                  <th className="p-3">Current Custody</th>
                  <th className="p-3">Time Remaining</th>
                  <th className="p-3">SLA Progress</th>
                  <th className="p-3">Severity</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.applications?.map((app: any) => {
                  const isBreached = app.severity === 'BREACHED';
                  const isAtRisk = app.severity === 'AT_RISK';
                  return (
                    <tr key={app.application_id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3 font-mono font-bold text-blue-900">
                        {app.application_number}
                      </td>
                      <td className="p-3 font-semibold text-slate-800">
                        {app.beneficiary_name}
                      </td>
                      <td className="p-3 text-slate-600">
                        <strong className="text-slate-800">{app.current_department}</strong>
                      </td>
                      <td className="p-3 font-mono">
                        {isBreached ? (
                          <span className="text-rose-700 font-bold">BREACHED</span>
                        ) : (
                          <span className="text-slate-700 font-bold">{app.time_remaining_hours} hrs</span>
                        )}
                      </td>
                      <td className="p-3 w-40">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                isBreached ? 'bg-rose-600' : isAtRisk ? 'bg-amber-500' : 'bg-emerald-600'
                              }`}
                              style={{ width: `${Math.min(100, app.percentage_elapsed)}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-mono text-slate-500">{app.percentage_elapsed}%</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                            isBreached
                              ? 'bg-rose-100 text-rose-800'
                              : isAtRisk
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {app.severity}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleExpedite(app.application_id)}
                          disabled={expeditingId === app.application_id}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-colors inline-flex items-center gap-1 shadow"
                          title="Auto-escalate to District Officer queue and prioritize"
                        >
                          <Zap className="w-3 h-3 fill-current" />
                          <span>{expeditingId === app.application_id ? 'Expediting...' : 'Expedite'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
