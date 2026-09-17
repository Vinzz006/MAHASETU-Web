import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import {
  Globe, Award, CheckCircle2, RefreshCw, Send,
  FileCheck, ShieldCheck, Plane, Building2, MapPin
} from 'lucide-react';

export const DiasporaGatewayPage: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [citizenName, setCitizenName] = useState('Demo Diaspora Citizen');
  const [passportNo, setPassportNo] = useState('Z9812401');
  const [country, setCountry] = useState('United States of America');
  const [docType, setDocType] = useState('7-12_LAND_RECORD_TITLE');
  const [appId, setAppId] = useState('MH-APP-2026-000184');
  const [attesting, setAttesting] = useState(false);
  const [apostilleResult, setApostilleResult] = useState<any | null>(null);

  const fetchDiaspora = async () => {
    try {
      const res = await api.getDiasporaRequests();
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiaspora();
  }, []);

  const handleAttest = async (e: React.FormEvent) => {
    e.preventDefault();
    setAttesting(true);
    setApostilleResult(null);
    try {
      const res = await api.attestDocumentDiaspora({
        citizen_name: citizenName,
        passport_number: passportNo,
        destination_country: country,
        document_type: docType,
        source_application_number: appId
      });
      setApostilleResult(res);
      fetchDiaspora();
    } catch (e: any) {
      alert('Attestation failed: ' + e.message);
    } finally {
      setAttesting(false);
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
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-900 rounded-full text-xs font-semibold tracking-wide uppercase mb-3">
          <Globe className="w-3.5 h-3.5 text-blue-600" />
          MahaPravasi — Global Diaspora Gateway
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
          Cross-Border Consular Attestation &amp; Digital Apostille
        </h1>
        <p className="mt-2 text-base text-slate-600">
          Seamless international document recognition for Maharashtra's overseas diaspora. In partnership with the Ministry of External Affairs (MEA) e-Sanad, fast-track digital Hague Apostilles for ancestral property records, university transcripts, and civil certificates.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Attestation Request Form (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Plane className="w-4 h-4 text-blue-600" />
              Apply for International Digital Apostille
            </h2>

            <form onSubmit={handleAttest} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Diaspora Beneficiary Full Name
                </label>
                <input
                  type="text"
                  value={citizenName}
                  onChange={(e) => setCitizenName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Indian Passport Number
                  </label>
                  <input
                    type="text"
                    value={passportNo}
                    onChange={(e) => setPassportNo(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Destination Nation
                  </label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="United States of America">United States of America</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="United Arab Emirates">United Arab Emirates</option>
                    <option value="Germany">Germany</option>
                    <option value="Australia">Australia</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Document Category
                  </label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="7-12_LAND_RECORD_TITLE">7/12 Land Title Extract</option>
                    <option value="UNIVERSITY_DEGREE_TRANSCRIPT">University Degree Transcript</option>
                    <option value="CIVIL_BIRTH_EXTRACT">Civil Birth Extract</option>
                    <option value="INHERITANCE_SUCCESSION_NOC">Legal Heir / Succession NOC</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    MahaSetu App ID
                  </label>
                  <input
                    type="text"
                    value={appId}
                    onChange={(e) => setAppId(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 font-mono"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={attesting}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {attesting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4" />}
                Issue Hague Apostille Digital Certificate
              </button>
            </form>
          </div>

          {/* Recent Attestations */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-2.5">
            <h3 className="text-xs font-bold text-slate-700 uppercase">Recent Consular Attestations</h3>
            {data?.requests?.map((req: any) => (
              <div key={req.diaspora_id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">{req.citizen_name}</p>
                  <p className="text-[10px] text-slate-500">{req.destination_country} • {req.document_type}</p>
                </div>
                <span className="font-mono text-[10px] text-blue-700 bg-blue-100 px-2 py-0.5 rounded font-semibold">
                  {req.apostille_status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Issued Apostille Seal (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          {apostilleResult ? (
            <div className="bg-slate-900 text-white rounded-2xl border border-blue-500/40 shadow-xl p-6 space-y-4 animate-in fade-in duration-300 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Award className="w-6 h-6 text-amber-400" />
                  <div>
                    <h3 className="text-xs font-bold text-white tracking-wide uppercase">
                      HAGUE CONVENTION APOSTILLE (e-SANAD)
                    </h3>
                    <span className="text-[10px] text-amber-300 font-mono">{apostilleResult.apostille_number}</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold bg-blue-500/30 text-blue-300 border border-blue-500/40 px-2 py-0.5 rounded-full">
                  LEGALIZED
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase text-slate-400 block">Bearer Name &amp; Passport</span>
                <p className="text-base font-bold text-white">{apostilleResult.citizen_name}</p>
                <p className="text-xs text-slate-300 mt-0.5 font-mono">Passport: {apostilleResult.passport_number}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] uppercase text-slate-400 block">Target Nation</span>
                  <span className="text-xs font-bold text-white">{apostilleResult.destination_country}</span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] uppercase text-slate-400 block">Document</span>
                  <span className="text-xs font-bold text-indigo-300 truncate block">{apostilleResult.document_type}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase text-slate-400 block mb-0.5">Apostille Certificate URN</span>
                <p className="font-mono text-[9px] text-amber-300 bg-slate-950 p-2 rounded border border-slate-800 break-all select-all">
                  {apostilleResult.hague_apostille_seal.certificate_urn}
                </p>
              </div>

              <div className="bg-blue-950/60 p-3 rounded-xl border border-blue-800 text-[11px] text-blue-200">
                <p className="font-bold mb-0.5">126-Nation Legal Recognition</p>
                <p className="text-blue-300/90">{apostilleResult.hague_apostille_seal.consular_validity}</p>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-8 text-center space-y-3">
              <Globe className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-700">Apostille Legalization Ready</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Submit diaspora documents to generate an authenticated digital apostille accepted by foreign embassies, universities, and consulates under the 1961 Hague Convention.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
