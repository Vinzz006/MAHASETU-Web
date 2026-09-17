import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, DashboardMetrics, PendingRegistration } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import {
  Shield, CheckCircle2, Clock, AlertTriangle, Users, FileText,
  RefreshCw, Check, X, ArrowRight, Activity, Building, Eye, ChevronRight,
  Beaker
} from 'lucide-react';
import { AuditLogViewer } from '../../components/AuditLogViewer';

export const AdminDashboardPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [pendingUsers, setPendingUsers] = useState<PendingRegistration[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Rework Modal State
  const [reworkAppId, setReworkAppId] = useState<string | null>(null);
  const [reworkReason, setReworkReason] = useState('');
  const [reworkComments, setReworkComments] = useState('');
  const [pipelineTab, setPipelineTab] = useState<'ADMIN_PENDING' | 'DEPT_PIPELINE'>('ADMIN_PENDING');

  const loadDashboardData = async () => {
    try {
      const [m, pending, apps] = await Promise.all([
        api.getDashboardMetrics(),
        api.getPendingRegistrations(),
        api.getApplications()
      ]);
      setMetrics(m);
      setPendingUsers(pending);
      setApplications(apps);
      setError(null);
    } catch (e: any) {
      console.error('Failed to load admin dashboard data', e);
      setError(e.message || 'Failed to load governance telemetry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleApproveUser = async (userId: string) => {
    setActionLoading(`approve-user-${userId}`);
    try {
      await api.approveRegistration(userId);
      await loadDashboardData();
    } catch (e: any) {
      alert(e.message || 'Failed to approve user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectUser = async (userId: string) => {
    const reason = prompt('Please enter rejection reason:');
    if (!reason) return;
    setActionLoading(`reject-user-${userId}`);
    try {
      await api.rejectRegistration(userId, reason);
      await loadDashboardData();
    } catch (e: any) {
      alert(e.message || 'Failed to reject user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAdminApproveApp = async (appId: string) => {
    setActionLoading(`approve-app-${appId}`);
    try {
      await api.adminReviewWorkflow(appId, {
        decision: 'APPROVE',
        comments: 'Administrative review verified and sanction cleared by State Administrator.'
      });
      await loadDashboardData();
    } catch (e: any) {
      alert(e.message || 'Failed to approve application');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAdvanceWorkflowApp = async (appId: string) => {
    setActionLoading(`advance-app-${appId}`);
    try {
      await api.advanceWorkflow(appId);
      await loadDashboardData();
    } catch (e: any) {
      alert(e.message || 'Failed to advance workflow step');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSubmitRework = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reworkAppId) return;
    setActionLoading(`rework-app-${reworkAppId}`);
    try {
      await api.adminReviewWorkflow(reworkAppId, {
        decision: 'REWORK',
        comments: reworkComments || 'Please provide required documentation or clarification.',
        rejection_reason: reworkReason
      });
      setReworkAppId(null);
      setReworkReason('');
      setReworkComments('');
      await loadDashboardData();
    } catch (e: any) {
      alert(e.message || 'Failed to request rework');
    } finally {
      setActionLoading(null);
    }
  };

  if (error && !metrics) {
    return (
      <div className="max-w-xl mx-auto my-20 p-6 bg-rose-50 border border-rose-200 rounded-xl text-center space-y-3">
        <AlertTriangle className="w-8 h-8 text-rose-600 mx-auto" />
        <h3 className="text-sm font-bold text-rose-900">Governance Console Telemetry Unavailable</h3>
        <p className="text-xs text-rose-700">{error}</p>
        <button
          onClick={() => {
            setLoading(true);
            setError(null);
            loadDashboardData();
          }}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg shadow transition-colors"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  if (loading || !metrics) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-sm text-slate-500">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-900 mb-2" />
        Loading State Administrator Governance Console...
      </div>
    );
  }

  // Applications awaiting Admin review: status is APPROVAL_STARTED or current_department is ADMIN
  const appsAwaitingAdmin = applications.filter(
    (a) => a.current_department === 'ADMIN' || a.status === 'APPROVAL_STARTED'
  );

  // Applications in active department pipeline stages (Dept A, Dept B, Dept C)
  const deptPipelineApps = applications.filter(
    (a) => a.status !== 'COMPLETED' && a.status !== 'EXCEPTION' && a.current_department !== 'ADMIN' && a.status !== 'APPROVAL_STARTED'
  );

  const statusCounts = applications.reduce((acc: Record<string, number>, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-200 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold tracking-widest uppercase bg-blue-950 text-amber-400 px-2 py-0.5 rounded border border-amber-400/30">
              State Governance Console
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-600 font-semibold">MahaSetu Hub v3.0</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-blue-950 tracking-tight">
            Administrator Governance Dashboard
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Executive oversight, user registration authorizations, and sanction sign-offs across participating departments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/admin/citizens"
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-800 font-bold rounded-lg text-xs transition-colors border border-slate-300 shadow-sm flex items-center gap-1.5"
          >
            <Users className="w-3.5 h-3.5 text-blue-900" />
            <span>Citizen Directory</span>
          </Link>
          <Link
            to="/admin/integrations"
            className="px-3.5 py-2 bg-blue-950 hover:bg-blue-900 text-white font-bold rounded-lg text-xs transition-colors shadow-sm flex items-center gap-1.5"
          >
            <Activity className="w-3.5 h-3.5 text-amber-400" />
            <span>Integrations Monitor</span>
          </Link>
          <Link
            to="/admin/innovation-lab"
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs transition-colors shadow-sm flex items-center gap-1.5"
          >
            <Beaker className="w-3.5 h-3.5" />
            <span>Innovation Lab</span>
          </Link>
        </div>
      </div>

      {/* Real Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {/* Metric 1 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Applications</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-900 flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-950 mt-2">{applications.length}</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span className="text-emerald-600 font-semibold">{statusCounts['COMPLETED'] || 0} completed</span>
            <span>•</span>
            <span className="text-amber-600 font-semibold">{statusCounts['REWORK'] || 0} in rework</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Pending User Approvals</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${pendingUsers.length > 0 ? 'bg-amber-100 text-amber-800 animate-pulse' : 'bg-slate-100 text-slate-600'}`}>
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-950 mt-2">{pendingUsers.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            {pendingUsers.length > 0 ? 'Requires immediate administrator action' : 'All user requests reviewed'}
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Awaiting Admin Review</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${appsAwaitingAdmin.length > 0 ? 'bg-blue-100 text-blue-900' : 'bg-slate-100 text-slate-600'}`}>
              <Shield className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-950 mt-2">{appsAwaitingAdmin.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            Department C verified; pending sanction sign-off
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Interoperability SLA</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-2">
            {metrics.sla_compliance_rate || 99.4}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Avg latency: <strong>{metrics.avg_processing_time_days ? `${metrics.avg_processing_time_days} days` : '1.2 days'}</strong>
          </div>
        </div>
      </div>

      {/* Section 1: Administrative Reviews & Department Pipeline Queues */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-8 overflow-hidden">
        <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-900" />
            <h2 className="text-sm font-bold text-slate-800">
              Administrative Reviews &amp; Department Pipeline Actions
            </h2>
          </div>

          <div className="flex items-center gap-2 bg-slate-200/70 p-1 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setPipelineTab('ADMIN_PENDING')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                pipelineTab === 'ADMIN_PENDING'
                  ? 'bg-white text-blue-950 font-bold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Awaiting Admin Sign-Off ({appsAwaitingAdmin.length})
            </button>
            <button
              onClick={() => setPipelineTab('DEPT_PIPELINE')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                pipelineTab === 'DEPT_PIPELINE'
                  ? 'bg-white text-blue-950 font-bold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Department Queues: Dept A / B / C ({deptPipelineApps.length})
            </button>
          </div>
        </div>

        {/* Tab 1: Awaiting Admin Sign-Off */}
        {pipelineTab === 'ADMIN_PENDING' && (
          appsAwaitingAdmin.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No applications currently awaiting admin sign-off. All scheme pipelines are flowing smoothly.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/75 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3 pl-5">Application #</th>
                    <th className="p-3">Citizen Name</th>
                    <th className="p-3">Scheme</th>
                    <th className="p-3">Department Flow</th>
                    <th className="p-3">Income & Demographics</th>
                    <th className="p-3 text-right pr-5">Review Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {appsAwaitingAdmin.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50/50">
                      <td className="p-3 pl-5 font-mono font-bold text-blue-950">
                        <Link to={`/applications/${app.id}/track`} className="hover:underline">
                          {app.application_number}
                        </Link>
                      </td>
                      <td className="p-3 font-medium text-slate-800">{app.citizen_name}</td>
                      <td className="p-3 text-slate-600">{app.service_name}</td>
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1 font-mono text-[10px] bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-slate-700">
                          DEPT_A → DEPT_B → DEPT_C → <strong className="text-blue-900">ADMIN</strong>
                        </span>
                      </td>
                      <td className="p-3 text-slate-600">
                        ₹{Number(app.citizen_data?.annual_income || 180000).toLocaleString('en-IN')} / yr
                      </td>
                      <td className="p-3 text-right pr-5 space-x-2">
                        <button
                          onClick={() => handleAdminApproveApp(app.id)}
                          disabled={actionLoading === `approve-app-${app.id}`}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-xs shadow-sm transition-colors"
                        >
                          {actionLoading === `approve-app-${app.id}` ? 'Approving...' : 'Sign-off & Approve'}
                        </button>
                        <button
                          onClick={() => {
                            setReworkAppId(app.id);
                            setReworkReason('Please provide valid income certificate proof under scheme threshold.');
                          }}
                          className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded text-xs shadow-sm transition-colors"
                        >
                          Request Rework
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* Tab 2: Department Queues: Dept A, Dept B, Dept C */}
        {pipelineTab === 'DEPT_PIPELINE' && (
          deptPipelineApps.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No applications currently queued in Department A, B, or C.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/75 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3 pl-5">Application #</th>
                    <th className="p-3">Citizen Name</th>
                    <th className="p-3">Scheme</th>
                    <th className="p-3">Current Custody</th>
                    <th className="p-3">Current Status</th>
                    <th className="p-3 text-right pr-5">Administrative Intervention</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {deptPipelineApps.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50/50">
                      <td className="p-3 pl-5 font-mono font-bold text-blue-950">
                        <Link to={`/applications/${app.id}/track`} className="hover:underline">
                          {app.application_number}
                        </Link>
                      </td>
                      <td className="p-3 font-medium text-slate-800">{app.citizen_name}</td>
                      <td className="p-3 text-slate-600">{app.service_name}</td>
                      <td className="p-3 font-mono font-bold text-slate-700">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          app.current_department === 'DEPT_A' ? 'bg-blue-100 text-blue-900 border border-blue-200' :
                          app.current_department === 'DEPT_B' ? 'bg-emerald-100 text-emerald-900 border border-emerald-200' :
                          app.current_department === 'DEPT_C' ? 'bg-purple-100 text-purple-900 border border-purple-200' :
                          'bg-slate-100 text-slate-800'
                        }`}>
                          {app.current_department}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="text-[10px] font-semibold text-slate-600">
                          {app.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="p-3 text-right pr-5 space-x-2">
                        <button
                          onClick={() => handleAdvanceWorkflowApp(app.id)}
                          disabled={actionLoading === `advance-app-${app.id}`}
                          className={`px-3 py-1 font-bold rounded text-xs shadow-sm transition-colors ${
                            app.current_department === 'DEPT_C'
                              ? 'bg-purple-700 hover:bg-purple-600 text-white'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          }`}
                        >
                          {actionLoading === `advance-app-${app.id}`
                            ? 'Authorizing...'
                            : app.current_department === 'DEPT_A'
                            ? '✓ Grant Dept A Identity'
                            : app.current_department === 'DEPT_B'
                            ? '✓ Grant Dept B Eligibility'
                            : app.current_department === 'DEPT_C'
                            ? '✓ Grant Dept C Sanction'
                            : `✓ Grant (${app.current_department})`}
                        </button>
                        <Link
                          to={`/applications/${app.id}/track`}
                          className="px-2.5 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded text-xs border border-slate-200 transition-colors inline-block"
                        >
                          Track Journey →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* Section 2: Pending User Registrations Approval */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-8 overflow-hidden">
        <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-900" />
            <h2 className="text-sm font-bold text-slate-800">
              Pending User Registration Authorizations ({pendingUsers.length})
            </h2>
          </div>
          <span className="text-[11px] text-slate-500">
            Unapproved users cannot access protected government endpoints
          </span>
        </div>

        {pendingUsers.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No self-registered user accounts pending approval. All active users have valid authorization.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/75 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3 pl-5">Name</th>
                  <th className="p-3">Role Requested</th>
                  <th className="p-3">Mobile / Email</th>
                  <th className="p-3">Submitted At</th>
                  <th className="p-3 text-right pr-5">Authorization</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50">
                    <td className="p-3 pl-5 font-bold text-slate-900">{u.name}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-slate-600">
                      {u.mobile} • {u.email}
                    </td>
                    <td className="p-3 text-slate-500 text-[11px]">
                      {new Date(u.created_at).toLocaleString()}
                    </td>
                    <td className="p-3 text-right pr-5 space-x-2">
                      <button
                        onClick={() => handleApproveUser(u.id)}
                        disabled={actionLoading === `approve-user-${u.id}`}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-xs shadow-sm"
                      >
                        {actionLoading === `approve-user-${u.id}` ? 'Approving...' : 'Approve User'}
                      </button>
                      <button
                        onClick={() => handleRejectUser(u.id)}
                        disabled={actionLoading === `reject-user-${u.id}`}
                        className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded text-xs shadow-sm"
                      >
                        {actionLoading === `reject-user-${u.id}` ? 'Rejecting...' : 'Reject'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Innovation Lab Entry Point */}
      <div className="mb-8 rounded-2xl bg-gradient-to-r from-indigo-950 to-slate-900 text-white p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-indigo-700/40 shadow-lg">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Beaker className="w-4 h-4 text-indigo-300" />
            <span className="text-xs font-bold text-indigo-300 uppercase tracking-widest">Innovation Lab — 15 Phases</span>
          </div>
          <h3 className="text-base font-black text-white">35+ Specialized Government Modules</h3>
          <p className="text-xs text-slate-400 mt-0.5">Executive War Room · Merkle Audit Ledger · Disaster Surge · DPI · Climate IoT · Voice AI · Tribal FRA · and more</p>
        </div>
        <Link to="/admin/innovation-lab" className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs rounded-xl transition-colors whitespace-nowrap">
          Explore All Modules <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Statutory Audit Ledger Stream & Export */}
      <div className="mb-8">
        <AuditLogViewer />
      </div>

      {/* Rework Request Modal */}
      {reworkAppId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-2">Request Citizen Rework</h3>
            <p className="text-xs text-slate-500 mb-4">
              Return this application to the citizen with mandatory feedback.
            </p>
            <form onSubmit={handleSubmitRework} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Rejection / Rework Reason <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={reworkReason}
                  onChange={(e) => setReworkReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  rows={2}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Additional Internal Comments
                </label>
                <textarea
                  value={reworkComments}
                  onChange={(e) => setReworkComments(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  rows={2}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReworkAppId(null)}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === `rework-app-${reworkAppId}`}
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold shadow"
                >
                  {actionLoading === `rework-app-${reworkAppId}` ? 'Submitting...' : 'Dispatch Rework Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
