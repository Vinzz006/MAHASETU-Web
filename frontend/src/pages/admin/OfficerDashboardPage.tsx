import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, DashboardMetrics } from '../../api/client';
import { useDemo } from '../../context/DemoContext';
import {
  Activity, Layers, AlertTriangle, CheckCircle2, Clock, RefreshCw,
  TrendingUp, ArrowRight, ShieldCheck, Database, Search
} from 'lucide-react';

export const OfficerDashboardPage: React.FC = () => {
  const { isFailureSimulated, toggleFailure, inspectTransformation } = useDemo();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentApps, setRecentApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [m, apps] = await Promise.all([
        api.getDashboardMetrics(),
        api.getApplications()
      ]);
      setMetrics(m);
      setRecentApps(apps.slice(0, 8));
      setError(null);
    } catch (e: any) {
      console.error('Failed to load dashboard metrics', e);
      setError(e.message || 'Failed to load telemetry data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 4000);
    return () => clearInterval(interval);
  }, []);

  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleRetryException = async (appId: string) => {
    setRetryingId(appId);
    try {
      await api.retryWorkflow(appId);
      await loadData();
    } catch (e) {
      console.error(e);
    } finally {
      setRetryingId(null);
    }
  };

  const handleGrantApplication = async (appId: string) => {
    setActionLoading(appId);
    try {
      await api.advanceWorkflow(appId);
      await loadData();
    } catch (e: any) {
      alert(e.message || 'Failed to advance application workflow');
    } finally {
      setActionLoading(null);
    }
  };

  if (error && !metrics) {
    return (
      <div className="max-w-xl mx-auto my-20 p-6 bg-rose-50 border border-rose-200 rounded-xl text-center space-y-3">
        <AlertTriangle className="w-8 h-8 text-rose-600 mx-auto" />
        <h3 className="text-sm font-bold text-rose-900">Command Center Telemetry Unavailable</h3>
        <p className="text-xs text-rose-700">{error}</p>
        <button
          onClick={() => {
            setLoading(true);
            setError(null);
            loadData();
          }}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg shadow transition-colors"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  if (loading || !metrics) {
    return (
      <div className="max-w-7xl mx-auto py-20 text-center text-sm text-slate-500">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-amber-500 border-t-transparent mb-3"></div>
        <div>Connecting to MahaSetu Interoperability Hub Command Center...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-sky-800 uppercase tracking-wider mb-1">
            <Activity className="w-4 h-4 text-sky-600" />
            <span>MahaSetu Officer Interoperability Command Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            Cross-Department Integration & SLA Monitoring
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time telemetry across connected departmental registries and adapter pipelines
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => toggleFailure()}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all shadow flex items-center gap-1.5 ${
              isFailureSimulated
                ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{isFailureSimulated ? 'Dept B Outage: Active (Click to Resolve)' : 'Simulate Dept B Failure'}</span>
          </button>

          <Link
            to="/admin/schema-mapper"
            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-lg text-xs transition-colors shadow"
          >
            AI Schema Assistant
          </Link>
        </div>
      </div>

      {/* 4 Main KPI Cards (Section 23) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {/* Card 1: Applications */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold uppercase tracking-wider">Total Applications</span>
            <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded text-[10px]">+14% MoM</span>
          </div>
          <div className="text-3xl font-black text-slate-900 mb-1">
            {metrics.total_applications.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500">
            Across 36 Maharashtra Districts
          </div>
        </div>

        {/* Card 2: Integration Success */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold uppercase tracking-wider">Integration Success</span>
            <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${metrics.integration_success_rate > 95 ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'}`}>
              {metrics.integration_success_rate > 95 ? 'Optimal' : 'Degraded'}
            </span>
          </div>
          <div className={`text-3xl font-black mb-1 ${metrics.integration_success_rate > 95 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {metrics.integration_success_rate}%
          </div>
          <div className="text-[11px] text-slate-500">
            Cross-department API transactions
          </div>
        </div>

        {/* Card 3: Avg Processing Time */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold uppercase tracking-wider">Avg Processing Time</span>
            <span className="text-blue-700 font-bold bg-blue-50 px-1.5 py-0.5 rounded text-[10px]">-68% vs Legacy</span>
          </div>
          <div className="text-3xl font-black text-slate-900 mb-1">
            {metrics.avg_processing_time_days} <span className="text-base font-normal text-slate-500">days</span>
          </div>
          <div className="text-[11px] text-slate-500">
            Down from 12 days manual coordination
          </div>
        </div>

        {/* Card 4: SLA Compliance */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold uppercase tracking-wider">SLA Compliance</span>
            <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded text-[10px]">Target: 90%</span>
          </div>
          <div className="text-3xl font-black text-slate-900 mb-1">
            {metrics.sla_compliance_rate}%
          </div>
          <div className="text-[11px] text-slate-500">
            Within Citizens Charter timeframe
          </div>
        </div>
      </div>

      {/* Grid: Department Health & Recent Exceptions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Department System Health (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Federated Department Connectors</h2>
              <p className="text-xs text-slate-500">Heterogeneous systems communicating via Canonical Adapter abstractions</p>
            </div>
            <Link
              to="/admin/integrations"
              className="text-xs text-blue-700 font-semibold hover:underline flex items-center gap-1"
            >
              <span>Full Health Monitor</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {metrics.department_health.map((dept) => {
              const isHealthy = dept.status === 'HEALTHY';
              return (
                <div
                  key={dept.department_id}
                  className="p-4 rounded-lg border border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-4 hover:border-slate-300 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900">
                        {dept.name}
                      </span>
                      <span className="text-[10px] text-slate-500 bg-white px-1.5 py-0.2 rounded border border-slate-200">
                        {dept.type}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-4">
                      <span>Requests: <strong>{dept.requests_count}</strong></span>
                      <span>Success: <strong>{dept.success_rate}%</strong></span>
                      <span>Latency: <strong>{dept.avg_latency_ms}ms</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-bold ${
                        isHealthy
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800 animate-pulse'
                      }`}
                    >
                      {isHealthy ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" /> Healthy
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-3.5 h-3.5" /> Outage Simulated
                        </>
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Integration Exceptions & Failure Handling (1 Col) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900">Integration Exceptions</h2>
              <span className="text-[10px] font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                Resilience Queue
              </span>
            </div>

            {metrics.recent_exceptions.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <p className="font-semibold text-slate-700">All Integrations Operating Normally</p>
                <p className="text-slate-400 mt-1">
                  Use "Simulate Dept B Failure" to demonstrate automated retries and exception capture.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {metrics.recent_exceptions.map((ex) => (
                  <div
                    key={ex.id}
                    className="p-3.5 rounded-lg border border-rose-300 bg-rose-50 text-xs text-rose-950 space-y-2 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <strong className="font-mono text-rose-900">{ex.application_number}</strong>
                      <span className="text-[10px] font-bold bg-rose-200 text-rose-900 px-2 py-0.5 rounded">
                        {ex.status}
                      </span>
                    </div>

                    <div className="text-[11px] text-rose-800">
                      Dept: <strong>{ex.department_id}</strong> • Op: <code className="bg-rose-100 px-1 rounded">{ex.operation}</code>
                    </div>

                    <p className="text-[10px] text-rose-700 font-mono line-clamp-2">
                      {ex.error_message}
                    </p>

                    <div className="pt-2 border-t border-rose-200 flex items-center justify-between">
                      <span className="text-[10px] text-rose-800 font-semibold">
                        Retries: {ex.retry_count}
                      </span>

                      <button
                        onClick={() => handleRetryException(ex.application_id)}
                        disabled={retryingId === ex.application_id}
                        className="px-2.5 py-1 bg-rose-800 hover:bg-rose-700 text-white rounded font-bold text-[10px] shadow"
                      >
                        {retryingId === ex.application_id ? 'Retrying...' : 'Resolve & Retry'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
            Non-swallowing exception architecture ensures zero lost records.
          </div>
        </div>
      </div>

      {/* Applications Queue Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-xs">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-sm">
            Live Service Passport Registry
          </h3>
          <span className="text-slate-500 text-xs">
            Showing recent applications across departments
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-100 text-slate-600 font-semibold text-[11px] border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="p-3">Universal App ID</th>
                <th className="p-3">Beneficiary</th>
                <th className="p-3">Service Scheme</th>
                <th className="p-3">Status</th>
                <th className="p-3">Current Dept</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentApps.map((app) => (
                <tr key={app.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-3 font-mono font-bold text-blue-900">
                    {app.application_number}
                  </td>
                  <td className="p-3 text-slate-800 font-medium">
                    {app.citizen_name}
                  </td>
                  <td className="p-3 text-slate-600">
                    {app.service_name}
                  </td>
                  <td className="p-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        app.status === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : app.status === 'EXCEPTION'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {app.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-slate-600">
                    {app.current_department}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {app.status !== 'COMPLETED' && app.status !== 'EXCEPTION' && (
                        <button
                          onClick={() => handleGrantApplication(app.id)}
                          disabled={actionLoading === app.id}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-xs transition-colors shadow-sm flex items-center gap-1"
                          title={`Grant acceptance and advance workflow for ${app.current_department}`}
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{actionLoading === app.id ? 'Granting...' : `✓ Grant ${app.current_department}`}</span>
                        </button>
                      )}
                      <Link
                        to={`/applications/${app.id}/track`}
                        className="inline-flex items-center gap-1 text-blue-700 hover:text-blue-900 font-bold text-xs"
                      >
                        <span>Inspect</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
