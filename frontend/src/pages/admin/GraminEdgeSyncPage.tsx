import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { WifiOff, Wifi, RefreshCw, Server, CheckCircle2, Shield, ArrowRight, Zap, Database } from 'lucide-react';

export const GraminEdgeSyncPage: React.FC = () => {
  const [edgeStatus, setEdgeStatus] = useState<any | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      const data = await api.getEdgeSyncStatus();
      setEdgeStatus(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleSimulateSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await api.simulateEdgeBatchSync({
        center_id: 'CSC-GAD-012',
        taluka_name: 'Bhamragad',
        district_name: 'Gadchiroli',
        offline_packets_count: 5
      });
      setSyncResult(res);
      await fetchStatus();
    } catch (e: any) {
      alert('Sync failed: ' + e.message);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">
          <WifiOff className="w-4 h-4 text-emerald-600" />
          <span>MahaSetu Gramin • Rural Store-and-Forward Architecture</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
          Gramin Offline Edge Synchronization
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Enables remote Common Service Centers (Setu Suvidha Kendra) to process applications offline and sync batch payloads into the central Canonical Hub.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 text-xs">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-slate-400 block text-[10px] uppercase font-bold">Architecture Resilience</span>
          <strong className="text-base font-black text-emerald-700 block mt-1">
            Store &amp; Forward (Zero Data Loss)
          </strong>
          <span className="text-[10px] text-slate-500 mt-2 block">
            Offline SQLite micro-cache on edge appliances
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-slate-400 block text-[10px] uppercase font-bold">Conflict Resolution Engine</span>
          <strong className="text-base font-black text-slate-900 block mt-1">
            Canonical Hash Deduplication
          </strong>
          <span className="text-[10px] text-emerald-700 font-semibold mt-2 block">
            Conflict Rate: 0.00% across remote nodes
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-slate-400 block text-[10px] uppercase font-bold">Rural Applications Processed</span>
          <strong className="text-base font-black text-blue-900 font-mono block mt-1">
            {edgeStatus?.total_offline_processed?.toLocaleString() || '1,420'}
          </strong>
          <span className="text-[10px] text-slate-500 mt-2 block">
            Across 36 tribal &amp; agrarian talukas
          </span>
        </div>
      </div>

      {/* Remote Edge Nodes List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-8 text-xs">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <span className="font-bold text-slate-800">
            Remote Common Service Center (CSC) Micro-Nodes
          </span>
          <button
            onClick={handleSimulateSync}
            disabled={syncing}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Synchronizing Edge Cache...' : 'Simulate Rural Batch Sync'}</span>
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {edgeStatus?.centers?.map((c: any) => {
            const isOffline = c.connectivity === 'OFFLINE_QUEUED';
            return (
              <div key={c.center_id} className="p-4 flex flex-wrap items-center justify-between gap-4 hover:bg-slate-50/60">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2.5 rounded-lg border ${
                      isOffline ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    {isOffline ? <WifiOff className="w-5 h-5" /> : <Wifi className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{c.name}</h4>
                    <span className="text-[11px] text-slate-500 font-mono">
                      Taluka: {c.taluka} • District: {c.district} • ID: {c.center_id}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Queue Status</span>
                    <strong className={isOffline ? 'text-amber-800 font-bold' : 'text-emerald-700 font-bold'}>
                      {isOffline ? `${c.pending_offline_applications} Packets Queued` : 'All Synced'}
                    </strong>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                      isOffline ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {c.connectivity}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sync Result Banner */}
      {syncResult && (
        <div className="bg-slate-900 text-white rounded-xl p-6 border border-slate-800 shadow-xl space-y-4 text-xs font-mono">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="font-bold text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              BATCH SYNCHRONIZATION COMPLETED
            </span>
            <span className="text-[10px] text-slate-400">
              {syncResult.sync_timestamp}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] bg-slate-950 p-3 rounded-lg border border-slate-800">
            <div>Center: <strong className="text-slate-200">{syncResult.center_id}</strong></div>
            <div>Taluka: <strong className="text-slate-200">{syncResult.taluka}</strong></div>
            <div>Packets Ingested: <strong className="text-emerald-400">{syncResult.canonical_hub_ingested}</strong></div>
            <div>Conflicts: <strong className="text-emerald-400">0</strong></div>
          </div>

          <div className="space-y-1 text-[11px]">
            <span className="text-slate-400 block text-[10px]">Ingested Rural Applications:</span>
            {syncResult.items.map((it: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-1.5 bg-slate-950/80 rounded border border-slate-800">
                <span className="text-blue-300">{it.generated_application_number}</span>
                <span className="text-emerald-400 text-[10px]">✓ {it.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
