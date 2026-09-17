import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import {
  Fingerprint, KeyRound, CheckCircle2, RefreshCw, Shield,
  Globe2, Check, ArrowRight, UserCheck, Award
} from 'lucide-react';

export const MeriPehchaanSSOPage: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [citizenName, setCitizenName] = useState('Ananya Vikram Rao');
  const [homeState, setHomeState] = useState('Karnataka');
  const [authenticating, setAuthenticating] = useState(false);
  const [authResult, setAuthResult] = useState<any | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await api.getMeriPehchaanFederationStatus();
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleExchange = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthenticating(true);
    setAuthResult(null);
    try {
      const res = await api.exchangeMeriPehchaanToken({
        citizen_name: citizenName,
        home_state: homeState
      });
      setAuthResult(res);
    } catch (e: any) {
      alert('Authentication failed: ' + e.message);
    } finally {
      setAuthenticating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 text-indigo-900 rounded-full text-xs font-semibold tracking-wide uppercase mb-3">
          <Fingerprint className="w-3.5 h-3.5 text-indigo-600" />
          MahaPehchaan — National Single-Sign-On (NSSO) Federation
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
          MeriPehchaan &amp; Jan Parichay National SSO Bridge
        </h1>
        <p className="mt-2 text-base text-slate-600">
          Sovereign identity federation with the Government of India's MeriPehchaan and Jan Parichay Single-Sign-On platforms. Enables any Indian citizen to access Maharashtra services seamlessly with zero duplicate registration.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Federation Status & Login Form (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Globe2 className="w-4 h-4 text-indigo-600" />
              National SSO Trust Anchors
            </h2>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">NIC / Digital India Federation</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {data?.federation_health}
                </span>
              </div>
              <p className="text-slate-500 text-[11px] font-mono">Protocol: {data?.protocol}</p>
              <div className="pt-1 border-t border-slate-200/60 text-[11px] text-slate-600 space-y-1">
                <span className="text-[10px] uppercase text-slate-400 block font-semibold">Federated Trust Issuers:</span>
                {data?.supported_national_issuers?.map((iss: string, idx: number) => (
                  <p key={idx} className="font-mono text-[10px] text-indigo-700 truncate">
                    • {iss}
                  </p>
                ))}
              </div>
            </div>

            <form onSubmit={handleExchange} className="space-y-4 text-xs pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">Citizen Name</label>
                  <input
                    type="text"
                    value={citizenName}
                    onChange={(e) => setCitizenName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">Originating State</label>
                  <select
                    value={homeState}
                    onChange={(e) => setHomeState(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="Karnataka">Karnataka</option>
                    <option value="Gujarat">Gujarat</option>
                    <option value="Telangana">Telangana</option>
                    <option value="Madhya Pradesh">Madhya Pradesh</option>
                    <option value="Delhi NCT">Delhi NCT</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={authenticating}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {authenticating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Fingerprint className="w-4 h-4" />}
                Federate Identity &amp; Authenticate via MeriPehchaan
              </button>
            </form>
          </div>
        </div>

        {/* Right: Federated Session Result (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          {authResult ? (
            <div className="bg-slate-900 text-white rounded-2xl border border-indigo-500/40 shadow-xl p-6 space-y-4 animate-in fade-in duration-300 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-indigo-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> NATIONAL SSO AUTHENTICATED
                </span>
                <span className="font-mono text-[10px] text-slate-400">{authResult.auth_provider}</span>
              </div>

              <div>
                <span className="text-[10px] uppercase text-slate-400 block">Authenticated Citizen</span>
                <p className="font-bold text-white text-base mt-0.5">{authResult.citizen_name}</p>
                <p className="text-xs text-indigo-300 mt-0.5">Home State: {authResult.home_state}</p>
              </div>

              <div>
                <span className="text-[10px] uppercase text-slate-400 block mb-0.5">MahaSetu Universal Session Token</span>
                <p className="font-mono text-xs font-bold text-amber-400 bg-slate-950 p-2 rounded border border-slate-800 select-all">
                  {authResult.mahasetu_session_token}
                </p>
              </div>

              <div className="p-3 bg-emerald-950/60 rounded-xl border border-emerald-800 text-[11px] text-emerald-200 space-y-1">
                <p className="font-bold">Cross-State Mobility Granted</p>
                <p className="text-[10px] text-emerald-300/90">{authResult.cross_state_interoperability}</p>
              </div>

              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-[10px] text-slate-400">
                Zero-Duplicate Registration: {authResult.zero_duplicate_registration}
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-8 text-center space-y-3">
              <Fingerprint className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-700">National SSO Bridge Ready</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Authenticate using your MeriPehchaan or Jan Parichay credentials to gain instant single-window access across all Maharashtra departments.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
