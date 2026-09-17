import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, ApplicationDetail } from '../../api/client';
import { useDemo } from '../../context/DemoContext';
import { GrievanceModal } from '../../components/GrievanceModal';
import {
  CheckCircle2, Clock, AlertTriangle, ArrowRight, Play, RefreshCw,
  ShieldCheck, FileCode, Database, Activity, User, Building, FileText,
  Award, MessageSquare
} from 'lucide-react';

export const TrackingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { setIsInspectorOpen, inspectTransformation } = useDemo();

  const [application, setApplication] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [advancing, setAdvancing] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [activeTab, setActiveTab] = useState<'journey' | 'transactions' | 'audit'>('journey');
  const [isGrievanceOpen, setIsGrievanceOpen] = useState(false);
  const [isResubmitOpen, setIsResubmitOpen] = useState(false);
  const [resubmitIncome, setResubmitIncome] = useState<number>(180000);
  const [resubmitComments, setResubmitComments] = useState('');
  const [resubmitting, setResubmitting] = useState(false);

  const loadData = async () => {
    if (!id) return;
    try {
      const data = await api.getApplication(id);
      setApplication(data);
    } catch (e) {
      console.error('Failed to load application', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, 3000); // Polling every 3s for live updates
    return () => clearInterval(timer);
  }, [id]);

  const handleAdvance = async () => {
    if (!application) return;
    setAdvancing(true);
    try {
      await api.advanceWorkflow(application.id);
      await loadData();
    } catch (e: any) {
      console.error(e);
    } finally {
      setAdvancing(false);
    }
  };

  const handleRunAll = async () => {
    if (!application) return;
    setAdvancing(true);
    try {
      await api.runAllWorkflow(application.id);
      await loadData();
    } catch (e: any) {
      console.error(e);
    } finally {
      setAdvancing(false);
    }
  };

  const handleRetry = async () => {
    if (!application) return;
    setRetrying(true);
    try {
      await api.retryWorkflow(application.id);
      await loadData();
    } catch (e: any) {
      console.error(e);
    } finally {
      setRetrying(false);
    }
  };

  const handleResubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!application) return;
    setResubmitting(true);
    try {
      await api.resubmitApplication(application.id, {
        citizen_data: { annual_income: Number(resubmitIncome) },
        comments: resubmitComments
      });
      setIsResubmitOpen(false);
      setResubmitComments('');
      await loadData();
    } catch (e: any) {
      console.error(e);
      alert(e.message || 'Failed to resubmit');
    } finally {
      setResubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center text-sm text-slate-500">
        Loading Service Passport Tracking Pipeline...
      </div>
    );
  }

  if (!application) {
    return (
      <div className="max-w-md mx-auto py-20 text-center">
        <h2 className="text-lg font-bold text-slate-800">Application Not Found</h2>
        <Link to="/citizen/dashboard" className="text-xs text-blue-700 underline mt-2 block">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const isCompleted = application.status === 'COMPLETED';
  const isException = application.status === 'EXCEPTION';
  const isRework = application.status === 'REWORK' || application.status === 'REWORK_REQUESTED';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1">
      {/* Top Application Header Card */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase font-bold tracking-widest bg-amber-500/20 text-amber-800 px-2 py-0.5 rounded border border-amber-500/30">
                Service Passport
              </span>
              <span className="text-xs text-slate-400">|</span>
              <span className="text-xs text-slate-500">Current Custody: <strong className="text-slate-800">{application.current_department}</strong></span>
            </div>
            <h1 className="text-2xl font-black font-mono text-blue-950">
              {application.application_number}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!isCompleted && !isException && !isRework && (
              <>
                <button
                  onClick={handleAdvance}
                  disabled={advancing}
                  className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow"
                  title="Advance next step in workflow"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{advancing ? 'Executing...' : 'Advance Next Step'}</span>
                </button>

                <button
                  onClick={handleRunAll}
                  disabled={advancing}
                  className="px-3.5 py-2 bg-[#0f2942] hover:bg-[#163352] text-white font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow"
                  title="Run all remaining steps automatically"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${advancing ? 'animate-spin' : ''}`} />
                  <span>Run Full Journey</span>
                </button>
              </>
            )}

            {isRework && (
              <button
                onClick={() => setIsResubmitOpen(true)}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow animate-pulse"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Address & Resubmit</span>
              </button>
            )}

            {isException && (
              <button
                onClick={handleRetry}
                disabled={retrying}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow animate-pulse"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${retrying ? 'animate-spin' : ''}`} />
                <span>{retrying ? 'Retrying Connection...' : 'Retry Failed Integration'}</span>
              </button>
            )}

            {isCompleted && (
              <Link
                to={`/passport/${application.application_number}`}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow"
              >
                <Award className="w-4 h-4 text-amber-300" />
                <span>View Verifiable Service Passport</span>
              </Link>
            )}

            <button
              onClick={() => setIsGrievanceOpen(true)}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition-colors flex items-center gap-1.5 border border-slate-300"
              title="Lodge an inter-departmental grievance regarding this application"
            >
              <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
              <span>Raise Grievance</span>
            </button>

            <button
              onClick={() => {
                inspectTransformation('DEPT_A', 'DEPT_B', application.citizen_data);
              }}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition-colors flex items-center gap-1.5 border border-slate-300"
            >
              <Database className="w-3.5 h-3.5 text-amber-600" />
              <span>Inspect Canonical Transform</span>
            </button>
          </div>
        </div>

        {/* Sub-info bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px]">Beneficiary Name</span>
            <strong className="text-slate-800">{application.citizen_name}</strong>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Target Scheme</span>
            <strong className="text-slate-800">{application.service_name}</strong>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Consent Authorization</span>
            <strong className="text-emerald-700 font-mono">
              {application.active_consent?.consent_number || 'CON-2026-PENDING'}
            </strong>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Overall Status</span>
            <strong className={`font-bold ${isCompleted ? 'text-emerald-700' : isException ? 'text-rose-700' : 'text-amber-700'}`}>
              {application.status.replace(/_/g, ' ')}
            </strong>
          </div>
        </div>
      </div>

      {/* Exception Banner if in Exception state */}
      {isException && (
        <div className="bg-rose-50 border-2 border-rose-400 rounded-xl p-5 mb-6 text-xs text-rose-900 shadow-sm flex items-start gap-4">
          <div className="p-2 bg-rose-200/80 rounded-lg text-rose-800">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-rose-950">
                Integration Exception: Department B (Eligibility Service)
              </h3>
              <span className="text-[10px] bg-rose-200 text-rose-900 px-2 py-0.5 rounded font-bold">
                RETRY ATTEMPTS: 2 EXHAUSTED
              </span>
            </div>
            <p className="text-rose-800 text-xs mt-1">
              Department B service endpoint returned a simulated connection pool failure. 
              The application state is preserved safely in the MahaSetu exception queue.
            </p>
            <div className="mt-3 flex items-center gap-3">
              <span className="text-slate-600 text-[11px]">
                💡 <em>Click "Simulate Dept B Failure" in the demo bar to restore connectivity, then click Retry.</em>
              </span>
              <button
                onClick={handleRetry}
                disabled={retrying}
                className="px-3 py-1 bg-rose-700 hover:bg-rose-600 text-white rounded font-bold text-xs shadow-sm"
              >
                Retry Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rework Requested Banner */}
      {isRework && (
        <div className="bg-amber-50 border-2 border-amber-400 rounded-xl p-5 mb-6 text-xs text-amber-950 shadow-sm flex items-start gap-4">
          <div className="p-2 bg-amber-200/80 rounded-lg text-amber-800">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-amber-950">
                Action Required: Application Sent for Rework
              </h3>
              <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded font-bold">
                REWORK REQUESTED
              </span>
            </div>
            <p className="text-amber-900 text-xs mt-1">
              <strong>Administrator Feedback:</strong> {application.rejection_reason || 'Please verify submitted credentials or income documents and resubmit.'}
            </p>
            <div className="mt-3 flex items-center gap-3">
              <button
                onClick={() => {
                  setResubmitIncome(application.citizen_data?.annual_income || 180000);
                  setIsResubmitOpen(true);
                }}
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded font-bold text-xs shadow-sm flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Address & Resubmit Application
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 mb-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('journey')}
          className={`pb-2.5 px-4 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'journey'
              ? 'border-blue-950 text-blue-950 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Cross-Department Workflow Pipeline</span>
        </button>

        <button
          onClick={() => setActiveTab('transactions')}
          className={`pb-2.5 px-4 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'transactions'
              ? 'border-blue-950 text-blue-950 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileCode className="w-4 h-4" />
          <span>Department Payloads & Transactions ({application.transactions?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-2.5 px-4 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'audit'
              ? 'border-blue-950 text-blue-950 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Immutable Audit Logs ({application.audit_logs?.length || 0})</span>
        </button>
      </div>

      {/* Tab 1: Visual Cross-Department Workflow Pipeline */}
      {activeTab === 'journey' && (
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <div className="relative pl-6 space-y-8 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
            {application.workflow_steps?.map((step, idx) => {
              const isDone = step.status === 'COMPLETED';
              const isFailed = step.status === 'FAILED';
              const isCurrent = step.status === 'IN_PROGRESS';
              const isReworkStep = step.status === 'REWORK_REQUESTED';
              const isFlagged = step.status === 'FLAGGED';

              return (
                <div key={step.id || idx} className="relative flex items-start gap-4">
                  {/* Step Dot */}
                  <div
                    className={`absolute -left-6 top-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-sm ${
                      isDone
                        ? 'bg-emerald-600 text-white ring-4 ring-emerald-50'
                        : isFailed || isFlagged
                        ? 'bg-rose-600 text-white ring-4 ring-rose-50 animate-pulse'
                        : isReworkStep
                        ? 'bg-amber-600 text-white ring-4 ring-amber-50 animate-pulse'
                        : isCurrent
                        ? 'bg-amber-500 text-slate-950 ring-4 ring-amber-50'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {isDone ? '✓' : (isFailed || isFlagged) ? '✕' : isReworkStep ? '!' : idx + 1}
                  </div>

                  {/* Step Content */}
                  <div className="flex-1 bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">
                          {step.step_name.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[10px] font-semibold bg-white text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                          Dept: {step.department_id}
                        </span>
                      </div>

                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          isDone
                            ? 'bg-emerald-100 text-emerald-800'
                            : isFailed || isFlagged
                            ? 'bg-rose-100 text-rose-800'
                            : isReworkStep
                            ? 'bg-amber-100 text-amber-800'
                            : isCurrent
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {step.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 mt-1">
                      {step.details?.description ||
                        (step.step_name === 'APPLICATION_CREATED' && 'Universal Application ID issued and registered in MahaSetu Hub.') ||
                        (step.step_name === 'CONSENT_GRANTED' && 'Citizen approved cross-departmental data sharing for scheme.') ||
                        (step.step_name === 'IDENTITY_VERIFICATION' && 'Verifying demographics with Department A REST API') ||
                        (step.step_name === 'ELIGIBILITY_VERIFICATION' && 'Evaluating socio-economic thresholds with Department B JSON') ||
                        (step.step_name === 'DEPARTMENT_APPROVAL' && 'Issuing official scheme benefit sanction via Department C') ||
                        (step.step_name === 'ADMIN_REVIEW' && 'Administrative Review & Sanction Sign-off by State Administrator') ||
                        (step.step_name === 'AUDITOR_REVIEW' && 'Independent oversight review & compliance verification by State Auditor') ||
                        (step.step_name === 'APPLICATION_COMPLETED' && 'Service Passport finalized and unified tracking journey completed.')}
                    </p>

                    {/* Step specific verification details */}
                    {step.details?.verification_id && (
                      <div className="mt-2 text-[11px] font-mono text-slate-700 bg-white p-2 rounded border border-slate-200">
                        Registry Verification ID: <strong className="text-blue-700">{step.details.verification_id}</strong>
                      </div>
                    )}
                    {step.details?.sanction_number && (
                      <div className="mt-2 text-[11px] font-mono text-emerald-800 bg-emerald-50 p-2 rounded border border-emerald-200">
                        Sanction Reference: <strong>{step.details.sanction_number}</strong> • Benefit: {step.details.benefit_awarded}
                      </div>
                    )}
                    {step.details?.error && (
                      <div className="mt-2 text-[11px] font-mono text-rose-700 bg-rose-100 p-2 rounded border border-rose-300">
                        Exception Detail: {step.details.error}
                      </div>
                    )}

                    {step.comments && (
                      <div className="mt-2 text-[11px] text-slate-700 bg-slate-100 p-2 rounded border border-slate-200">
                        <strong>Review Note:</strong> {step.comments}
                        {step.verifier_id && <span className="text-slate-500 ml-1.5 font-mono text-[10px]">({step.verifier_id})</span>}
                      </div>
                    )}
                    {step.rejection_reason && (
                      <div className="mt-2 text-[11px] text-amber-900 bg-amber-100 p-2 rounded border border-amber-300">
                        <strong>Rework Feedback:</strong> {step.rejection_reason}
                      </div>
                    )}

                    <div className="text-[10px] text-slate-400 mt-2 flex items-center gap-2">
                      {step.completed_at ? (
                        <span>Completed: {new Date(step.completed_at).toLocaleTimeString()}</span>
                      ) : (
                        <span>Pending completion</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Department Payloads & Transactions */}
      {activeTab === 'transactions' && (
        <div className="space-y-4">
          {application.transactions?.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center text-slate-500 text-xs border border-slate-200">
              No inter-department API transactions recorded yet. Advance the workflow to invoke connectors.
            </div>
          ) : (
            application.transactions?.map((txn) => (
              <div key={txn.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-xs">
                <div className="bg-slate-800 text-white px-4 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2 font-mono">
                    <span className="font-bold text-amber-400">{txn.department_id}</span>
                    <span className="text-slate-400">::</span>
                    <span className="text-slate-200">{txn.operation}</span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      txn.status === 'SUCCESS' ? 'bg-emerald-500 text-slate-950' : 'bg-rose-500 text-white'
                    }`}
                  >
                    {txn.status} (Retries: {txn.retry_count})
                  </span>
                </div>

                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950 font-mono text-[11px]">
                  <div>
                    <span className="text-slate-400 text-[10px] block mb-1">Request Payload Dispatched:</span>
                    <pre className="text-slate-300 overflow-x-auto p-2 bg-slate-900 rounded border border-slate-800">
                      {JSON.stringify(txn.request_payload, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block mb-1">Response Received / Exception:</span>
                    <pre className="text-slate-300 overflow-x-auto p-2 bg-slate-900 rounded border border-slate-800">
                      {txn.response_payload
                        ? JSON.stringify(txn.response_payload, null, 2)
                        : txn.error_message || 'None'}
                    </pre>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 3: Immutable Audit Logs */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-xs">
          <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-slate-700">
            Immutable Chronological Audit Stream
          </div>
          <div className="divide-y divide-slate-100">
            {application.audit_logs?.map((log) => (
              <div key={log.id} className="p-4 flex items-start justify-between gap-4 hover:bg-slate-50/50">
                <div>
                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <span className="font-bold text-blue-900 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                      {log.action}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-600">Resource: <strong>{log.resource}</strong></span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-600">Actor: <strong>{log.actor_id}</strong></span>
                  </div>
                  {log.metadata && Object.keys(log.metadata).length > 0 && (
                    <p className="font-mono text-[10px] text-slate-500 mt-1">
                      {JSON.stringify(log.metadata)}
                    </p>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grievance Modal */}
      <GrievanceModal
        isOpen={isGrievanceOpen}
        onClose={() => setIsGrievanceOpen(false)}
        applicationId={application.id}
        applicationNumber={application.application_number}
        onGrievanceSubmitted={loadData}
      />

      {/* Resubmission Modal for Rework */}
      {isResubmitOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-2">Resubmit Application for Rework</h3>
            <p className="text-xs text-slate-500 mb-4">
              Update your application details in response to administrator feedback and resubmit for approval.
            </p>
            <form onSubmit={handleResubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Declared Annual Income (₹)</label>
                <input
                  type="number"
                  value={resubmitIncome}
                  onChange={(e) => setResubmitIncome(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Citizen Comments / Explanation</label>
                <textarea
                  value={resubmitComments}
                  onChange={(e) => setResubmitComments(e.target.value)}
                  placeholder="e.g. Attached corrected income certificate, updated income bracket to reflect current status."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  rows={3}
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsResubmitOpen(false)}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resubmitting}
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold shadow flex items-center gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${resubmitting ? 'animate-spin' : ''}`} />
                  <span>{resubmitting ? 'Submitting...' : 'Submit & Re-evaluate'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
