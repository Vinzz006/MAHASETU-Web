import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../api/client';
import { ShieldCheck, CheckCircle2, XCircle, Search, Building2, ExternalLink } from 'lucide-react';

export const PublicPassportVerifierPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [queryId, setQueryId] = useState(id || 'MH-APP-2026-000184');
  const [result, setResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const performVerification = async (targetId: string) => {
    setLoading(true);
    try {
      const res = await api.verifyPassport(targetId);
      setResult(res);
    } catch (e) {
      console.error(e);
      setResult({ is_valid: false, message: 'Verification lookup failed' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (queryId) {
      performVerification(queryId);
    }
  }, [id]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (queryId.trim()) {
      performVerification(queryId.trim());
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 flex-1">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-800 border-2 border-emerald-300 flex items-center justify-center mx-auto mb-3">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black text-slate-900">
          MahaSetu Public Verifier Portal
        </h1>
        <p className="text-xs text-slate-600 mt-1">
          Cryptographic authenticity and sanction validation for Government of Maharashtra Service Passports
        </p>
      </div>

      {/* Lookup Form */}
      <form onSubmit={handleSearch} className="mb-8 flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={queryId}
            onChange={(e) => setQueryId(e.target.value)}
            placeholder="Enter Universal Application ID or Hash"
            className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-lg text-xs transition-colors shadow"
        >
          {loading ? 'Verifying...' : 'Verify Authenticity'}
        </button>
      </form>

      {/* Verification Result Card */}
      {result && (
        <div
          className={`bg-white rounded-xl border-2 p-6 shadow-lg ${
            result.is_valid ? 'border-emerald-500' : 'border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              {result.is_valid ? (
                <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded-full">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              ) : (
                <div className="p-1.5 bg-rose-100 text-rose-800 rounded-full">
                  <XCircle className="w-6 h-6" />
                </div>
              )}
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {result.is_valid ? 'AUTHENTIC SERVICE PASSPORT VERIFIED' : 'VERIFICATION FAILED'}
                </h3>
                <span className="text-[10px] text-slate-500">
                  {result.is_valid ? 'Issued by Government of Maharashtra' : result.message}
                </span>
              </div>
            </div>

            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                result.is_valid ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-100 text-rose-900'
              }`}
            >
              {result.verification_status}
            </span>
          </div>

          {result.is_valid && (
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 block">Universal Application ID</span>
                  <strong className="font-mono text-blue-900">{result.universal_application_id}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Beneficiary Name</span>
                  <strong className="text-slate-900">{result.beneficiary_name}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Sanction Scheme</span>
                  <strong className="text-slate-800">{result.service_name}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Citizen Consent Guard</span>
                  <strong className="text-emerald-700 font-bold">
                    {result.consent_authorized ? 'AUTHORIZED (DPDP Verified)' : 'PENDING'}
                  </strong>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Attesting Department Systems:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {result.attesting_departments?.map((dept: string, idx: number) => (
                    <span
                      key={idx}
                      className="text-[10px] bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded font-medium"
                    >
                      ✓ {dept}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
                <span>Verified at: {new Date(result.verified_at).toLocaleString()}</span>
                <span className="font-mono text-emerald-700 font-bold">Zero Tampering Detected</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
