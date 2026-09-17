import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import {
  ShieldCheck, Printer, Award, FileText, CheckCircle2,
  TrendingUp, Building2, Lock, ArrowLeft, Landmark, Zap
} from 'lucide-react';

export const ExecutiveAuditReportPage: React.FC = () => {
  const [report, setReport] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getExecutiveAuditReport();
        setReport(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center text-sm text-slate-500">
        Generating Executive Interoperability Audit Brief...
      </div>
    );
  }

  if (!report) {
    return (
      <div className="max-w-md mx-auto py-20 text-center text-sm text-slate-500">
        Audit report unavailable.
      </div>
    );
  }

  const { executive_summary, dpdp_compliance_certification, district_federation_readiness, federated_systems_audited } = report;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 print:hidden">
        <Link
          to="/admin/dashboard"
          className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Command Center</span>
        </Link>

        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-[#0f2942] hover:bg-[#163352] text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Export Executive Brief (PDF)</span>
        </button>
      </div>

      {/* Official Government Paper Document */}
      <div className="bg-white border-2 border-slate-300 rounded-2xl p-8 sm:p-12 shadow-xl text-slate-900 print:border-none print:shadow-none print:p-4">
        {/* State Seal Header */}
        <div className="text-center border-b-2 border-slate-800 pb-6 mb-8">
          <div className="w-16 h-16 rounded-full bg-amber-500 text-slate-950 font-black text-2xl flex items-center justify-center mx-auto mb-2 shadow border border-amber-600">
            म
          </div>
          <h2 className="text-xs sm:text-sm font-bold text-amber-800 uppercase tracking-widest">
            महाराष्ट्र शासन • GOVERNMENT OF MAHARASHTRA
          </h2>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-950 mt-1 uppercase tracking-tight font-serif">
            Executive Interoperability &amp; DPDP Audit Brief
          </h1>
          <p className="text-xs text-slate-600 mt-1 font-semibold uppercase tracking-wider">
            Comprehensive Assessment of Federated Digital Service Delivery (Problem Statement 26129)
          </p>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-[11px] font-mono text-slate-600">
            <span>Reference: <strong className="text-blue-900 font-bold">{report.reference_number}</strong></span>
            <span>•</span>
            <span>Authority: <strong>{report.audit_authority}</strong></span>
          </div>
        </div>

        {/* Executive ROI & Citizen Impact Metrics */}
        <div className="mb-8">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 pb-2 border-b border-slate-200 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-700" />
            <span>1. Statewide Citizen &amp; Fiscal Impact Analysis</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Total State Fiscal Savings</span>
              <strong className="text-2xl font-black text-emerald-700 block mt-1">
                ₹ {executive_summary.total_state_economic_savings_crores} Cr
              </strong>
              <span className="text-[10px] text-slate-500 mt-1 block">Annual recurring reduction</span>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Office Visits Bypassed</span>
              <strong className="text-2xl font-black text-slate-900 block mt-1">
                {executive_summary.physical_office_visits_eliminated?.toLocaleString()}
              </strong>
              <span className="text-[10px] text-slate-500 mt-1 block">3.2 visits per citizen</span>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Citizen Man-Hours Saved</span>
              <strong className="text-2xl font-black text-blue-900 block mt-1">
                {executive_summary.citizen_man_hours_saved?.toLocaleString()} hrs
              </strong>
              <span className="text-[10px] text-slate-500 mt-1 block">14h average per application</span>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Average Interop Latency</span>
              <strong className="text-2xl font-black text-amber-700 font-mono block mt-1">
                {executive_summary.average_cross_department_latency_ms} ms
              </strong>
              <span className="text-[10px] text-emerald-700 font-semibold mt-1 block">vs 14 days manual dispatch</span>
            </div>
          </div>
        </div>

        {/* DPDP Act 2023 Statutory Compliance Certification */}
        <div className="mb-8">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 pb-2 border-b border-slate-200 flex items-center gap-2">
            <Lock className="w-4 h-4 text-blue-800" />
            <span>2. DPDP Act, 2023 Statutory Certification</span>
          </h3>

          <div className="bg-emerald-50/70 border border-emerald-300 rounded-xl p-5 text-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                <strong className="text-sm font-bold text-emerald-950">
                  100% Cryptographic Citizen Consent Compliance Certified
                </strong>
              </div>
              <span className="text-[10px] font-mono font-bold bg-white text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded">
                COMPLIANT
              </span>
            </div>
            <p className="text-slate-700 leading-relaxed text-[11px] mb-3">
              {dpdp_compliance_certification.data_minimization_status}. Under the MahaSetu interoperability contract, 
              no citizen demographic or financial data is exchanged across department APIs without active, unexpired 
              cryptographic token signatures bounded by purpose-specific access controls.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[10px] font-mono text-slate-600 bg-white p-3 rounded-lg border border-emerald-200">
              <div>Law: <strong>{dpdp_compliance_certification.law_reference}</strong></div>
              <div>Algorithm: <strong>SHA-256 with timestamp bounds</strong></div>
              <div>Storage: <strong>Zero Permanence (Ephemeral Hub)</strong></div>
            </div>
          </div>
        </div>

        {/* District Federation Readiness Index */}
        <div className="mb-8">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 pb-2 border-b border-slate-200 flex items-center gap-2">
            <Landmark className="w-4 h-4 text-purple-800" />
            <span>3. District Federation Readiness Index (Major Revenue Divisions)</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-[10px] uppercase font-bold text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="p-3">District Division</th>
                  <th className="p-3">Readiness Score</th>
                  <th className="p-3">Active Department Adapters</th>
                  <th className="p-3">Federation Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {district_federation_readiness.map((d: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/60">
                    <td className="p-3 font-bold text-slate-900">{d.district}</td>
                    <td className="p-3 font-mono font-bold text-emerald-700">{d.readiness_score}%</td>
                    <td className="p-3 text-slate-600">{d.active_connectors} Endpoints Active</td>
                    <td className="p-3">
                      <span className="text-[10px] font-mono font-bold bg-blue-100 text-blue-900 px-2 py-0.5 rounded border border-blue-200">
                        {d.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Seal & Hash Footer */}
        <div className="pt-6 border-t-2 border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="space-y-1">
            <div className="font-bold text-slate-900">Cryptographic Seal of Authority:</div>
            <p className="font-mono text-[10px] text-slate-600 bg-slate-100 p-2 rounded border border-slate-200 break-all">
              {report.cryptographic_seal_hash}
            </p>
          </div>

          <div className="text-right">
            <div className="font-bold text-slate-900">Directorate of IT, Maharashtra</div>
            <div className="text-[10px] text-slate-500">Certified for Inter-Department Delivery</div>
          </div>
        </div>
      </div>
    </div>
  );
};
