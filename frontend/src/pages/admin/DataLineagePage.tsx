import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../api/client';
import { GitBranch, ShieldCheck, Database, CheckCircle2, Lock, ArrowRight, Server, Search } from 'lucide-react';

export const DataLineagePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [targetId, setTargetId] = useState(id || 'app-benchmark-184');
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLineage = async (appId: string) => {
    setLoading(true);
    try {
      const res = await api.getDataLineage(appId);
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (targetId) {
      fetchLineage(targetId);
    }
  }, [id]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (targetId.trim()) {
      fetchLineage(targetId.trim());
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs font-bold text-sky-700 uppercase tracking-wider mb-1">
          <GitBranch className="w-4 h-4 text-sky-600" />
          <span>Cryptographic Attribute Provenance</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
          Field-Level Data Lineage Visualizer
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Trace every citizen attribute from authoritative source databases to the Canonical Model and Sanction Credential.
        </p>
      </div>

      {/* Lookup Bar */}
      <form onSubmit={handleSearch} className="mb-8 flex gap-2 max-w-xl">
        <input
          type="text"
          value={targetId}
          onChange={(e) => setTargetId(e.target.value)}
          placeholder="Enter Application ID or UUID"
          className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-sky-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-[#0f2942] hover:bg-[#163352] text-white font-bold rounded-lg text-xs transition-colors shadow"
        >
          {loading ? 'Inspecting Lineage...' : 'Inspect Lineage'}
        </button>
      </form>

      {data && (
        <div className="space-y-6 text-xs">
          {/* Summary Banner */}
          <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-amber-400 block mb-0.5">
                Application Under Audit
              </span>
              <strong className="text-base font-mono text-white block">
                {data.universal_application_id}
              </strong>
              <span className="text-slate-400 text-xs">Beneficiary: {data.beneficiary_name}</span>
            </div>

            <div className="flex items-center gap-6 font-mono text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">Physical Docs Bypassed</span>
                <strong className="text-emerald-400 text-sm">{data.lineage_summary.manual_documents_bypassed} Documents</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Tampering Risk</span>
                <strong className="text-emerald-400 text-sm">{data.lineage_summary.data_tampering_risk}</strong>
              </div>
            </div>
          </div>

          {/* Lineage Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="font-bold text-slate-800">
                Authoritative Attribute Provenance Registry ({data.lineage_records.length} Fields)
              </span>
              <span className="text-[11px] text-slate-500">
                Verified via DPDP Cryptographic Consent
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {data.lineage_records.map((item: any, idx: number) => (
                <div key={idx} className="p-4 hover:bg-slate-50/60 transition-colors">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">{item.field_name}</span>
                      <span className="font-mono text-blue-900 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {item.field_value}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 font-mono text-[10px]">
                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                        Target: {item.canonical_target}
                      </span>
                      <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-200">
                        {item.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200 font-mono">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Authoritative Origin</span>
                      <strong className="text-slate-800">{item.authoritative_source}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Validation Method</span>
                      <strong className="text-emerald-700">{item.validation_method}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Cryptographic Hash Digest</span>
                      <strong className="text-slate-700">0x{item.provenance_hash}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
