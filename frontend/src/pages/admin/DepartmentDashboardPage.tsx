import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import {
  Building, CheckCircle2, AlertTriangle, Play, RefreshCw,
  FileText, ShieldCheck, Database, ArrowRight, UserCheck, Search
} from 'lucide-react';

interface Props {
  departmentCode?: 'DEPARTMENT_A' | 'DEPARTMENT_B' | 'DEPARTMENT_C';
}

export const DepartmentDashboardPage: React.FC<Props> = ({ departmentCode }) => {
  const { currentUser } = useAuth();
  const activeDeptRole = departmentCode || (currentUser?.role as any) || 'DEPARTMENT_A';

  // Allow switching departments for testing and multi-role officers / admins
  const defaultDept =
    activeDeptRole === 'DEPARTMENT_B' ? 'DEPT_B' :
    activeDeptRole === 'DEPARTMENT_C' ? 'DEPT_C' : 'DEPT_A';
  const [selectedDept, setSelectedDept] = useState<'DEPT_A' | 'DEPT_B' | 'DEPT_C'>(defaultDept);

  const shortDeptId = selectedDept;

  const deptMeta = {
    DEPT_A: {
      title: 'Department A — Identity & Civil Registry',
      description: 'Demographic verification, UIDAI matching, and civil status confirmation via modern REST interface.',
      dataFields: ['Full Legal Name', 'Date of Birth', 'District / State', 'Aadhaar Last 4 Digits'],
      badgeColor: 'bg-blue-100 text-blue-900 border-blue-200'
    },
    DEPT_B: {
      title: 'Department B — Social Welfare & Eligibility',
      description: 'Socio-economic criteria evaluation, income threshold analysis, and heterogeneous JSON payload transformation.',
      dataFields: ['Annual Household Income', 'Employment Status', 'Pincode / District', 'Eligibility Certificate'],
      badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-200'
    },
    DEPT_C: {
      title: 'Department C — Employment & Direct Sanctions',
      description: 'Final scheme benefit adjudication, sanction order issuance, and direct benefit entitlement generation.',
      dataFields: ['Sanction Reference Number', 'Benefit Amount / Entitlement', 'Bank Account Masked', 'IFSC'],
      badgeColor: 'bg-purple-100 text-purple-900 border-purple-200'
    }
  }[shortDeptId] || {
    title: 'Department Integration Portal',
    description: 'Participating government department node in the MahaSetu interoperability grid.',
    dataFields: ['Authorized Consent Attributes'],
    badgeColor: 'bg-slate-100 text-slate-800 border-slate-200'
  };

  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const apps = await api.getApplications();
      setApplications(apps);
    } catch (e) {
      console.error('Failed to load applications', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleProcessStep = async (appId: string) => {
    setActionLoading(appId);
    try {
      await api.advanceWorkflow(appId);
      await loadData();
    } catch (e: any) {
      alert(e.message || 'Failed to advance workflow step');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-sm text-slate-500">
        <RefreshCw className="w-5 h-5 animate-spin mx-auto text-blue-900 mb-2" />
        Loading {deptMeta.title}...
      </div>
    );
  }

  // Filter applications assigned to this department
  const pendingInDept = applications.filter((a) => a.current_department === shortDeptId);
  const processedByDept = applications.filter((a) => a.current_department !== shortDeptId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-200 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded border ${deptMeta.badgeColor}`}>
              {shortDeptId} NODE
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-600 font-semibold">Field-Level Consent Enforced</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-blue-950 tracking-tight">
            {deptMeta.title}
          </h1>
          <p className="text-xs text-slate-600 mt-1 max-w-3xl">
            {deptMeta.description}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/admin/integrations"
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg text-xs transition-colors border border-slate-300 shadow-sm"
          >
            Payload Inspector
          </Link>
        </div>
      </div>

      {/* Department Selector Tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-2">
          Select Active Node:
        </span>
        <button
          onClick={() => setSelectedDept('DEPT_A')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all border ${
            selectedDept === 'DEPT_A'
              ? 'bg-blue-950 text-white border-blue-950 shadow-sm'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          Dept A — Identity Registry
        </button>
        <button
          onClick={() => setSelectedDept('DEPT_B')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all border ${
            selectedDept === 'DEPT_B'
              ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          Dept B — Social Welfare
        </button>
        <button
          onClick={() => setSelectedDept('DEPT_C')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all border ${
            selectedDept === 'DEPT_C'
              ? 'bg-purple-700 text-white border-purple-700 shadow-sm'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          Dept C — Employment & Sanctions
        </button>
      </div>

      {/* Field-Level Authorization Alert */}
      <div className="bg-blue-50/75 border border-blue-200 rounded-xl p-4 mb-8 text-xs text-blue-900 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-blue-800 shrink-0" />
          <div>
            <strong>Authorized Field-Level Scope for {shortDeptId}:</strong>
            <div className="flex flex-wrap gap-2 mt-1">
              {deptMeta.dataFields.map((f) => (
                <span key={f} className="bg-white px-2 py-0.5 rounded border border-blue-200 text-[11px] font-mono">
                  {f}
                </span>
              ))}
            </div>
          </div>
        </div>
        <span className="text-[10px] font-mono text-slate-500 bg-white px-2 py-1 rounded border border-blue-200">
          DPDP 2023 Compliant
        </span>
      </div>

      {/* Pending Applications Queue */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-8 overflow-hidden">
        <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-blue-900" />
            <h2 className="text-sm font-bold text-slate-800">
              Department Active Queue ({pendingInDept.length} Applications)
            </h2>
          </div>
          <span className="text-[11px] text-slate-500">
            Awaiting verification &amp; transformation in {shortDeptId}
          </span>
        </div>

        {pendingInDept.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No applications currently in {shortDeptId}'s queue.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/75 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3 pl-5">Application #</th>
                  <th className="p-3">Beneficiary</th>
                  <th className="p-3">Current Status</th>
                  <th className="p-3">Authorized Payload Preview</th>
                  <th className="p-3 text-right pr-5">Execution Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingInDept.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/50">
                    <td className="p-3 pl-5 font-mono font-bold text-blue-950">
                      <Link to={`/applications/${app.id}/track`} className="hover:underline">
                        {app.application_number}
                      </Link>
                    </td>
                    <td className="p-3 font-medium text-slate-800">{app.citizen_name}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-800">
                        {app.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-[11px] text-slate-600">
                      {shortDeptId === 'DEPT_A' && `Dist: ${app.citizen_data?.district || 'Pune'} • DOB: ${app.citizen_data?.dob || '1995-01-01'}`}
                      {shortDeptId === 'DEPT_B' && `Income: ₹${Number(app.citizen_data?.annual_income || 180000).toLocaleString('en-IN')} • Status: ${app.citizen_data?.employment_status || 'UNEMPLOYED'}`}
                      {shortDeptId === 'DEPT_C' && `Scheme: ${app.service_name} • Benefit Sanction Ready`}
                    </td>
                    <td className="p-3 text-right pr-5">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleProcessStep(app.id)}
                          disabled={actionLoading === app.id}
                          className={`px-3.5 py-1.5 font-bold rounded-lg text-xs transition-all shadow flex items-center gap-1.5 ${
                            shortDeptId === 'DEPT_A'
                              ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                              : shortDeptId === 'DEPT_B'
                              ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                              : 'bg-purple-700 hover:bg-purple-600 text-white'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>
                            {actionLoading === app.id
                              ? 'Authorizing...'
                              : shortDeptId === 'DEPT_A'
                              ? '✓ Grant & Verify Identity'
                              : shortDeptId === 'DEPT_B'
                              ? '✓ Grant & Verify Eligibility'
                              : '✓ Grant Scheme Sanction'}
                          </span>
                        </button>
                        <Link
                          to={`/applications/${app.id}/track`}
                          className="px-2.5 py-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded text-xs border border-slate-200 transition-colors"
                        >
                          Track
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Historical / Processed Applications */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 font-bold text-slate-800 text-sm">
          Other Pipeline Applications ({processedByDept.length})
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/75 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3 pl-5">Application #</th>
                <th className="p-3">Citizen Name</th>
                <th className="p-3">Status</th>
                <th className="p-3">Current Custody</th>
                <th className="p-3 text-right pr-5">Timeline</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {processedByDept.slice(0, 10).map((app) => (
                <tr key={app.id} className="hover:bg-slate-50/50">
                  <td className="p-3 pl-5 font-mono text-slate-700">
                    <Link to={`/applications/${app.id}/track`} className="hover:underline">
                      {app.application_number}
                    </Link>
                  </td>
                  <td className="p-3 text-slate-700">{app.citizen_name}</td>
                  <td className="p-3">
                    <span className="text-[10px] font-bold text-slate-600">
                      {app.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-[11px] text-slate-600">{app.current_department}</td>
                  <td className="p-3 text-right pr-5">
                    <Link to={`/applications/${app.id}/track`} className="text-blue-700 hover:underline">
                      Track Journey →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
