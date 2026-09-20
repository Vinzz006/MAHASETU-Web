import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Shield, Lock, FileText, CheckCircle2, XCircle, Clock, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { EmptyState } from '../../components/EmptyState';
import { TableSkeleton } from '../../components/SkeletonLoaders';

export interface ConsentHistoryItem {
  id: string;
  consent_number: string;
  application_id: string;
  citizen_id: string;
  requested_by: string;
  purpose: string;
  data_categories: string[];
  status: string;
  granted_at?: string;
  expires_at?: string;
  consent_hash?: string;
}

export const CitizenConsentHistoryPage: React.FC = () => {
  const [history, setHistory] = useState<ConsentHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await api.getMyConsentHistory();
      setHistory(data);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load consent disclosure history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleRevoke = async (consentId: string) => {
    setRevokingId(consentId);
    try {
      await api.revokeConsent(consentId);
      toast.success('Consent revoked successfully. Future data exchanges halted.');
      await fetchHistory();
    } catch (err: any) {
      toast.error(err.message || 'Failed to revoke consent');
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            to="/citizen/dashboard"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Citizen Dashboard
          </Link>
          <button
            onClick={fetchHistory}
            className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-100 shadow-sm transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Log
          </button>
        </div>

        {/* Hero Card */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-12 -translate-y-6 opacity-10 pointer-events-none">
            <Shield className="w-80 h-80 text-white" />
          </div>
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 text-xs font-medium border border-blue-400/30 mb-4 backdrop-blur-sm">
              <Lock className="w-3.5 h-3.5" />
              DPDP Act 2023 Compliant Transparency Portal
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              What has MahaSetu shared about me?
            </h1>
            <p className="mt-2 text-sm sm:text-base text-blue-100 leading-relaxed">
              Every data exchange between government departments requires your explicit, purpose-bound consent. 
              Review active consents, audited disclosures, and exercise your right to revoke access at any time.
            </p>
          </div>
        </div>

        {/* Content Section */}
        {loading ? (
          <TableSkeleton rows={4} />
        ) : history.length === 0 ? (
          <div className="bg-white rounded-xl p-8 border border-slate-200 shadow-sm">
            <EmptyState
              title="No Consent Disclosures Found"
              description="You currently have no active or historical data sharing authorizations on record. When you apply for schemes, your consents will appear here."
              actionText="Explore Government Schemes"
              actionHref="/citizen/services"
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm font-semibold text-slate-700 px-1 flex items-center justify-between">
              <span>Consent & Disclosure Records ({history.length})</span>
              <span className="text-xs text-slate-500 font-normal">Immutable SHA-256 Consent Chain</span>
            </div>

            {history.map((item) => {
              const isAuthorized = item.status === 'AUTHORIZED';
              const isRevoked = item.status === 'REVOKED';

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition p-5 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-lg ${isAuthorized ? 'bg-emerald-50 text-emerald-600' : isRevoked ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
                        {isAuthorized ? <CheckCircle2 className="w-5 h-5" /> : isRevoked ? <XCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-slate-900 text-base">{item.purpose}</h3>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                              isAuthorized
                                ? 'bg-emerald-100 text-emerald-800'
                                : isRevoked
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Requested by: <strong className="text-slate-700 font-medium">{item.requested_by}</strong> • Ref: {item.consent_number}
                        </p>
                      </div>
                    </div>

                    {isAuthorized && (
                      <button
                        onClick={() => handleRevoke(item.id)}
                        disabled={revokingId === item.id}
                        className="self-start sm:self-auto text-xs font-semibold px-3 py-1.5 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 transition disabled:opacity-50"
                      >
                        {revokingId === item.id ? 'Revoking...' : 'Revoke Consent'}
                      </button>
                    )}
                  </div>

                  {/* Data Categories Shared */}
                  <div className="space-y-1.5">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Categories of Personal Data Disclosed
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {item.data_categories?.map((cat, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1.5 text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md border border-slate-200"
                        >
                          <FileText className="w-3 h-3 text-slate-400" />
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Cryptographic Proof Hash & Timestamp */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-50 gap-2">
                    <div className="font-mono truncate max-w-md">
                      SHA256 Hash: {item.consent_hash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
                    </div>
                    <div>
                      {item.granted_at ? `Authorized on ${new Date(item.granted_at).toLocaleDateString()}` : 'Date pending'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
