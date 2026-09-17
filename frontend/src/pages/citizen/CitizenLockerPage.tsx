import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { ShieldCheck, Award, Lock, ExternalLink, QrCode, FileText, CheckCircle2, FolderKey } from 'lucide-react';

export const CitizenLockerPage: React.FC = () => {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const apps = await api.getApplications();
        setApplications(apps);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">
          <FolderKey className="w-4 h-4 text-blue-900" />
          <span>MahaLocker • Citizen Verifiable Credential Vault</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
          My Digital Service Passports & Attestations
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Secure, self-sovereign repository of government sanction certificates and cross-department verification proofs.
        </p>
      </div>

      {/* Locker Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Benchmark Service Passport Card */}
        <div className="bg-white rounded-xl border-2 border-emerald-500 shadow-md p-6 text-xs relative overflow-hidden flex flex-col justify-between">
          <div className="absolute -right-8 -top-8 w-24 h-24 bg-emerald-100 rounded-full opacity-40 pointer-events-none" />

          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-300 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Sanctioned Credential
              </span>
              <span className="text-slate-400 font-mono text-[10px]">VERIFIABLE</span>
            </div>

            <h3 className="text-base font-bold text-slate-950 mb-1">
              Employment Assistance Service Passport
            </h3>
            <span className="text-slate-500 block text-[11px] mb-3">
              Skill Development, Employment &amp; Entrepreneurship
            </span>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1.5 mb-4 text-[11px]">
              <div>Universal ID: <strong className="font-mono text-blue-900">MH-APP-2026-000184</strong></div>
              <div>Beneficiary: <strong className="text-slate-800">Demo Citizen (Pune)</strong></div>
              <div>Benefit: <strong className="text-emerald-700">Monthly Stipend Rs. 5,000</strong></div>
              <div>Sanction Ref: <strong className="font-mono text-slate-700">MH-SANCTION-2026-72810</strong></div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
            <Link
              to="/passport/MH-APP-2026-000184"
              className="flex-1 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-lg text-xs text-center flex items-center justify-center gap-1.5 shadow"
            >
              <Award className="w-3.5 h-3.5 text-amber-300" />
              <span>View Passport</span>
            </Link>
            <Link
              to="/passport/verify/MH-APP-2026-000184"
              target="_blank"
              className="p-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg"
              title="Open Public Verifier"
            >
              <ExternalLink className="w-4 h-4 text-blue-700" />
            </Link>
          </div>
        </div>

        {/* DPDP Consent Certificate Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 text-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-[10px] font-bold uppercase bg-blue-100 text-blue-800 px-2 py-0.5 rounded border border-blue-200 flex items-center gap-1">
                <Lock className="w-3 h-3" />
                Consent Authorization
              </span>
              <span className="text-slate-400 font-mono text-[10px]">DPDP-2023</span>
            </div>

            <h3 className="text-base font-bold text-slate-950 mb-1">
              Active Inter-Department Consent
            </h3>
            <span className="text-slate-500 block text-[11px] mb-3">
              Cryptographic Data Sharing Agreement
            </span>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1.5 mb-4 text-[11px]">
              <div>Consent ID: <strong className="font-mono text-blue-900">CON-2026-482910</strong></div>
              <div>Authorized For: <strong>Identity &amp; Income Verification</strong></div>
              <div>Participating: <strong>Dept A, Dept B, Dept C</strong></div>
              <div>Validity: <strong className="text-emerald-700">Active (90 Days)</strong></div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-[10px] text-slate-500 flex items-center justify-between">
            <span>Cryptographically Signed</span>
            <span className="font-mono text-blue-900 font-bold">SHA-256 ✓</span>
          </div>
        </div>

        {/* Biometric Identity Attestation Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 text-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-[10px] font-bold uppercase bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Identity Attestation
              </span>
              <span className="text-slate-400 font-mono text-[10px]">MASTER REG</span>
            </div>

            <h3 className="text-base font-bold text-slate-950 mb-1">
              Master Demographic Proof
            </h3>
            <span className="text-slate-500 block text-[11px] mb-3">
              Department A (Identity Verification Service)
            </span>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1.5 mb-4 text-[11px]">
              <div>Match Confidence: <strong className="text-emerald-700">99.4% Biometric</strong></div>
              <div>District: <strong>Pune, Maharashtra</strong></div>
              <div>Canonical UUID: <strong className="font-mono text-slate-700">CANON-9482104</strong></div>
              <div>Proof Token: <strong className="font-mono text-slate-700">UIDAI-MOCK-94821</strong></div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-[10px] text-slate-500 flex items-center justify-between">
            <span>Non-invasive federation</span>
            <span className="font-mono text-emerald-700 font-bold">Zero Storage</span>
          </div>
        </div>
      </div>
    </div>
  );
};
