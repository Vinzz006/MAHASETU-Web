import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import {
  Code2, Award, CheckCircle2, RefreshCw, Terminal,
  Send, ShieldCheck, FileCheck, Layers, Sparkles
} from 'lucide-react';

export const DeveloperSDKPage: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [orgName, setOrgName] = useState('Pimpri Chinchwad Municipal Corporation (PCMC)');
  const [serviceDomain, setServiceDomain] = useState('Civic Revenue & Water Utility Integration');
  const [certifying, setCertifying] = useState(false);
  const [certResult, setCertResult] = useState<any | null>(null);

  const fetchPartners = async () => {
    try {
      const res = await api.getCertifiedSDKPartners();
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  const handleCertify = async () => {
    setCertifying(true);
    setCertResult(null);
    try {
      const res = await api.certifyConnectorSDK({
        organization_name: orgName,
        service_domain: serviceDomain
      });
      setCertResult(res);
      fetchPartners();
    } catch (e: any) {
      alert('Certification failed: ' + e.message);
    } finally {
      setCertifying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-900 rounded-full text-xs font-semibold tracking-wide uppercase mb-3">
          <Code2 className="w-3.5 h-3.5 text-amber-600" />
          MahaSetu SDK &amp; Ecosystem Certification
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
          Departmental Onboarding SDK &amp; Certification Sandbox
        </h1>
        <p className="mt-2 text-base text-slate-600">
          Onboard new municipal corporations (BMC, PMC, PCMC) and state departments in under 5 minutes. Validate payload schemas against the Canonical Data Model and obtain an official Interoperability Gold Compliance Seal.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Certification Sandbox Form (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-indigo-600" />
              Connector Certification Testbed
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Organization / Municipal Corporation
              </label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Service Domain &amp; Endpoints
              </label>
              <input
                type="text"
                value={serviceDomain}
                onChange={(e) => setServiceDomain(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="p-3 rounded-xl bg-slate-900 text-slate-200 font-mono text-[11px] space-y-1">
              <span className="text-slate-500 block text-[9px] uppercase">Evaluated Canonical Contract</span>
              <p className="text-emerald-400">POST /api/canonical/transform</p>
              <p className="text-slate-400">Payload: citizen_full_name, mobile_no, district, annual_income</p>
            </div>

            <button
              onClick={handleCertify}
              disabled={certifying}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {certifying ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4 text-amber-400" />}
              Validate &amp; Issue Interoperability Gold Seal
            </button>
          </div>

          {/* Certified Partners Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Certified Municipal &amp; State Partners</h3>
            <div className="space-y-2.5">
              {data?.partners?.map((p: any) => (
                <div key={p.connector_id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{p.entity_name}</span>
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                      {p.compliance_tier}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 text-[10px] text-slate-600 pt-0.5">
                    {p.supported_apis?.map((apiName: string) => (
                      <span key={apiName} className="bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                        {apiName}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Issued Interoperability Seal (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          {certResult ? (
            <div className="bg-gradient-to-br from-amber-950 via-slate-900 to-indigo-950 text-white rounded-2xl border border-amber-500/40 shadow-xl p-6 space-y-4 animate-in fade-in duration-300 text-xs">
              <div className="flex items-center justify-between border-b border-amber-500/30 pb-3">
                <div className="flex items-center gap-2">
                  <Award className="w-6 h-6 text-amber-400" />
                  <div>
                    <h3 className="text-xs font-bold text-white tracking-wide uppercase">
                      MAHASETU INTEROPERABILITY GOLD SEAL
                    </h3>
                    <span className="text-[10px] text-amber-300 font-mono">{certResult.certification_id}</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full">
                  CERTIFIED
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase text-slate-400 block">Certified Organization</span>
                <p className="text-base font-bold text-white">{certResult.organization_name}</p>
                <p className="text-xs text-slate-300 mt-0.5">{certResult.service_domain}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="bg-slate-950/80 p-2.5 rounded-xl border border-amber-500/20">
                  <span className="text-[10px] uppercase text-slate-400 block">Canonical Conformance</span>
                  <span className="text-base font-bold text-emerald-400 font-mono">
                    {certResult.canonical_conformance_score_pct}%
                  </span>
                </div>
                <div className="bg-slate-950/80 p-2.5 rounded-xl border border-amber-500/20">
                  <span className="text-[10px] uppercase text-slate-400 block">SLA Latency Target</span>
                  <span className="text-base font-bold text-amber-300 font-mono">
                    {certResult.latency_sla_certified_ms}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase text-slate-400 block mb-0.5">Digital Stamp Hash</span>
                <p className="font-mono text-[9px] text-indigo-300 bg-slate-950 p-2 rounded border border-amber-500/20 break-all select-all">
                  {certResult.digital_seal_hash}
                </p>
              </div>

              <div className="bg-amber-950/60 p-3 rounded-xl border border-amber-500/30 text-[11px] text-amber-200">
                <p className="font-bold mb-0.5">Production Credentials Activated</p>
                <p className="text-amber-300/90">{certResult.next_steps}</p>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-8 text-center space-y-3">
              <Award className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-700">Certification Sandbox Ready</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Submit an organization and payload to test canonical compliance, SLA latency adherence, and receive an immutable Gold Compliance Seal.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
