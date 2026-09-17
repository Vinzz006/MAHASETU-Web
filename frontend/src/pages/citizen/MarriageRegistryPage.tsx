import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import {
  Heart, Users, CheckCircle2, RefreshCw, FileCheck,
  Building, Award, ShieldCheck, Check, Sparkles
} from 'lucide-react';

export const MarriageRegistryPage: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [spouseOne, setSpouseOne] = useState('Gaurav Vilas Shinde');
  const [spouseTwo, setSpouseTwo] = useState('Sayali Eknath Patil');
  const [venue, setVenue] = useState('Shivaji Park Cultural Hall, Dadar, Mumbai');
  const [corporation, setCorporation] = useState('Brihanmumbai Municipal Corporation');
  const [registering, setRegistering] = useState(false);
  const [regResult, setRegResult] = useState<any | null>(null);

  const fetchMarriages = async () => {
    try {
      const res = await api.getRecentMarriages();
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarriages();
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegistering(true);
    setRegResult(null);
    try {
      const res = await api.registerMarriage({
        spouse_one_name: spouseOne,
        spouse_two_name: spouseTwo,
        marriage_venue: venue,
        corporation: corporation
      });
      setRegResult(res);
      fetchMarriages();
    } catch (e: any) {
      alert('Registration failed: ' + e.message);
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <RefreshCw className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-pink-100 text-pink-900 rounded-full text-xs font-semibold tracking-wide uppercase mb-3">
          <Heart className="w-3.5 h-3.5 text-pink-600" />
          MahaBandhan — Municipal Marriage e-Registry &amp; Joint Entitlements
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
          Paperless Municipal Marriage e-Registry
        </h1>
        <p className="mt-2 text-base text-slate-600">
          Zero-touch civil marriage registration integrating Aadhaar biometric e-Sign. Automatically synthesizes civil status across all Maharashtra databases, generating a joint family ration unit, PMAY housing quota, and pension nominee records with zero redundant paperwork.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Registration Form (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-pink-600" />
              Register Civil Marriage Paperlessly
            </h2>

            <form onSubmit={handleRegister} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">Spouse One (Groom)</label>
                  <input
                    type="text"
                    value={spouseOne}
                    onChange={(e) => setSpouseOne(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">Spouse Two (Bride)</label>
                  <input
                    type="text"
                    value={spouseTwo}
                    onChange={(e) => setSpouseTwo(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">Solemnization Venue</label>
                <input
                  type="text"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">Municipal Jurisdiction</label>
                <select
                  value={corporation}
                  onChange={(e) => setCorporation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="Brihanmumbai Municipal Corporation">Brihanmumbai Municipal Corporation (BMC)</option>
                  <option value="Pune Municipal Corporation">Pune Municipal Corporation (PMC)</option>
                  <option value="Nagpur Municipal Corporation">Nagpur Municipal Corporation (NMC)</option>
                  <option value="Chhatrapati Sambhajinagar Municipal Corporation">Chhatrapati Sambhajinagar Municipal Corporation</option>
                </select>
              </div>

              <div className="p-3 bg-pink-50 rounded-xl border border-pink-100 text-[11px] text-pink-900 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-pink-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Dual Biometric e-Sign Active:</strong> Registration uses Aadhaar DigiLocker e-KYC; no physical witness visits or affidavits required.
                </span>
              </div>

              <button
                type="submit"
                disabled={registering}
                className="w-full py-3 px-4 bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs rounded-xl transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {registering ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Heart className="w-4 h-4" />}
                Register Marriage &amp; Auto-Provision Joint Welfare
              </button>
            </form>
          </div>
        </div>

        {/* Right: Issued Certificate (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          {regResult ? (
            <div className="bg-slate-900 text-white rounded-2xl border border-pink-500/40 shadow-xl p-6 space-y-4 animate-in fade-in duration-300 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-pink-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> MARRIAGE CERTIFICATE ISSUED
                </span>
                <span className="font-mono text-[10px] text-slate-400">{regResult.registration_id}</span>
              </div>

              <div>
                <span className="text-[10px] uppercase text-slate-400 block">Married Couple</span>
                <p className="font-bold text-white text-base mt-0.5">{regResult.couple_names}</p>
                <p className="text-xs text-pink-300 mt-0.5">{regResult.corporation}</p>
              </div>

              <div>
                <span className="text-[10px] uppercase text-slate-400 block mb-0.5">Cryptographic Certificate Hash</span>
                <p className="font-mono text-[10px] text-emerald-400 bg-slate-950 p-2 rounded border border-slate-800 select-all">
                  {regResult.digital_certificate_hash}
                </p>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <span className="text-[10px] uppercase text-slate-400 block font-semibold">Auto-Provisioned Joint Entitlements</span>
                {regResult.auto_provisioned_welfare?.map((item: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-2 text-[11px] text-emerald-300">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <div className="p-2.5 bg-pink-950/60 rounded-lg border border-pink-800 text-[10px] text-pink-300">
                Guarantee: {regResult.zero_paperwork_guarantee}
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-8 text-center space-y-3">
              <Heart className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-700">Civil Registry Standby</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Submit marriage registration details to instantly generate a digitally signed marriage certificate and automatically synchronize joint social security entitlements across state systems.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
