import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, ApplicationDetail } from '../../api/client';
import { ShieldCheck, Lock, AlertCircle, CheckCircle2, XCircle, ArrowRight, FileCheck, Hash } from 'lucide-react';

export const ConsentPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [application, setApplication] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [approvedConsent, setApprovedConsent] = useState<any | null>(null);
  const [declined, setDeclined] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadApp() {
      if (!id) return;
      try {
        const data = await api.getApplication(id);
        setApplication(data);
        if (data.active_consent && data.active_consent.status === 'AUTHORIZED') {
          setApprovedConsent(data.active_consent);
        }
      } catch (err: any) {
        setError('Unable to retrieve consent details for this application.');
      } finally {
        setLoading(false);
      }
    }
    loadApp();
  }, [id]);

  const handleGrantConsent = async () => {
    if (!application?.active_consent) return;
    setActionLoading(true);
    setError(null);

    try {
      const res = await api.approveConsent(application.active_consent.id);
      setApprovedConsent(res);
      // Also advance the workflow step for consent
      await api.advanceWorkflow(application.id);
    } catch (err: any) {
      setError(err.message || 'Failed to authorize consent.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeclineConsent = async () => {
    if (!application?.active_consent) return;
    setActionLoading(true);
    try {
      await api.revokeConsent(application.active_consent.id);
      setDeclined(true);
    } catch (err: any) {
      setError('Error recording decline');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center text-sm text-slate-500">
        Loading Consent Verification Modal...
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 flex-1">
      {/* Step Indicator */}
      <div className="mb-6 flex items-center justify-between text-xs font-medium text-slate-500">
        <span className="flex items-center gap-1.5 text-slate-400">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          Applicant Information
        </span>
        <span className="text-amber-600 font-bold flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-[11px]">2</span>
          Consent Authorization
        </span>
        <span className="flex items-center gap-1.5 text-slate-400">
          <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-[11px]">3</span>
          Universal Passport Tracking
        </span>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-[#0f2942] p-6 text-white text-center">
          <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center mx-auto mb-3">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold">YOUR CONSENT IS REQUIRED</h1>
          <p className="text-xs text-slate-300 mt-1">
            Data Protection & Federated Information Exchange Authorization
          </p>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border-b border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* State 1: Consent Authorized View */}
        {approvedConsent ? (
          <div className="p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto border-4 border-emerald-50">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <span className="text-[11px] uppercase font-bold tracking-widest bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-300">
                STATUS: AUTHORIZED
              </span>
              <h2 className="text-xl font-bold text-slate-900 mt-3">
                Citizen Consent Successfully Granted
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Your authorization token has been cryptographically registered on the MahaSetu Hub.
              </p>
            </div>

            {/* Cryptographic Proof Box */}
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 text-left font-mono text-xs space-y-2 text-slate-700">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Consent ID:</span>
                <strong className="text-slate-900">{approvedConsent.consent_number}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Authorized Date:</span>
                <span>{new Date(approvedConsent.granted_at || Date.now()).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Application Number:</span>
                <strong className="text-blue-700">{application?.application_number}</strong>
              </div>
              {approvedConsent.consent_hash && (
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-slate-500 text-[10px] block mb-0.5">SHA-256 Audit Signature:</span>
                  <span className="text-[10px] text-slate-600 break-all bg-white p-1 rounded border border-slate-200 block">
                    {approvedConsent.consent_hash}
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={() => navigate(`/applications/${application?.id}/track`)}
              className="w-full py-3 bg-[#0f2942] hover:bg-[#163352] text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 text-xs shadow-md"
            >
              <span>Track Unified Service Journey</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : declined ? (
          /* State 2: Declined View */
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
              <XCircle className="w-10 h-10" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Consent Declined</h2>
            <p className="text-xs text-slate-600 max-w-md mx-auto">
              Cross-department data sharing was blocked by citizen choice. Department A and Department B will not receive or transmit your records.
            </p>
            <button
              onClick={() => setDeclined(false)}
              className="px-4 py-2 bg-slate-800 text-white rounded text-xs font-semibold hover:bg-slate-700"
            >
              Review Consent Again
            </button>
          </div>
        ) : (
          /* State 3: Active Request Form */
          <div className="p-6 space-y-6 text-xs text-slate-700">
            {/* Request Details */}
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Requested By:
                </span>
                <span className="text-sm font-bold text-slate-900 block">
                  {application?.active_consent?.requested_by || 'Employment Department (DEPT_C)'}
                </span>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Purpose: {application?.active_consent?.purpose || 'Eligibility verification under Maharashtra Employment Support Scheme'}
                </span>
              </div>

              <div>
                <span className="font-bold text-slate-900 text-xs block mb-2">
                  Information Requested For Exchange:
                </span>
                <div className="space-y-2">
                  <div className="flex items-start gap-2.5 p-2.5 rounded bg-white border border-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-800">Identity Information:</strong>
                      <p className="text-slate-500 text-[11px]">Full Name, Date of Birth, and District verification via Department A (REST API)</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-2.5 rounded bg-white border border-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-800">Address & Domicile Proof:</strong>
                      <p className="text-slate-500 text-[11px]">Maharashtra state residence confirmation from Civil Registry Adapter</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-2.5 rounded bg-white border border-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-800">Eligibility & Income Classification:</strong>
                      <p className="text-slate-500 text-[11px]">Socio-economic classification and stipend eligibility rules evaluated by Department B</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                <strong>Legal & Privacy Guarantee:</strong> In accordance with Digital Personal Data Protection principles, this consent is time-limited (90 days) and restricted exclusively to the named scheme. You may revoke consent at any point.
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={handleDeclineConsent}
                disabled={actionLoading}
                className="px-5 py-2.5 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors text-xs"
              >
                Decline
              </button>

              <button
                type="button"
                onClick={handleGrantConsent}
                disabled={actionLoading}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors flex items-center gap-2 shadow text-xs"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{actionLoading ? 'Cryptographically Authorizing...' : 'Grant Consent & Authorize'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
