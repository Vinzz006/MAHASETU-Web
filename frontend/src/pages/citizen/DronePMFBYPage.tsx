import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import {
  Sprout, IndianRupee, CheckCircle2, RefreshCw, Plane,
  Satellite, Zap, Award, ArrowRight, ShieldCheck, Check
} from 'lucide-react';

export const DronePMFBYPage: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSurveyId, setSelectedSurveyId] = useState('DRONE-UAV-LAT-2026-081');
  const [settling, setSettling] = useState(false);
  const [settleResult, setSettleResult] = useState<any | null>(null);

  const fetchSurveys = async () => {
    try {
      const res = await api.getDronePMFBYSurveys();
      setData(res);
      if (res.surveys?.length && !selectedSurveyId) {
        setSelectedSurveyId(res.surveys[0].survey_id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSurveys();
  }, []);

  const handleSettle = async () => {
    setSettling(true);
    setSettleResult(null);
    try {
      const res = await api.settleDronePMFBYClaim(selectedSurveyId);
      setSettleResult(res);
      fetchSurveys();
    } catch (e: any) {
      alert('Claim settlement failed: ' + e.message);
    } finally {
      setSettling(false);
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
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-900 rounded-full text-xs font-semibold tracking-wide uppercase mb-3">
          <Sprout className="w-3.5 h-3.5 text-emerald-600" />
          MahaPahani — Drone AI Crop Damage &amp; PMFBY Insurance
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
          Drone Multispectral Crop Loss Assessment &amp; Instant Claim
        </h1>
        <p className="mt-2 text-base text-slate-600">
          Instant crop loss compensation under the Pradhan Mantri Fasal Bima Yojana (PMFBY). Replaces 60-day physical crop-cutting experiments with automated aerial drone multispectral Normalized Difference Vegetation Index (NDVI) imagery analysis.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Drone Mission Surveys (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Plane className="w-4 h-4 text-emerald-600" />
              Aerial Multispectral Drone Missions
            </h2>

            <div className="space-y-3">
              {data?.surveys?.map((s: any) => (
                <div
                  key={s.survey_id}
                  onClick={() => setSelectedSurveyId(s.survey_id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer text-xs space-y-2 ${
                    selectedSurveyId === s.survey_id
                      ? 'border-emerald-500 bg-emerald-50/50 shadow-sm'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-900">{s.survey_id}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      s.claim_status.includes('APPROVED') ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {s.claim_status}
                    </span>
                  </div>

                  <div>
                    <span className="font-bold text-slate-900 text-sm">{s.farmer_name}</span>
                    <p className="text-slate-500 text-[11px] mt-0.5">{s.crop} • Gat {s.gat_number} ({s.taluka}, {s.district})</p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-600 pt-1 border-t border-slate-200/60">
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block">Pre-NDVI</span>
                      <span className="font-semibold">{s.pre_disaster_ndvi}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block">Post-NDVI</span>
                      <span className="font-semibold text-red-600">{s.post_disaster_ndvi}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block">Loss %</span>
                      <span className="font-black text-red-600">{s.damage_percentage}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleSettle}
              disabled={settling}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {settling ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              Execute Instant PMFBY Direct Benefit Transfer
            </button>
          </div>
        </div>

        {/* Right: Instant Settlement Receipt (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          {settleResult ? (
            <div className="bg-slate-900 text-white rounded-2xl border border-emerald-500/40 shadow-xl p-6 space-y-4 animate-in fade-in duration-300 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> PMFBY CLAIM SETTLED VIA APBS
                </span>
                <span className="font-mono text-[10px] text-slate-400">{settleResult.dbt_utr_number}</span>
              </div>

              <div>
                <span className="text-[10px] uppercase text-slate-400 block">Beneficiary Farmer</span>
                <p className="text-base font-bold text-white">{settleResult.farmer_name}</p>
                <p className="text-xs text-slate-300 mt-0.5">Plot Gat No. {settleResult.gat_number}, {settleResult.district} ({settleResult.crop})</p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] uppercase text-slate-400 block">Direct Compensation Credit</span>
                  <span className="text-lg font-black text-emerald-400">
                    ₹{settleResult.insurance_payout_amount_inr?.toLocaleString()}
                  </span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] uppercase text-slate-400 block">NDVI Loss Delta</span>
                  <span className="text-base font-bold text-red-400">-{settleResult.ndvi_damage_delta}</span>
                </div>
              </div>

              <div className="bg-emerald-950/70 p-3 rounded-xl border border-emerald-800 space-y-1 text-emerald-200">
                <p className="font-bold text-[11px]">Turnaround Efficiency</p>
                <p className="text-emerald-300/90 text-[10px]">{settleResult.settlement_timeline}</p>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-8 text-center space-y-3">
              <Sprout className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-700">Insurance Settlement Standby</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Select an aerial drone survey to evaluate multispectral vegetation loss and trigger an instant PMFBY DBT credit directly to the farmer's bank account.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
