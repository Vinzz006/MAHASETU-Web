import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import {
  FileSearch, ShieldCheck, AlertTriangle, RefreshCw,
  QrCode, FileCheck, Search, Award, CheckCircle2, ShieldAlert
} from 'lucide-react';

export const DocumentForensicsPage: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [docName, setDocName] = useState('7-12_Land_Extract_Demo.pdf');
  const [docType, setDocType] = useState('LAND_RECORD_EXTRACT');
  const [simulateTamper, setSimulateTamper] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);

  const fetchHistory = async () => {
    try {
      const res = await api.getForensicsHistory();
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setAnalysisResult(null);
    try {
      const res = await api.analyzeDocumentForensics({
        document_name: docName,
        doc_type: docType,
        simulate_tamper: simulateTamper
      });
      setAnalysisResult(res);
      fetchHistory();
    } catch (e: any) {
      alert('Forensics analysis failed: ' + e.message);
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
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-900 rounded-full text-xs font-semibold tracking-wide uppercase mb-3">
          <FileSearch className="w-3.5 h-3.5 text-amber-600" />
          MahaSatya — Multi-Modal AI Forensics
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
          AI Document Forensics &amp; Tamper Verification
        </h1>
        <p className="mt-2 text-base text-slate-600">
          Automated fraud detection for uploaded certificates. Evaluates font glyph kerning, QR code cryptographic signatures, raster seal geometry, and PDF metadata to detect Photoshop alterations before application processing.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Interactive Forensics Scanner (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Search className="w-4 h-4 text-indigo-600" />
              Document Forensics Scanner
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Document File Name
              </label>
              <input
                type="text"
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Document Classification
              </label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 bg-white"
              >
                <option value="LAND_RECORD_EXTRACT">7/12 Land Record Extract (Mahabhulekh)</option>
                <option value="INCOME_CERTIFICATE">Tehsildar Annual Income Certificate</option>
                <option value="CASTE_VALIDITY">Caste Scrutiny Committee Certificate</option>
                <option value="DIVYANG_DISABILITY">Divyang Disability Identity Card</option>
              </select>
            </div>

            {/* Tamper Simulation Toggle */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-900 block">Inject Simulated Forgery</span>
                <span className="text-[11px] text-slate-500">Simulate font kerning discrepancy and QR payload mismatch</span>
              </div>
              <input
                type="checkbox"
                checked={simulateTamper}
                onChange={(e) => setSimulateTamper(e.target.checked)}
                className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500 cursor-pointer"
              />
            </div>

            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {analyzing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileSearch className="w-4 h-4" />}
              Run Multi-Modal Forensic Analysis
            </button>

            {/* Recent Screening History */}
            <div className="pt-4 border-t border-slate-200">
              <span className="text-xs font-bold text-slate-700 block mb-2">Recent Forensic Audits</span>
              <div className="space-y-2">
                {data?.recent_audits?.map((aud: any) => (
                  <div key={aud.audit_id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900 text-[11px]">{aud.document_name}</p>
                      <span className="text-[10px] text-slate-500">{aud.doc_type}</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      aud.integrity_score_pct > 80 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {aud.integrity_score_pct}% Score
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Forensic Verification Report (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          {analysisResult ? (
            <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-xl p-6 space-y-4 animate-in fade-in duration-300 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className={`font-bold flex items-center gap-1.5 ${
                  analysisResult.integrity_score_pct > 80 ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {analysisResult.integrity_score_pct > 80 ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  {analysisResult.verdict}
                </span>
                <span className="font-mono text-[10px] text-amber-300">{analysisResult.audit_id}</span>
              </div>

              <div>
                <span className="text-[10px] uppercase text-slate-400 block mb-1">Integrity Score</span>
                <div className="flex items-center gap-3">
                  <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${analysisResult.integrity_score_pct > 80 ? 'bg-emerald-500' : 'bg-red-500'}`}
                      style={{ width: `${analysisResult.integrity_score_pct}%` }}
                    />
                  </div>
                  <span className="font-bold text-sm text-white shrink-0">
                    {analysisResult.integrity_score_pct}%
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <span className="text-[10px] uppercase text-slate-400 block font-bold">Multi-Modal Forensic Breakdown</span>
                
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase text-amber-400 font-semibold block">Font Kerning &amp; Typography</span>
                  <p className="text-[11px] text-slate-300">{analysisResult.forensic_breakdown.font_kerning_analysis}</p>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase text-amber-400 font-semibold block">QR Cryptographic Signature</span>
                  <p className="text-[11px] text-slate-300">{analysisResult.forensic_breakdown.qr_code_signature}</p>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase text-amber-400 font-semibold block">Official Seal Raster Geometry</span>
                  <p className="text-[11px] text-slate-300">{analysisResult.forensic_breakdown.official_seal_verification}</p>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase text-amber-400 font-semibold block">Metadata &amp; Binary Artifacts</span>
                  <p className="text-[11px] text-slate-300">{analysisResult.forensic_breakdown.metadata_exif_audit}</p>
                </div>
              </div>

              <div className={`p-3 rounded-xl border text-xs ${
                analysisResult.integrity_score_pct > 80
                  ? 'bg-emerald-950/70 border-emerald-800 text-emerald-200'
                  : 'bg-red-950/70 border-red-800 text-red-200'
              }`}>
                <p className="font-bold mb-0.5">Automated AI Decision</p>
                <p className="text-[11px]">{analysisResult.recommendation}</p>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-8 text-center space-y-3">
              <FileSearch className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-700">Forensics Engine Ready</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Trigger the analysis to inspect how MahaSatya detects document tampering, modified numbers, cloned seals, or confirms genuine authenticity.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
