import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import {
  CloudFog, Flame, CheckCircle2, RefreshCw, AlertOctagon,
  Factory, ShieldAlert, AlertTriangle, ArrowRight, ShieldCheck, Check
} from 'lucide-react';

export const IndustrialEmissionsPage: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStackId, setSelectedStackId] = useState('STACK-TAR-CHEM-01');
  const [enforcing, setEnforcing] = useState(false);
  const [noticeResult, setNoticeResult] = useState<any | null>(null);

  const fetchStacks = async () => {
    try {
      const res = await api.getIndustrialStacks();
      setData(res);
      if (res.stacks?.length && !selectedStackId) {
        setSelectedStackId(res.stacks[0].stack_id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStacks();
  }, []);

  const handleEnforce = async () => {
    setEnforcing(true);
    setNoticeResult(null);
    try {
      const res = await api.issueIndustrialPenalty(selectedStackId);
      setNoticeResult(res);
      fetchStacks();
    } catch (e: any) {
      alert('Enforcement failed: ' + e.message);
    } finally {
      setEnforcing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <RefreshCw className="w-8 h-8 animate-spin text-rose-500" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-100 text-rose-900 rounded-full text-xs font-semibold tracking-wide uppercase mb-3">
          <CloudFog className="w-3.5 h-3.5 text-rose-600" />
          MahaVayu — Industrial Emissions &amp; MPCB Compliance
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
          Industrial Stack Air Quality &amp; Carbon Compliance
        </h1>
        <p className="mt-2 text-base text-slate-600">
          Continuous Emission Monitoring Systems (CEMS) telemetry across Maharashtra Industrial Development Corporation (MIDC) manufacturing zones. Automatically serves statutory Stop-Work and environmental penalty notices upon NAAQS threshold breaches.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Monitored Industrial Stacks (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Factory className="w-4 h-4 text-rose-600" />
              Live CEMS Industrial Chimney Telemetry
            </h2>

            <div className="space-y-3">
              {data?.stacks?.map((st: any) => (
                <div
                  key={st.stack_id}
                  onClick={() => setSelectedStackId(st.stack_id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer text-xs space-y-2 ${
                    selectedStackId === st.stack_id
                      ? 'border-rose-500 bg-rose-50/50 shadow-sm'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-900">{st.stack_id}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      st.compliance_status.includes('BREACH') ? 'bg-red-100 text-red-800 animate-pulse' :
                      st.compliance_status.includes('STOP') ? 'bg-purple-100 text-purple-800 font-black' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {st.compliance_status}
                    </span>
                  </div>

                  <div>
                    <span className="font-bold text-slate-900 text-sm">{st.plant_name}</span>
                    <p className="text-slate-500 text-[11px] mt-0.5">{st.industrial_zone} • {st.district}</p>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-[11px] text-slate-600 pt-1 border-t border-slate-200/60">
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block">PM2.5</span>
                      <span className={`font-bold ${st.pm25_ug_m3 > 60 ? 'text-red-600' : 'text-slate-900'}`}>
                        {st.pm25_ug_m3} µg/m³
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block">PM10</span>
                      <span className="font-semibold">{st.pm10_ug_m3} µg/m³</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block">SO2</span>
                      <span className="font-semibold">{st.so2_ppm} ppm</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block">Opacity</span>
                      <span className="font-semibold">{st.opacity_pct}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleEnforce}
              disabled={enforcing}
              className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {enforcing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <AlertOctagon className="w-4 h-4 text-red-200" />}
              Enforce Statutory MPCB Stop-Work &amp; Penalty Order
            </button>
          </div>
        </div>

        {/* Right: Enforcement Notice (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          {noticeResult ? (
            <div className="bg-slate-900 text-white rounded-2xl border border-rose-500/40 shadow-xl p-6 space-y-4 animate-in fade-in duration-300 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-rose-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> STATUTORY STOP-WORK ORDER SERVED
                </span>
                <span className="font-mono text-[10px] text-slate-400">{noticeResult.notice_id}</span>
              </div>

              <div>
                <span className="text-[10px] uppercase text-slate-400 block">Defaulting Industrial Facility</span>
                <p className="font-bold text-white text-base mt-0.5">{noticeResult.target_plant}</p>
                <p className="text-xs text-rose-300 mt-0.5">{noticeResult.industrial_zone}</p>
              </div>

              <div className="p-3 bg-red-950/60 rounded-xl border border-red-800 text-[11px] text-red-200 space-y-1">
                <span className="text-[10px] uppercase text-red-400 block font-semibold">Statutory NAAQS Violation</span>
                <p className="font-bold">{noticeResult.primary_breach}</p>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400 text-xs">Environmental Damage Fine</span>
                <span className="text-base font-black text-amber-400">
                  ₹{(noticeResult.environmental_damage_fine_inr / 100000).toFixed(1)} Lakhs
                </span>
              </div>

              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-[10px] text-slate-400 space-y-1">
                <p className="text-white font-semibold">{noticeResult.enforcement_action}</p>
                <p className="text-slate-500">{noticeResult.statutory_act}</p>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-8 text-center space-y-3">
              <Factory className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-700">Emissions Enforcement Standby</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Select an industrial stack experiencing critical emission exceedance to issue an automated legally enforceable MPCB Stop-Work order and grid utility disconnect.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
