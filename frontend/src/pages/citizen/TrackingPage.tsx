import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, ApplicationDetail } from '../../api/client';
import { GrievanceModal } from '../../components/GrievanceModal';
import {
  CheckCircle2, Clock, AlertTriangle, ArrowRight, Play, RefreshCw,
  ShieldCheck, FileCode, Database, Activity, User, Building, FileText,
  Award, MessageSquare, Check, XCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const TrackingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();

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

  // Identify the currently pending workflow step
  const pendingStep = application?.workflow_steps?.find(
    (s) => s.status === 'PENDING' || s.status === 'IN_PROGRESS' || s.status === 'RETRYING' || s.status === 'REWORK_REQUESTED'
  );

  const getGrantActionInfo = () => {
    if (!pendingStep) return null;
    const name = pendingStep.step_name;
    const dept = pendingStep.department_id;

    if (name === 'IDENTITY_VERIFICATION' || dept === 'DEPT_A') {
      return {
        role: 'DEPT_A',
        deptCode: 'DEPT_A',
        roleLabel: 'Department A Officer (Identity & Civil Registry)',
        badgeColor: 'bg-blue-100 text-blue-900 border-blue-200',
        title: 'Grant & Verify Identity (Dept A)',
        actionLabel: 'Grant & Verify Identity',
        description: 'Verify resident demographics and UIDAI match, then forward canonical payload to Department B.',
        actionType: 'advance',
        buttonClass: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20'
      };
    }
    if (name === 'ELIGIBILITY_VERIFICATION' || dept === 'DEPT_B') {
      return {
        role: 'DEPT_B',
        deptCode: 'DEPT_B',
        roleLabel: 'Department B Officer (Social Welfare & Criteria)',
        badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-200',
        title: 'Grant & Verify Eligibility (Dept B)',
        actionLabel: 'Grant & Verify Eligibility',
        description: 'Validate socio-economic threshold and dispatch verified eligibility certificate to Department C.',
        actionType: 'advance',
        buttonClass: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20'
      };
    }
    if (name === 'DEPARTMENT_APPROVAL' || dept === 'DEPT_C') {
      return {
        role: 'DEPT_C',
        deptCode: 'DEPT_C',
        roleLabel: 'Department C Officer (Employment & Sanctions)',
        badgeColor: 'bg-purple-100 text-purple-900 border-purple-200',
        title: 'Grant & Issue Scheme Sanction (Dept C)',
        actionLabel: 'Grant & Issue Sanction',
        description: 'Adjudicate entitlement benefit and issue official scheme sanction order to State Administrator.',
        actionType: 'advance',
        buttonClass: 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-900/20'
      };
    }
    if (name === 'ADMIN_REVIEW' || dept === 'ADMIN') {
      return {
        role: 'ADMIN',
        deptCode: 'ADMIN',
        roleLabel: 'State Administrator (Executive Governance)',
        badgeColor: 'bg-blue-100 text-blue-900 border-blue-200',
        title: 'Grant Administrative Sanction Sign-Off',
        actionLabel: 'Sign-off & Approve Application',
        description: 'Executive review verifying cross-department approvals and authorizing statutory Service Passport generation.',
        actionType: 'admin_review',
        buttonClass: 'bg-blue-950 hover:bg-blue-900 text-white shadow-blue-950/20'
      };
    }
    if (name === 'AUDITOR_REVIEW' || dept === 'AUDIT') {
      return {
        role: 'AUDITOR',
        deptCode: 'AUDIT',
        roleLabel: 'State Auditor (Independent Compliance)',
        badgeColor: 'bg-indigo-100 text-indigo-900 border-indigo-200',
        title: 'Grant Statutory Auditor Confirmation',
        actionLabel: 'Confirm Audit Compliance',
        description: 'Independent oversight confirmation validating data provenance and cryptographic hashes.',
        actionType: 'advance',
        buttonClass: 'bg-indigo-600 hover:bg-indigo-500 text-white'
      };
    }
    if (name === 'CONSENT_GRANTED') {
      return {
        role: 'PORTAL',
        deptCode: 'PORTAL',
        roleLabel: 'Citizen DPDP Consent Framework',
        badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-200',
        title: 'Authorize Citizen Consent',
        actionLabel: 'Authorize Consent',
        description: 'Enforce DPDP Act consent artifact and begin inter-department verification pipeline.',
        actionType: 'advance',
        buttonClass: 'bg-emerald-600 hover:bg-emerald-500 text-white'
      };
    }
    return {
      role: dept,
      deptCode: dept,
      roleLabel: `${dept} Authority`,
      badgeColor: 'bg-slate-100 text-slate-800 border-slate-200',
      title: `Grant Acceptance (${dept})`,
      actionLabel: `Grant & Accept (${dept})`,
      description: 'Advance application workflow to the next inter-department milestone.',
      actionType: 'advance',
      buttonClass: 'bg-emerald-600 hover:bg-emerald-500 text-white'
    };
  };

  const handleGrantAccept = async (comments?: string) => {
    if (!application) return;
    setAdvancing(true);
    try {
      if (pendingStep?.step_name === 'ADMIN_REVIEW') {
        await api.adminReviewWorkflow(application.id, {
          decision: 'APPROVE',
          comments: comments || 'Administrative sanction cleared and verified by State Administrator.'
        });
      } else {
        await api.advanceWorkflow(application.id);
      }
      await loadData();
    } catch (e: any) {
      console.error(e);
      alert(e.message || 'Failed to grant approval');
    } finally {
      setAdvancing(false);
    }
  };

  const handleAdminReworkFromTracking = async () => {
    if (!application) return;
    const reason = prompt('Please enter rework instructions for the citizen:', 'Income certificate verification required under scheme ceiling.');
    if (!reason) return;
    setAdvancing(true);
    try {
      await api.adminReviewWorkflow(application.id, {
        decision: 'REWORK',
        comments: reason,
        rejection_reason: reason
      });
      await loadData();
    } catch (e: any) {
      console.error(e);
      alert(e.message || 'Failed to request rework');
    } finally {
      setAdvancing(false);
    }
  };

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
                  onClick={() => handleGrantAccept()}
                  disabled={advancing}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow"
                  title="Grant official acceptance for active stage"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>
                    {advancing
                      ? 'Granting...'
                      : pendingStep
                      ? `Grant & Accept (${pendingStep.department_id})`
                      : 'Advance Step'}
                  </span>
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

      {/* Officer & Administrative Authority Grant Decision Panel */}
      {!isCompleted && !isException && !isRework && pendingStep && (() => {
        const actionInfo = getGrantActionInfo();
        if (!actionInfo) return null;

        return (
          <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-[#0f2942] text-white rounded-xl p-5 mb-6 border border-amber-400/30 shadow-md">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-widest bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded border border-amber-500/30">
                    Awaiting Authority Grant / Acceptance
                  </span>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs text-slate-300 font-mono">
                    Node: <strong className="text-amber-300">{pendingStep.department_id}</strong> ({pendingStep.step_name.replace(/_/g, ' ')})
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <span>{actionInfo.title}</span>
                </h3>

                <p className="text-xs text-slate-300 max-w-2xl">
                  {actionInfo.description}
                </p>

                <div className="pt-1 flex items-center gap-3 text-[11px] text-slate-400">
                  <span>
                    Designated Authority: <strong className="text-white">{actionInfo.roleLabel}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Logged in as: <strong className="text-amber-300 font-mono">{currentUser?.role || 'OFFICER'}</strong>
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <button
                  onClick={() => handleGrantAccept()}
                  disabled={advancing}
                  className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all shadow-lg flex items-center gap-2 ${actionInfo.buttonClass}`}
                  title="Authorize and advance workflow step"
                >
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>{advancing ? 'Executing Authority Grant...' : actionInfo.actionLabel}</span>
                </button>

                {pendingStep.step_name === 'ADMIN_REVIEW' && (
                  <button
                    onClick={handleAdminReworkFromTracking}
                    disabled={advancing}
                    className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg shadow transition-colors flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Request Citizen Rework</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

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

                    {/* Inline Decision Block if this step is awaiting authorization */}
                    {step.id === pendingStep?.id && !isCompleted && !isException && !isRework && (
                      <div className="mt-3 p-3.5 bg-gradient-to-r from-emerald-50 via-white to-amber-50/40 rounded-lg border border-emerald-300 shadow-sm flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
                            <span>Awaiting Authority Action ({step.department_id}):</span>
                          </div>
                          <div className="text-[11px] text-slate-600 mt-0.5">
                            Grant acceptance to verify this step and record cryptographic audit log in the state ledger.
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleGrantAccept()}
                            disabled={advancing}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold shadow transition-all flex items-center gap-1.5 ${
                              step.step_name === 'ADMIN_REVIEW'
                                ? 'bg-blue-950 hover:bg-blue-900 text-white'
                                : step.department_id === 'DEPT_C'
                                ? 'bg-purple-700 hover:bg-purple-600 text-white'
                                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>
                              {advancing
                                ? 'Granting...'
                                : step.step_name === 'IDENTITY_VERIFICATION'
                                ? 'Grant & Verify Identity (Dept A)'
                                : step.step_name === 'ELIGIBILITY_VERIFICATION'
                                ? 'Grant & Verify Eligibility (Dept B)'
                                : step.step_name === 'DEPARTMENT_APPROVAL'
                                ? 'Grant & Issue Sanction (Dept C)'
                                : step.step_name === 'ADMIN_REVIEW'
                                ? 'Grant Administrative Approval'
                                : `Grant & Accept (${step.department_id})`}
                            </span>
                          </button>
                          {step.step_name === 'ADMIN_REVIEW' && (
                            <button
                              onClick={handleAdminReworkFromTracking}
                              disabled={advancing}
                              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg shadow"
                            >
                              Request Rework
                            </button>
                          )}
                        </div>
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
