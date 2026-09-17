import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import {
  MapPin, Satellite, ShieldCheck, CheckCircle2, RefreshCw,
  AlertTriangle, Navigation, Layers, Compass, Check
} from 'lucide-react';

export const BhoomiGeoCadastrePage: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [gatNo, setGatNo] = useState('142/B');
  const [district, setDistrict] = useState('Pune');
  const [taluka, setTaluka] = useState('Baramati');
  const [lat, setLat] = useState(18.1512);
  const [lng, setLng] = useState(74.5784);
  const [verifying, setVerifying] = useState(false);
  const [auditResult, setAuditResult] = useState<any | null>(null);

  const fetchParcels = async () => {
    try {
      const res = await api.getBhoomiParcels();
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParcels();
  }, []);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true);
    setAuditResult(null);
    try {
      const res = await api.verifyBhoomiPolygon({
        gat_number: gatNo,
        district,
        taluka,
        latitude: lat,
        longitude: lng
      });
      setAuditResult(res);
    } catch (e: any) {
      alert('Verification failed: ' + e.message);
    } finally {
      setVerifying(false);
    }
  };

  const handleSelectPreset = (p: any) => {
    setGatNo(p.gat_number);
    setDistrict(p.district);
    setTaluka(p.taluka);
    setLat(p.centroid_lat);
    setLng(p.centroid_lng);
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
          <Satellite className="w-3.5 h-3.5 text-emerald-600" />
          MahaBhoomi — Satellite Geo-Cadastre
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
          Automated Cadastral Geo-Fencing &amp; CRZ Validator
        </h1>
        <p className="mt-2 text-base text-slate-600">
          Instant satellite boundary verification powered by ISRO Bhuvan and Maharashtra Remote Sensing Application Centre (MRSAC). Eliminates manual survey delays by automatically validating agricultural land plots against coastal regulation buffers and forest reserves.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Monitored Cadastral Parcels (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              ISRO Bhuvan Monitored Cadastral Parcels
            </h2>

            <div className="space-y-3">
              {data?.parcels?.map((p: any) => (
                <div
                  key={p.parcel_id}
                  onClick={() => handleSelectPreset(p)}
                  className="p-4 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 cursor-pointer transition-all text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">
                      Gat No. {p.gat_number} ({p.taluka}, {p.district})
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      p.crz_coastal_conflict ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {p.crz_coastal_conflict ? 'CRZ-II RESTRICTED' : 'CLEAR'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-600">
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block">Area</span>
                      <span className="font-semibold">{p.area_hectares} Ha</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block">Centroid</span>
                      <span className="font-mono text-[10px]">{p.centroid_lat.toFixed(4)}, {p.centroid_lng.toFixed(4)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block">Classification</span>
                      <span className="font-semibold text-indigo-700 truncate block">{p.satellite_classification}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Point-in-Polygon Tester & Output (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Navigation className="w-4 h-4 text-emerald-600" />
              Test Cadastral Polygon Boundaries
            </h3>

            <form onSubmit={handleVerify} className="space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-1">Gat Number</label>
                  <input
                    type="text"
                    value={gatNo}
                    onChange={(e) => setGatNo(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-1">District</label>
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-1">Taluka</label>
                  <input
                    type="text"
                    value={taluka}
                    onChange={(e) => setTaluka(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-1">Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={lat}
                    onChange={(e) => setLat(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-1">Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={lng}
                    onChange={(e) => setLng(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={verifying}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {verifying ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Compass className="w-4 h-4" />}
                Run Satellite Polygon Verification
              </button>
            </form>
          </div>

          {/* Audit Result Display */}
          {auditResult && (
            <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 p-6 space-y-3 animate-in fade-in duration-300 text-xs shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className={`font-bold flex items-center gap-1.5 ${
                  auditResult.clearance_status === 'CLEARANCE_GRANTED' ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  <CheckCircle2 className="w-4 h-4" /> {auditResult.clearance_status}
                </span>
                <span className="font-mono text-[10px] text-slate-400">
                  SCORE: {auditResult.satellite_validation_score}%
                </span>
              </div>

              <div className="space-y-1 pt-1">
                <span className="text-[10px] uppercase text-slate-400 block">Spatial Restrictions &amp; Findings</span>
                {auditResult.spatial_restrictions?.map((r: string, idx: number) => (
                  <p key={idx} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-[11px] text-slate-200">
                    {r}
                  </p>
                ))}
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-800">
                <span>Gat: {auditResult.gat_number} ({auditResult.district})</span>
                <span className="font-mono">Timestamp: {auditResult.mrsac_layer_timestamp.slice(11, 19)} UTC</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
