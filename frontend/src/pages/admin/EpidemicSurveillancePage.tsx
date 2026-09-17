import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import {
  Activity, ShieldAlert, CheckCircle2, RefreshCw,
  Droplets, Bug, AlertTriangle, Building, Send, Check
} from 'lucide-react';

export const EpidemicSurveillancePage: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedClusterId, setSelectedClusterId] = useState('HEALTH-MUM-FSOUTH-01');
  const [forecasting, setForecasting] = useState(false);
  const [forecastResult, setForecastResult] = useState<any | null>(null);

  const fetchClusters = async () => {
    try {
      const res = await api.getEpidemicWardClusters();
      setData(res);
      if (res.clusters?.length && !selectedClusterId) {
        setSelectedClusterId(res.clusters[0].cluster_id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClusters();
  }, []);

  const handleForecast = async () => {
    setForecasting(true);
    setForecastResult(null);
    try {
      const res = await api.forecastVectorOutbreak(selectedClusterId);
      setForecastResult(res);
    } catch (e: any) {
      alert('Forecast failed: ' + e.message);
    } finally {
      setForecasting(false);
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
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-100 text-red-900 rounded-full text-xs font-semibold tracking-wide uppercase mb-3">
          <Bug className="w-3.5 h-3.5 text-red-600" />
          MahaArogya — Epidemic Surveillance &amp; Vector Control
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
          Public Health Epidemic Vector Surveillance
        </h1>
        <p className="mt-2 text-base text-slate-600">
          Federated syndromic disease monitoring across public health centers (PHCs) and municipal hospitals. Analyzes dengue, leptospirosis, and malaria spikes against precipitation vectors to issue automated municipal fumigation orders.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Monitored Ward Clusters (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-red-600" />
              Syndromic Health Posts &amp; Rainfall Vectors
            </h2>

            <div className="space-y-3">
              {data?.clusters?.map((c: any) => (
                <div
                  key={c.cluster_id}
                  onClick={() => setSelectedClusterId(c.cluster_id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer text-xs space-y-2 ${
                    selectedClusterId === c.cluster_id
                      ? 'border-red-500 bg-red-50/50 shadow-sm'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-900">{c.cluster_id}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      c.status.includes('ELEVATED') ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {c.status}
                    </span>
                  </div>

                  <div>
                    <span className="font-bold text-slate-900 text-sm">{c.ward}</span>
                    <p className="text-slate-500 text-[11px] mt-0.5">{c.district} • Vector: {c.disease_vector}</p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-600 pt-1 border-t border-slate-200/60">
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block">Weekly</span>
                      <span className="font-black text-red-600">{c.weekly_cases} cases</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block">Baseline</span>
                      <span className="font-semibold">{c.three_year_baseline_cases}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block">Rainfall</span>
                      <span className="font-bold text-blue-600">{c.monsoon_rainfall_mm} mm</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleForecast}
              disabled={forecasting}
              className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {forecasting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Bug className="w-4 h-4 text-red-400" />}
              Run Outbreak Predictive Model &amp; Issue Orders
            </button>
          </div>
        </div>

        {/* Right: Outbreak Forecast Report (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          {forecastResult ? (
            <div className="bg-slate-900 text-white rounded-2xl border border-red-500/40 shadow-xl p-6 space-y-4 animate-in fade-in duration-300 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className={`font-bold flex items-center gap-1.5 ${
                  forecastResult.epidemic_threat_level.includes('RED') ? 'text-red-400' : 'text-emerald-400'
                }`}>
                  <AlertTriangle className="w-4 h-4" /> {forecastResult.epidemic_threat_level}
                </span>
                <span className="font-mono text-[10px] text-slate-400">
                  OUTBREAK PROBABILITY: {forecastResult.outbreak_probability_pct}%
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase text-slate-400 block">Affected Zone</span>
                <p className="font-bold text-white text-sm mt-0.5">{forecastResult.ward}</p>
                <p className="text-xs text-red-300 mt-0.5">Vector: {forecastResult.disease_vector}</p>
              </div>

              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] uppercase text-slate-400 block font-bold">Automated Public Health Directives</span>
                {forecastResult.automated_public_health_orders?.map((order: string, idx: number) => (
                  <p key={idx} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-[11px] text-red-200">
                    ✓ {order}
                  </p>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-8 text-center space-y-3">
              <Activity className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-700">Epidemic Radar Standby</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Select a municipal ward to evaluate rainfall and hospital syndromic spikes, automatically calculating outbreak risks and dispatching drone larvicide orders.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
