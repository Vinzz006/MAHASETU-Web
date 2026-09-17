import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import {
  Calculator, IndianRupee, ShieldCheck, CheckCircle2, RefreshCw,
  Building, Lock, Award, ArrowRight, Shield, Check
} from 'lucide-react';

export const ZKPropertyTaxPage: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [zoneCode, setZoneCode] = useState('ZONE-MUM-BANDRA-01');
  const [carpetArea, setCarpetArea] = useState(850.0);
  const [declaredValue, setDeclaredValue] = useState(45000000.0);
  const [assessing, setAssessing] = useState(false);
  const [assessResult, setAssessResult] = useState<any | null>(null);

  const fetchRates = async () => {
    try {
      const res = await api.getReadyReckonerRates();
      setData(res);
      if (res.zones?.length && !zoneCode) {
        setZoneCode(res.zones[0].zone_code);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
  }, []);

  const handleAssess = async (e: React.FormEvent) => {
    e.preventDefault();
    setAssessing(true);
    setAssessResult(null);
    try {
      const res = await api.assessZKPropertyDuty({
        zone_code: zoneCode,
        carpet_area_sqft: carpetArea,
        declared_transaction_value_inr: declaredValue
      });
      setAssessResult(res);
    } catch (e: any) {
      alert('Assessment failed: ' + e.message);
    } finally {
      setAssessing(false);
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
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 text-indigo-900 rounded-full text-xs font-semibold tracking-wide uppercase mb-3">
          <Calculator className="w-3.5 h-3.5 text-indigo-600" />
          MahaKar — Zero-Knowledge Stamp Duty &amp; Property Tax
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
          Zero-Knowledge Property Valuation &amp; Stamp Duty
        </h1>
        <p className="mt-2 text-base text-slate-600">
          Algorithmically transparent property duty and municipal tax calculation based on official ready-reckoner benchmark rates. Generates cryptographic zero-knowledge valuation proofs that eliminate sub-registrar discretion and bribery.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Input Calculator (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building className="w-4 h-4 text-indigo-600" />
              Property &amp; Ready-Reckoner Inputs
            </h2>

            <form onSubmit={handleAssess} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">Ready-Reckoner Zone</label>
                <select
                  value={zoneCode}
                  onChange={(e) => setZoneCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                >
                  {data?.zones?.map((z: any) => (
                    <option key={z.zone_code} value={z.zone_code}>
                      {z.city}: {z.locality} (₹{z.ready_reckoner_rate_per_sqft?.toLocaleString()}/sq.ft)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">Carpet Area (Sq. Ft)</label>
                  <input
                    type="number"
                    value={carpetArea}
                    onChange={(e) => setCarpetArea(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">Declared Value (₹ INR)</label>
                  <input
                    type="number"
                    value={declaredValue}
                    onChange={(e) => setDeclaredValue(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={assessing}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {assessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                Assess Duty &amp; Mint ZK Valuation Hash
              </button>
            </form>
          </div>
        </div>

        {/* Right: ZK Duty Certificate (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          {assessResult ? (
            <div className="bg-slate-900 text-white rounded-2xl border border-indigo-500/40 shadow-xl p-6 space-y-4 animate-in fade-in duration-300 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-indigo-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> STATUTORY STAMP DUTY VERIFIED
                </span>
                <span className="font-mono text-[10px] text-slate-400">{assessResult.applicable_tax_rate_pct}% Total Duty</span>
              </div>

              <div>
                <span className="text-[10px] uppercase text-slate-400 block">Assessment Target</span>
                <p className="font-bold text-white text-sm mt-0.5">{assessResult.locality}</p>
                <p className="text-xs text-slate-400 mt-0.5">Taxable Consideration: ₹{assessResult.taxable_consideration_inr?.toLocaleString()}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] uppercase text-slate-400 block">Payable Stamp Duty</span>
                  <span className="text-base font-black text-amber-400">
                    ₹{assessResult.payable_stamp_duty_inr?.toLocaleString()}
                  </span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] uppercase text-slate-400 block">Annual Municipal Tax</span>
                  <span className="text-base font-black text-indigo-400">
                    ₹{assessResult.annual_municipal_property_tax_inr?.toLocaleString()}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase text-slate-400 block mb-0.5">Zero-Knowledge Valuation Proof</span>
                <p className="font-mono text-[11px] text-emerald-400 bg-slate-950 p-2 rounded border border-slate-800 select-all">
                  {assessResult.zero_knowledge_valuation_proof}
                </p>
              </div>

              <p className="text-[10px] text-slate-400 bg-slate-950 p-2 rounded border border-slate-800">
                {assessResult.sub_registrar_discretion}
              </p>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-8 text-center space-y-3">
              <Calculator className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-700">Valuation Standby</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Enter your property carpet area and declared consideration to compute statutory Maharashtra stamp duty and mint a tamper-proof zero-knowledge valuation proof.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
