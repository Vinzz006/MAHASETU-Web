import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import {
  ShieldCheck, Search, Filter, Download, RefreshCw, FileText,
  Lock, CheckCircle2, AlertCircle, Eye, X, Copy, Check
} from 'lucide-react';

interface AuditRecord {
  id: string;
  application_id: string | null;
  actor_id: string;
  action: string;
  resource: string;
  metadata: Record<string, any>;
  tamper_hash: string;
  tamper_verified: boolean;
  timestamp: string;
}

interface AuditSummary {
  total_audit_events: number;
  tamper_verified_count: number;
  tamper_verification_rate: number;
  statutory_compliance_status: string;
  events_by_action: Record<string, number>;
  events_by_resource: Record<string, number>;
}

export const AuditLogViewer: React.FC<{ initialApplicationId?: string }> = ({ initialApplicationId }) => {
  const [logs, setLogs] = useState<AuditRecord[]>([]);
  const [summary, setSummary] = useState<AuditSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<'csv' | 'json' | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [resourceFilter, setResourceFilter] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditRecord | null>(null);
  const [copiedHash, setCopiedHash] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const [logsRes, summaryRes] = await Promise.all([
        api.getAuditLogsFiltered({
          application_id: initialApplicationId || undefined,
          action: actionFilter || undefined,
          resource: resourceFilter || undefined,
          search: search || undefined,
          limit: 100
        }),
        api.getAuditSummary()
      ]);
      setLogs(logsRes.logs || []);
      setSummary(summaryRes);
    } catch (err) {
      console.error('Failed to load audit records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, resourceFilter, initialApplicationId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  const handleExportCsv = async () => {
    setExporting('csv');
    try {
      await api.exportAuditCsv({
        application_id: initialApplicationId || undefined,
        action: actionFilter || undefined,
        resource: resourceFilter || undefined
      });
    } catch (e: any) {
      alert(e.message || 'Failed to export CSV');
    } finally {
      setExporting(null);
    }
  };

  const handleExportJson = async () => {
    setExporting('json');
    try {
      await api.exportAuditJson({
        application_id: initialApplicationId || undefined,
        action: actionFilter || undefined
      });
    } catch (e: any) {
      alert(e.message || 'Failed to export JSON');
    } finally {
      setExporting(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const getActionBadgeColor = (action: string) => {
    if (action.includes('CREATED') || action.includes('RESUBMITTED')) {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    }
    if (action.includes('APPROVED') || action.includes('CONFIRMED') || action.includes('VERIFIED')) {
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
    if (action.includes('FLAGGED') || action.includes('FAILED') || action.includes('REJECTED')) {
      return 'bg-rose-100 text-rose-800 border-rose-200';
    }
    if (action.includes('CONSENT')) {
      return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    }
    return 'bg-slate-100 text-slate-800 border-slate-200';
  };

  return (
    <div className="space-y-6">
      {/* Compliance Scorecard Bar */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="p-3 bg-blue-50 text-blue-900 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Audit Events</div>
              <div className="text-xl font-black text-slate-900">{summary.total_audit_events}</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Integrity Verification</div>
              <div className="text-xl font-black text-emerald-700">{summary.tamper_verification_rate}%</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="p-3 bg-purple-50 text-purple-900 rounded-lg">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Storage Policy</div>
              <div className="text-xs font-black text-purple-900 uppercase">Append-Only SHA-256</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="p-3 bg-amber-50 text-amber-900 rounded-lg">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Statutory Status</div>
              <div className="text-xs font-black text-emerald-700">{summary.statutory_compliance_status}</div>
            </div>
          </div>
        </div>
      )}

      {/* Control Bar: Search, Filters & Export */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Actor, Action, Resource or App ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2">
          {/* Action Filter */}
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-medium text-slate-700"
          >
            <option value="">All Actions</option>
            <option value="APPLICATION_CREATED">APPLICATION_CREATED</option>
            <option value="CONSENT_GRANTED">CONSENT_GRANTED</option>
            <option value="IDENTITY_VERIFIED">IDENTITY_VERIFIED</option>
            <option value="ELIGIBILITY_VERIFIED">ELIGIBILITY_VERIFIED</option>
            <option value="APPROVAL_GRANTED">APPROVAL_GRANTED</option>
            <option value="ADMIN_APPROVED">ADMIN_APPROVED</option>
            <option value="AUDITOR_CONFIRMED">AUDITOR_CONFIRMED</option>
            <option value="AUDITOR_FLAGGED">AUDITOR_FLAGGED</option>
            <option value="ADMIN_REWORK_REQUESTED">ADMIN_REWORK_REQUESTED</option>
            <option value="APPLICATION_RESUBMITTED">APPLICATION_RESUBMITTED</option>
            <option value="CITIZEN_PROFILE_VIEWED">CITIZEN_PROFILE_VIEWED</option>
            <option value="CITIZEN_PROFILE_AUDITED">CITIZEN_PROFILE_AUDITED</option>
          </select>

          {/* Resource Filter */}
          <select
            value={resourceFilter}
            onChange={(e) => setResourceFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-medium text-slate-700"
          >
            <option value="">All Domains</option>
            <option value="APPLICATION">APPLICATION</option>
            <option value="CONSENT">CONSENT</option>
            <option value="DEPT_A">DEPT_A (Identity)</option>
            <option value="DEPT_B">DEPT_B (Eligibility)</option>
            <option value="DEPT_C">DEPT_C (Approval)</option>
            <option value="ADMIN">ADMIN</option>
            <option value="AUDIT">AUDIT</option>
            <option value="CITIZEN_PROFILE">CITIZEN_PROFILE</option>
          </select>

          {/* Export Buttons */}
          <button
            onClick={handleExportCsv}
            disabled={exporting === 'csv'}
            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            {exporting === 'csv' ? 'Exporting...' : 'Export CSV'}
          </button>

          <button
            onClick={handleExportJson}
            disabled={exporting === 'json'}
            className="px-3 py-1.5 bg-purple-900 hover:bg-purple-800 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            {exporting === 'json' ? 'Exporting...' : 'Export JSON'}
          </button>

          <button
            onClick={fetchLogs}
            disabled={loading}
            className="p-1.5 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            title="Refresh Audit Records"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Audit Stream Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-purple-900" />
              Statutory Audit Ledger Stream
            </h3>
            <p className="text-xs text-slate-500">
              Cryptographically signed append-only ledger entries per Maharashtra Cyber Security & DPDP Framework.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-500">
            Showing {logs.length} records
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-blue-900 mb-2" />
            Loading cryptographic audit records...
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No audit records found matching the active criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/75 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3 pl-5">Timestamp (UTC)</th>
                  <th className="p-3">Actor ID</th>
                  <th className="p-3">Action Event</th>
                  <th className="p-3">Domain</th>
                  <th className="p-3">Application Ref</th>
                  <th className="p-3">SHA-256 Tamper Verification</th>
                  <th className="p-3 text-right pr-5">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3 pl-5 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('en-IN', { timeZone: 'UTC' })}
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-800 text-[11px]">
                      {log.actor_id}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getActionBadgeColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600 text-xs font-semibold">
                      {log.resource}
                    </td>
                    <td className="p-3 font-mono text-[11px] text-blue-950 font-bold">
                      {log.application_id || '—'}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        {log.tamper_verified ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            Verified Tamper-Evident
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                            <AlertCircle className="w-3 h-3 text-rose-600" />
                            Integrity Warning
                          </span>
                        )}
                        <span className="font-mono text-[10px] text-slate-400 hidden sm:inline" title={log.tamper_hash}>
                          {log.tamper_hash.slice(0, 8)}...
                        </span>
                      </div>
                    </td>
                    <td className="p-3 text-right pr-5">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-1 text-slate-500 hover:text-blue-900 bg-slate-100 hover:bg-blue-50 rounded transition-colors"
                        title="Inspect Complete Audit Metadata"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Metadata Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-purple-900" />
                <h3 className="text-base font-bold text-slate-900">Audit Record Inspector</h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto flex-1 pr-1 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-400 uppercase text-[10px] font-bold block">Audit Log UUID</span>
                  <span className="font-mono text-slate-900 font-bold">{selectedLog.id}</span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase text-[10px] font-bold block">Timestamp (UTC)</span>
                  <span className="font-mono text-slate-900 font-bold">{selectedLog.timestamp}</span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase text-[10px] font-bold block">Actor ID</span>
                  <span className="font-mono text-slate-900 font-bold">{selectedLog.actor_id}</span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase text-[10px] font-bold block">Application ID</span>
                  <span className="font-mono text-blue-900 font-bold">{selectedLog.application_id || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase text-[10px] font-bold block">Action Type</span>
                  <span className="font-bold text-slate-900">{selectedLog.action}</span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase text-[10px] font-bold block">Domain / Resource</span>
                  <span className="font-bold text-slate-900">{selectedLog.resource}</span>
                </div>
              </div>

              {/* Tamper Hash Box */}
              <div className="p-3 bg-purple-50/75 rounded-lg border border-purple-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-900 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-purple-700" />
                    Cryptographic SHA-256 Tamper Hash
                  </span>
                  <button
                    onClick={() => copyToClipboard(selectedLog.tamper_hash)}
                    className="text-[10px] font-bold text-purple-900 hover:text-purple-700 flex items-center gap-1"
                  >
                    {copiedHash ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    {copiedHash ? 'Copied!' : 'Copy Digest'}
                  </button>
                </div>
                <div className="font-mono text-[11px] text-purple-950 break-all select-all font-semibold">
                  {selectedLog.tamper_hash}
                </div>
              </div>

              {/* Metadata JSON */}
              <div>
                <span className="text-slate-600 uppercase text-[10px] font-bold block mb-1">Attached Context Metadata (JSON)</span>
                <pre className="bg-slate-900 text-emerald-400 p-3 rounded-lg overflow-x-auto text-[11px] font-mono">
                  {JSON.stringify(selectedLog.metadata, null, 2)}
                </pre>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 mt-4 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-sm"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
