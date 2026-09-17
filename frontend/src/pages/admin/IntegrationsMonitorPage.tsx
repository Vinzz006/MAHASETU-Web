import React, { useState, useEffect } from 'react';
import { api, DashboardMetrics } from '../../api/client';
import { useDemo } from '../../context/DemoContext';
import { Layers, Activity, CheckCircle2, AlertTriangle, Database, Terminal, ArrowRight, Play, RefreshCw } from 'lucide-react';

export const IntegrationsMonitorPage: React.FC = () => {
  const { inspectTransformation } = useDemo();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Legacy Adapter Sandbox State
  const [legacyInput, setLegacyInput] = useState('CIT001|Demo Citizen|Pune|MH');
  const [legacyOutput, setLegacyOutput] = useState<any | null>(null);
  const [legacyLoading, setLegacyLoading] = useState(false);

  const loadMetrics = async () => {
    try {
      const [m, txns] = await Promise.all([
        api.getDashboardMetrics(),
        api.getRecentTransactions(20).catch(() => [])
      ]);
      setMetrics(m);
      setTransactions(txns);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  const handleTestLegacyParser = async () => {
    setLegacyLoading(true);
    try {
      const res = await api.traceTransformation('LEGACY_01', 'DEPT_B', legacyInput);
      setLegacyOutput(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLegacyLoading(false);
    }
  };

  if (loading || !metrics) {
    return (
      <div className="max-w-6xl mx-auto py-20 text-center text-sm text-slate-500">
        Loading Interoperability Telemetry...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs font-bold text-sky-700 uppercase tracking-wider mb-1">
          <Layers className="w-4 h-4" />
          <span>Interoperability Architecture Monitor</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
          Department Connector Health & Legacy Adapters
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Monitoring 4 heterogeneous interfaces communicating through the MahaSetu Canonical Hub without invasive system modification.
        </p>
      </div>

      {/* Connectors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        {metrics.department_health.map((dept) => {
          const isHealthy = dept.status === 'HEALTHY';
          return (
            <div
              key={dept.department_id}
              className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                    {dept.department_id}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                      isHealthy
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800 animate-pulse'
                    }`}
                  >
                    {isHealthy ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                    {dept.status}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 mb-1">
                  {dept.name}
                </h3>
                <p className="text-xs text-slate-500 font-mono mb-4">
                  Interface: {dept.type}
                </p>

                {/* Metrics detail table */}
                <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200 mb-4">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Requests Processed:</span>
                    <strong className="text-slate-800">{dept.requests_count.toLocaleString()}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Success Rate:</span>
                    <strong className={dept.success_rate > 95 ? 'text-emerald-700' : 'text-rose-700'}>
                      {dept.success_rate}%
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Avg Latency:</span>
                    <strong className="text-slate-800">{dept.avg_latency_ms} ms</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Error Count:</span>
                    <strong className={dept.error_count > 10 ? 'text-rose-700' : 'text-slate-800'}>
                      {dept.error_count}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
                <span>Last Sync: {dept.last_sync}</span>
                <button
                  onClick={() => inspectTransformation(dept.department_id, 'DEPT_B')}
                  className="text-blue-700 hover:text-blue-900 font-bold flex items-center gap-1"
                >
                  <span>Inspect Transformation</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Inter-Departmental Exchange Stream & Canonical Routing */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-10">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-amber-600" />
            <h3 className="font-bold text-slate-900 text-sm">
              Live Inter-Departmental Exchange Stream &amp; Canonical Routing
            </h3>
          </div>
          <span className="text-[10px] bg-amber-500/15 text-amber-800 border border-amber-500/30 px-2 py-0.5 rounded font-mono font-bold">
            Schema v2.1-canonical
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-50/50 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Application #</th>
                <th className="py-3 px-4">Canonical Schema</th>
                <th className="py-3 px-4">Routing Pathway</th>
                <th className="py-3 px-4">Operation</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    No transactions recorded yet. Run a workflow to view live inter-department exchange.
                  </td>
                </tr>
              ) : (
                transactions.map((t: any) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {t.application_number}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded font-bold">
                        {t.schema_version || 'v2.1-canonical'}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-medium text-slate-800">
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-semibold border border-slate-200">
                          {t.source_department || 'PORTAL'}
                        </span>
                        <ArrowRight className="w-3 h-3 text-amber-500 shrink-0" />
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-semibold border border-slate-200">
                          {t.destination_department || t.department_id}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                      {t.operation}
                    </td>
                    <td className="py-3 px-4">
                      {t.status === 'SUCCESS' ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" />
                          SUCCESS
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          <AlertTriangle className="w-3 h-3" />
                          FAILED {t.retry_count > 0 && `(${t.retry_count} retries)`}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => inspectTransformation(t.source_department || 'DEPT_A', t.destination_department || 'DEPT_B')}
                        className="text-blue-700 hover:text-blue-900 font-bold text-[11px] hover:underline"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 5: Legacy Adapter Interactive Sandbox */}
      <div className="bg-slate-900 rounded-xl border border-slate-700 shadow-xl overflow-hidden text-white mb-8">
        <div className="bg-[#0f2942] p-5 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Legacy Mainframe System Adapter Sandbox</h3>
              <p className="text-xs text-slate-300">
                Demonstrating how existing COBOL/mainframe pipe streams participate in modern workflows
              </p>
            </div>
          </div>
          <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-1 rounded border border-slate-600 font-mono">
            SECTION 5 DEMO
          </span>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs font-mono">
          <div>
            <label className="block text-slate-400 font-semibold mb-2">
              Raw Legacy Pipe Payload: (Format: ID|Name|District|State)
            </label>
            <input
              type="text"
              value={legacyInput}
              onChange={(e) => setLegacyInput(e.target.value)}
              className="w-full bg-slate-950 text-amber-300 border border-slate-700 rounded-lg p-3 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none mb-3"
            />
            <p className="text-[11px] text-slate-400 mb-4 font-sans leading-relaxed">
              Old government mainframes cannot consume JSON APIs. MahaSetu's Legacy Adapter parses 
              flat strings into the Canonical Data Model without requiring mainframe hardware upgrades.
            </p>
            <button
              onClick={handleTestLegacyParser}
              disabled={legacyLoading}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg font-sans text-xs transition-colors flex items-center gap-2 shadow"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{legacyLoading ? 'Parsing Stream...' : 'Parse Through Canonical Adapter'}</span>
            </button>
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-2">
              Output Transformed to Target Department B JSON:
            </label>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-[11px] h-48 overflow-y-auto text-slate-300">
              {legacyOutput ? (
                <pre>{JSON.stringify(legacyOutput.stage_3_transformed_target, null, 2)}</pre>
              ) : (
                <div className="text-slate-600 flex items-center justify-center h-full font-sans">
                  Click 'Parse Through Canonical Adapter' to execute transformation
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
