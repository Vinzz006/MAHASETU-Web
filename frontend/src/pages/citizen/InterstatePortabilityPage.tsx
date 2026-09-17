import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import {
  Compass, ShieldCheck, CheckCircle2, RefreshCw, Send,
  Globe, ArrowRight, ExternalLink, Award, FileCheck, Check
} from 'lucide-react';

export const InterstatePortabilityPage: React.FC = () => {
  const [anchorsData, setAnchorsData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [targetState, setTargetState] = useState('STATE_GUJARAT');
  const [appNumber, setAppNumber] = useState('MH-APP-2026-000184');
  const [citizenName, setCitizenName] = useState('Demo Citizen');
  const [migrationReason, setMigrationReason] = useState('Inter-State Employment & Skill Program Enrollment');
  const [porting, setPorting] = useState(false);
  const [portResult, setPortResult] = useState<any | null>(null);

  const fetchAnchors = async () => {
    try {
      const res = await api.getInterstateTrustAnchors();
      setAnchorsData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnchors();
  }, []);

  const handlePort = async (e: React.FormEvent) => {
    e.preventDefault();
    setPorting(true);
    setPortResult(null);
    try {
      const res = await api.portCitizenCredentials({
        application_number: appNumber,
        citizen_name: citizenName,
        source_state: 'Maharashtra',
        target_state_id: targetState,
        migration_reason: migrationReason
      });
      setPortResult(res);
    } catch (e: any) {
      alert('Porting failed: ' + e.message);
    } finally {
      setPorting(false);
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
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-sky-100 text-sky-900 rounded-full text-xs font-semibold tracking-wide uppercase mb-3">
          <Compass className="w-3.5 h-3.5 text-sky-600" />
          One Nation, One Service Passport (ONOSP)
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
          National Inter-State Mobility & Portability Bridge
        </h1>
        <p className="mt-2 text-base text-slate-600">
          Migrating across state borders? Transfer your pre-verified Maharashtra service passport to partner state gateways without resubmitting physical paperwork or facing re-verification delays.
        </p>
      </div>

      {/* Partner States Trust Anchor Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {anchorsData?.trust_anchors?.map((state: any) => (
          <div key={state.state_id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-base text-slate-900">{state.state_name}</span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> {state.mou_status}
              </span>
            </div>
            <p className="text-xs text-indigo-700 font-semibold">{state.portal_name}</p>
            <p className="text-[11px] text-slate-500 font-mono truncate">{state.gateway_url}</p>

            <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-600 space-y-1">
              <span className="text-[10px] uppercase text-slate-400 font-bold block">Supported Entitlements</span>
              {state.supported_schemes?.map((sch: string) => (
                <div key={sch} className="flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-sky-500" />
                  <span>{sch}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Transfer Console Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Porting Form (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Send className="w-4 h-4 text-sky-600" />
              Transfer Service Passport to Neighboring State
            </h2>

            <form onSubmit={handlePort} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Source Application ID (Maharashtra)
                </label>
                <input
                  type="text"
                  value={appNumber}
                  onChange={(e) => setAppNumber(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Beneficiary Name
                  </label>
                  <input
                    type="text"
                    value={citizenName}
                    onChange={(e) => setCitizenName(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Destination State
                  </label>
                  <select
                    value={targetState}
                    onChange={(e) => setTargetState(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 bg-white"
                  >
                    {anchorsData?.trust_anchors?.map((s: any) => (
                      <option key={s.state_id} value={s.state_id}>
                        {s.state_name} ({s.portal_name})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Purpose / Migration Category
                </label>
                <input
                  type="text"
                  value={migrationReason}
                  onChange={(e) => setMigrationReason(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={porting}
                className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {porting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Execute Cross-State Credential Port
              </button>
            </form>
          </div>
        </div>

        {/* Right: Portability Result Certificate (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          {portResult ? (
            <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-xl p-6 space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-400" />
                  <h3 className="text-sm font-bold text-white tracking-wide">INTER-STATE PORTABILITY CERTIFICATE</h3>
                </div>
                <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                  WAIVED_SECONDARY_DOCS
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Transaction Reference</span>
                  <span className="font-mono text-indigo-300">{portResult.port_transaction_id}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Source Gateway</span>
                    <span className="font-medium text-white">{portResult.source_hub}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Target Hub</span>
                    <span className="font-medium text-amber-300">{portResult.target_hub}</span>
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Portability Certificate URI</span>
                  <p className="font-mono text-[10px] text-emerald-400 bg-slate-950 p-2 rounded border border-slate-800 break-all select-all">
                    {portResult.credential_portability_result.portability_certificate}
                  </p>
                </div>
              </div>

              <div className="bg-emerald-950/80 p-3 rounded-xl border border-emerald-800 text-xs text-emerald-200">
                <p className="font-semibold mb-0.5">Zero Re-Verification Guarantee</p>
                <p className="text-[11px] text-emerald-300/90">{portResult.telemetry_message}</p>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-8 text-center space-y-3">
              <Globe className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-700">Ready for Inter-State Transmission</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Submit the form to generate a cryptographically bound Inter-State Service Passport accepted across state jurisdictions under the ONOSP framework.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
