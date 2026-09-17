import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import {
  BrainCircuit, Search, CheckCircle2, RefreshCw, Terminal,
  Database, ShieldCheck, Check, Sparkles, Send, Table
} from 'lucide-react';

export const PolicyCopilotPage: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [question, setQuestion] = useState('Show me all talukas in Marathwada where PDS grain stock is below 20% and groundwater is below 12 mbgl.');
  const [asking, setAsking] = useState(false);
  const [queryResult, setQueryResult] = useState<any | null>(null);

  const fetchQueries = async () => {
    try {
      const res = await api.getSamplePolicyQueries();
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueries();
  }, []);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    setAsking(true);
    setQueryResult(null);
    try {
      const res = await api.askPolicyCopilot(question);
      setQueryResult(res);
    } catch (e: any) {
      alert('Copilot query failed: ' + e.message);
    } finally {
      setAsking(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <RefreshCw className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-900 rounded-full text-xs font-semibold tracking-wide uppercase mb-3">
          <BrainCircuit className="w-3.5 h-3.5 text-purple-600" />
          MahaPrashna — Natural Language Policy SQL Copilot
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
          Executive Policy AI &amp; Cross-Departmental Query Copilot
        </h1>
        <p className="mt-2 text-base text-slate-600">
          Empowering the Chief Secretary, Additional Chief Secretaries, and District Collectors to query Maharashtra's multi-departmental data lake in plain English or Marathi. Translates natural language into verified read-only SQL queries with real-time correlation reports.
        </p>
      </div>

      {/* Curated Sample Queries */}
      <div className="mb-6 space-y-2">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block">Recommended Executive Queries</span>
        <div className="flex flex-wrap gap-2">
          {data?.queries?.map((q: any) => (
            <button
              key={q.query_id}
              onClick={() => setQuestion(q.question_text)}
              className="text-xs py-1.5 px-3 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-900 transition-colors text-left font-medium"
            >
              {q.question_text}
            </button>
          ))}
        </div>
      </div>

      {/* Query Bar */}
      <form onSubmit={handleAsk} className="mb-8">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask any policy, fiscal, or inter-departmental question..."
              className="w-full pl-4 pr-10 py-3 rounded-2xl border border-slate-300 bg-white shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>
          <button
            type="submit"
            disabled={asking}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-2xl transition-colors shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
          >
            {asking ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Ask Copilot
          </button>
        </div>
      </form>

      {/* Query Result Section */}
      {queryResult && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Executive Summary Banner */}
          <div className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white p-6 rounded-2xl border border-purple-800 shadow-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-widest text-purple-300 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Executive Analysis &amp; Findings
              </span>
              <span className="text-[10px] font-mono bg-purple-950/80 px-2 py-0.5 rounded text-purple-200">
                Execution: {queryResult.query_execution_time_ms} ms
              </span>
            </div>
            <p className="text-sm font-semibold text-purple-50 leading-relaxed">
              {queryResult.executive_summary}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Synthesized SQL Query (5 cols) */}
            <div className="lg:col-span-5 bg-slate-900 text-slate-200 p-5 rounded-2xl border border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-purple-400 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5" /> Synthesized Read-Only SQL
                </span>
                <span className="text-[10px] font-bold text-emerald-400">SAFE GUARDRAIL</span>
              </div>
              <pre className="font-mono text-[11px] text-amber-300 overflow-x-auto p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                {queryResult.synthesized_sql_query}
              </pre>
              <p className="text-[10px] text-slate-500 font-mono">
                {queryResult.security_sandbox}
              </p>
            </div>

            {/* Right: Tabular Results (7 cols) */}
            <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Table className="w-3.5 h-3.5 text-purple-600" /> Cross-Departmental Correlation Results
                </h3>
                <span className="text-[10px] text-slate-500">Live Query Output</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 text-[10px] uppercase font-semibold">
                      {Object.keys(queryResult.tabular_correlation_results[0] || {}).map((key) => (
                        <th key={key} className="py-2 px-3">{key.replace(/_/g, ' ')}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {queryResult.tabular_correlation_results.map((row: any, idx: number) => (
                      <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50/50">
                        {Object.values(row).map((val: any, vIdx: number) => (
                          <td key={vIdx} className="py-2.5 px-3 font-medium text-slate-800">
                            {String(val)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
