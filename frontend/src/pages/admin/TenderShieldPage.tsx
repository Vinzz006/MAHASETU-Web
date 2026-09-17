import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import {
  FileText, ShieldAlert, CheckCircle2, RefreshCw, AlertTriangle,
  Building2, Users, Network, ArrowRight, Check, Search
} from 'lucide-react';

export const TenderShieldPage: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTenderId, setSelectedTenderId] = useState('TENDER-BMC-ROADS-2026-88');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);

  const fetchTenders = async () => {
    try {
      const res = await api.getActiveTenders();
      setData(res);
      if (res.tenders?.length && !selectedTenderId) {
        setSelectedTenderId(res.tenders[0].tender_id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenders();
  }, []);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setAnalysisResult(null);
    try {
      const res = await api.analyzeTenderBids(selectedTenderId);
      setAnalysisResult(res);
    } catch (e: any) {
      alert('Analysis failed: ' + e.message);
    } finally {
      setAnalyzing(false);
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
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-100 text-red-900 rounded-full text-xs font-semibold tracking-wide uppercase mb-3">
          <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
          MahaTender — Municipal Procurement Collusion Shield
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
          Municipal Smart Tender Collusion &amp; Cartel Shield
        </h1>
        <p className="mt-2 text-base text-slate-600">
          Machine learning surveillance protecting public procurement across Brihanmumbai (BMC), Pune (PMC), PCMC, and CIDCO. Detects contractor bid-rigging rings, IP address overlaps, cover bidding patterns, and interlocking shadow directorships.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Active Tenders & Bidders List (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-600" />
              Active Municipal Procurement Tenders
            </h2>

            <div className="space-y-3">
              {data?.tenders?.map((t: any) => (
                <div
                  key={t.tender_id}
                  onClick={() => setSelectedTenderId(t.tender_id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer text-xs space-y-2 ${
                    selectedTenderId === t.tender_id
                      ? 'border-indigo-500 bg-indigo-50/50 shadow-sm'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-900">{t.tender_id}</span>
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                      ₹{t.estimated_value_cr} Cr Value
                    </span>
                  </div>

                  <div>
                    <span className="font-bold text-slate-900 text-sm">{t.project_title}</span>
                    <p className="text-slate-500 text-[11px] mt-0.5">{t.corporation}</p>
                  </div>

                  {/* Bidders preview */}
                  <div className="space-y-1 pt-1 border-t border-slate-200/60">
                    <span className="text-[10px] uppercase text-slate-400 block font-semibold">Submitted Bids ({t.bidders.length})</span>
                    {t.bidders.map((b: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-[11px] text-slate-700">
                        <span className="truncate">{b.bidder_name}</span>
                        <span className="font-mono font-semibold">₹{b.bid_quote_cr} Cr</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {analyzing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Network className="w-4 h-4 text-amber-400" />}
              Run Graph Anti-Collusion Cartel Analysis
            </button>
          </div>
        </div>

        {/* Right: Cartel Analysis Report (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          {analysisResult ? (
            <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-xl p-6 space-y-4 animate-in fade-in duration-300 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className={`font-bold flex items-center gap-1.5 ${
                  analysisResult.collusion_verdict === 'HIGH_CARTEL_RISK' ? 'text-red-400' : 'text-emerald-400'
                }`}>
                  <AlertTriangle className="w-4 h-4" /> {analysisResult.collusion_verdict}
                </span>
                <span className="font-mono text-[10px] text-slate-400">
                  CARTEL SCORE: {analysisResult.cartelization_probability_pct}%
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase text-slate-400 block">Target Tender</span>
                <p className="font-mono text-xs text-white mt-0.5">{analysisResult.tender_id} ({analysisResult.corporation})</p>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] uppercase text-slate-400 block font-bold">Vigilance Anomalies Detected</span>
                {analysisResult.anomalies_detected?.map((a: string, idx: number) => (
                  <p key={idx} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-[11px] text-red-300">
                    ⚠ {a}
                  </p>
                ))}
              </div>

              <div className={`p-3.5 rounded-xl border text-[11px] ${
                analysisResult.recommended_vigilance_action === 'ISSUE_ACB_INSPECTION_NOTICE'
                  ? 'bg-red-950/70 border-red-800 text-red-200'
                  : 'bg-emerald-950/70 border-emerald-800 text-emerald-200'
              }`}>
                <p className="font-bold mb-0.5">Statutory Vigilance Action</p>
                <p className="font-mono text-[10px]">{analysisResult.recommended_vigilance_action}</p>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-8 text-center space-y-3">
              <Network className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-700">Procurement Surveillance Ready</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Select a municipal procurement tender and run the anti-collusion inspector to evaluate submission IP subnet collisions and cover bidding algorithms.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
