import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../api/client';
import {
  ShieldCheck, Printer, Download, QrCode, CheckCircle2,
  ExternalLink, ArrowLeft, Building2, Lock, Award
} from 'lucide-react';

export const PassportCertificatePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        const cert = await api.getPassportCertificate(id);
        setData(cert);
      } catch (err: any) {
        setError('Failed to generate Digital Service Passport.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center text-sm text-slate-500">
        Generating Verifiable Service Passport Credential...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-md mx-auto py-20 text-center">
        <h2 className="text-lg font-bold text-slate-800 mb-2">Service Passport Not Available</h2>
        <p className="text-xs text-slate-500 mb-4">{error || 'Please complete all workflow steps.'}</p>
        <Link to="/citizen/dashboard" className="text-xs text-blue-700 underline font-semibold">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const { beneficiary, department_attestations, consent_record, service_details } = data;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 flex-1">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 print:hidden">
        <Link
          to={`/applications/${data.application_id}/track`}
          className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Application Tracker</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            to={`/passport/verify/${data.universal_application_id}`}
            target="_blank"
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-300"
          >
            <ExternalLink className="w-3.5 h-3.5 text-blue-700" />
            <span>Public Verifier Portal</span>
          </Link>

          <button
            onClick={() => window.print()}
            className="px-4 py-1.5 bg-[#0f2942] hover:bg-[#163352] text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Official Passport</span>
          </button>
        </div>
      </div>

      {/* Official Certificate Paper Document */}
      <div className="bg-white border-4 border-double border-slate-800 rounded-2xl p-8 sm:p-12 shadow-2xl relative overflow-hidden text-slate-900 print:border-2 print:shadow-none print:p-6">
        {/* Subtle Maharashtra Gov Watermark Emblem */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
          <ShieldCheck className="w-96 h-96 text-slate-950" />
        </div>

        {/* Certificate Header */}
        <div className="text-center border-b-2 border-slate-800 pb-6 mb-8">
          <div className="w-14 h-14 rounded-full bg-amber-500 text-slate-950 font-black text-2xl flex items-center justify-center mx-auto mb-2 shadow-sm border border-amber-600">
            म
          </div>
          <h3 className="text-sm sm:text-base font-bold text-amber-700 uppercase tracking-wider">
            महाराष्ट्र शासन • Government of Maharashtra
          </h3>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-950 mt-1 uppercase tracking-tight">
            Digital Service Passport
          </h1>
          <p className="text-xs text-slate-600 mt-1 uppercase font-semibold tracking-widest">
            Verifiable Multi-Department Credential & Sanction Order
          </p>
          <div className="mt-3 inline-block bg-slate-100 px-3 py-1 rounded text-[11px] font-mono font-bold text-slate-700 border border-slate-300">
            Universal Application ID: <span className="text-blue-900 font-extrabold">{data.universal_application_id}</span>
          </div>
        </div>

        {/* Beneficiary Details Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-6 border-b border-slate-200 text-xs">
          <div>
            <span className="text-slate-500 font-semibold text-[10px] uppercase block mb-1">
              Beneficiary Information
            </span>
            <div className="space-y-1">
              <div className="text-base font-bold text-slate-950">{beneficiary.name}</div>
              <div className="text-slate-600">Citizen ID: <strong className="font-mono">{beneficiary.citizen_id}</strong></div>
              <div className="text-slate-600">Date of Birth: <strong>{beneficiary.date_of_birth}</strong></div>
              <div className="text-slate-600">District / State: <strong>{beneficiary.district}, {beneficiary.state}</strong></div>
            </div>
          </div>

          <div>
            <span className="text-slate-500 font-semibold text-[10px] uppercase block mb-1">
              Sanctioned Scheme Details
            </span>
            <div className="space-y-1">
              <div className="text-base font-bold text-blue-900">{service_details.service_name}</div>
              <div className="text-slate-600">Department: <strong>{service_details.department}</strong></div>
              <div className="text-slate-600">Consent Reference: <strong className="font-mono text-emerald-800">{consent_record.consent_number}</strong></div>
              <div className="text-slate-600">Status: <strong className="text-emerald-700 font-bold uppercase">{data.status}</strong></div>
            </div>
          </div>
        </div>

        {/* Multi-Department Verification Stamps (Federated Attestations) */}
        <div className="py-6 border-b border-slate-200">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-blue-800" />
            <span>Federated Interoperability Attestations:</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
            {/* Dept A Stamp */}
            <div className="border-2 border-emerald-600 rounded-lg p-3 bg-emerald-50/50 relative">
              <div className="flex items-center justify-between text-[10px] font-bold text-emerald-800 mb-1">
                <span>DEPT A (IDENTITY)</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
              </div>
              <div className="text-[11px] font-bold text-slate-800">
                {department_attestations.dept_a_identity.verification_id || 'UIDAI-MOCK-94821'}
              </div>
              <div className="text-[10px] text-emerald-700 mt-1">Biometric Confidence: 99.4%</div>
            </div>

            {/* Dept B Stamp */}
            <div className="border-2 border-emerald-600 rounded-lg p-3 bg-emerald-50/50 relative">
              <div className="flex items-center justify-between text-[10px] font-bold text-emerald-800 mb-1">
                <span>DEPT B (ELIGIBILITY)</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
              </div>
              <div className="text-[11px] font-bold text-slate-800">
                {department_attestations.dept_b_eligibility.certificate_id || 'MH-ELIG-2026-48210'}
              </div>
              <div className="text-[10px] text-emerald-700 mt-1">Rule: Income &lt; 3L (PASSED)</div>
            </div>

            {/* Dept C Stamp */}
            <div className="border-2 border-emerald-600 rounded-lg p-3 bg-emerald-50/50 relative">
              <div className="flex items-center justify-between text-[10px] font-bold text-emerald-800 mb-1">
                <span>DEPT C (SANCTION)</span>
                <Award className="w-3.5 h-3.5 text-emerald-700" />
              </div>
              <div className="text-[11px] font-bold text-slate-800">
                {department_attestations.dept_c_approval.sanction_number || 'MH-SANCTION-2026-72810'}
              </div>
              <div className="text-[10px] text-emerald-700 mt-1">Monthly Skill Stipend Rs 5000</div>
            </div>
          </div>
        </div>

        {/* Footer with Scannable QR & Cryptographic Seal */}
        <div className="pt-6 flex flex-wrap items-center justify-between gap-6">
          {/* Left: Cryptographic Integrity Seal */}
          <div className="space-y-1.5 flex-1 text-xs">
            <div className="flex items-center gap-1.5 text-slate-900 font-bold">
              <Lock className="w-3.5 h-3.5 text-amber-600" />
              <span>Cryptographic Tamper-Evident SHA-256 Digest:</span>
            </div>
            <p className="font-mono text-[10px] text-slate-600 bg-slate-100 p-2 rounded border border-slate-200 break-all leading-tight">
              {data.passport_hash}
            </p>
            <div className="text-[10px] text-slate-500">
              Verified by MahaSetu Framework • Problem Statement 26129 • Maharashtra
            </div>
          </div>

          {/* Right: Mock Scannable QR Code */}
          <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="w-16 h-16 bg-slate-900 rounded-lg p-1.5 flex items-center justify-center text-white">
              <QrCode className="w-12 h-12" />
            </div>
            <div className="text-[10px] text-slate-600 leading-tight">
              <strong className="text-slate-900 block text-xs">Scan to Verify</strong>
              <span>Instant public validation</span>
              <span className="block font-mono text-blue-700 mt-0.5">mahasetu.gov.in</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
