import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { MessageSquare, CheckCircle2, Clock, AlertTriangle, Search, Check, FileText } from 'lucide-react';

export const GrievanceManagementPage: React.FC = () => {
  const [grievances, setGrievances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [resolutionText, setResolutionText] = useState('');
  const [resolving, setResolving] = useState(false);

  const loadData = async () => {
    try {
      const data = await api.getGrievances();
      setGrievances(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !resolutionText.trim()) return;
    setResolving(true);
    try {
      await api.resolveGrievance(selectedTicket.id, resolutionText);
      setSelectedTicket(null);
      setResolutionText('');
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setResolving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">
          <MessageSquare className="w-4 h-4" />
          <span>Consolidated Beneficiary Grievance Redressal</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
          Cross-Department Discrepancy Queue
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Unified visibility across participating department complaints (Addressing Problem Statement 26129).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Grievances Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-xs">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <span className="font-bold text-slate-800">
              Active Grievance Tickets ({grievances.length})
            </span>
            <span className="text-[11px] text-slate-500">
              Correlated with Universal Application IDs
            </span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading grievance records...</div>
          ) : grievances.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <p className="font-semibold text-slate-700">No active grievances</p>
              <p className="text-slate-400 text-[11px]">All cross-department discrepancies resolved.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {grievances.map((g) => {
                const isResolved = g.status === 'RESOLVED';
                return (
                  <div
                    key={g.id}
                    onClick={() => setSelectedTicket(g)}
                    className={`p-4 cursor-pointer transition-colors ${
                      selectedTicket?.id === g.id
                        ? 'bg-blue-50/60 border-l-4 border-l-blue-700'
                        : 'hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-blue-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                          {g.ticket_number}
                        </span>
                        <span className="font-semibold text-slate-700">
                          App: {g.application_number}
                        </span>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          isResolved
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {g.status}
                      </span>
                    </div>

                    <div className="text-slate-900 font-semibold mb-1">
                      {g.category.replace(/_/g, ' ')} • Target: <strong className="text-slate-800">{g.department_id}</strong>
                    </div>

                    <p className="text-slate-600 text-[11px] line-clamp-2">
                      {g.description}
                    </p>

                    <div className="mt-2 text-[10px] text-slate-400 flex items-center gap-3">
                      <span>Citizen: {g.citizen_name}</span>
                      <span>•</span>
                      <span>Lodged: {new Date(g.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right 1 Col: Resolution Pane */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 text-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
              Ticket Resolution & Officer Notes
            </h3>

            {selectedTicket ? (
              <div className="space-y-4">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                  <div>Ticket: <strong className="font-mono text-blue-900">{selectedTicket.ticket_number}</strong></div>
                  <div>Application: <strong className="font-mono">{selectedTicket.application_number}</strong></div>
                  <div>Department: <strong>{selectedTicket.department_id}</strong></div>
                  <div>Status: <strong className="text-amber-800 uppercase">{selectedTicket.status}</strong></div>
                </div>

                <div>
                  <span className="font-bold text-slate-700 block mb-1">Citizen Statement:</span>
                  <p className="bg-slate-50 p-2.5 rounded border border-slate-200 text-slate-700 text-[11px] leading-relaxed">
                    {selectedTicket.description}
                  </p>
                </div>

                {selectedTicket.status === 'RESOLVED' ? (
                  <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200 text-emerald-900">
                    <strong className="block font-bold mb-1">Resolution Recorded:</strong>
                    <p className="text-[11px]">{selectedTicket.resolution_notes}</p>
                    <span className="text-[10px] text-emerald-700 block mt-2">
                      Resolved on: {new Date(selectedTicket.resolved_at).toLocaleString()}
                    </span>
                  </div>
                ) : (
                  <form onSubmit={handleResolve} className="space-y-3">
                    <label className="block font-semibold text-slate-700">
                      Officer Resolution Finding:
                    </label>
                    <textarea
                      value={resolutionText}
                      onChange={(e) => setResolutionText(e.target.value)}
                      required
                      rows={4}
                      placeholder="Enter verified department registry findings and resolution notes..."
                      className="w-full p-2.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={resolving}
                      className="w-full py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 shadow"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{resolving ? 'Recording...' : 'Resolve & Close Ticket'}</span>
                    </button>
                  </form>
                )}
              </div>
            ) : (
              <div className="py-16 text-center text-slate-400">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-60" />
                <p>Select a ticket from the left to review and record officer resolution.</p>
              </div>
            )}
          </div>

          <div className="mt-6 pt-3 border-t border-slate-100 text-[10px] text-slate-400">
            Resolutions automatically trigger audit trail entries and update citizen tracking status.
          </div>
        </div>
      </div>
    </div>
  );
};
