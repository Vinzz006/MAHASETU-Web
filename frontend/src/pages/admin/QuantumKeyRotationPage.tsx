import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import {
  KeyRound, ShieldCheck, CheckCircle2, RefreshCw, Lock,
  Cpu, Award, ArrowRight, Shield, Zap
} from 'lucide-react';

export const QuantumKeyRotationPage: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRingId, setSelectedRingId] = useState('HSM-RING-STATE-ROOT-01');
  const [rotating, setRotating] = useState(false);
  const [rotationResult, setRotationResult] = useState<any | null>(null);

  const fetchKeyRings = async () => {
    try {
      const res = await api.getQuantumKeyRings();
      setData(res);
      if (res.key_rings?.length && !selectedRingId) {
        setSelectedRingId(res.key_rings[0].key_ring_id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeyRings();
  }, []);

  const handleRotate = async () => {
    setRotating(true);
    setRotationResult(null);
    try {
      const res = await api.rotateQuantumKey(selectedRingId);
      setRotationResult(res);
      fetchKeyRings();
    } catch (e: any) {
      alert('Key rotation failed: ' + e.message);
    } finally {
      setRotating(false);
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
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-violet-100 text-violet-900 rounded-full text-xs font-semibold tracking-wide uppercase mb-3">
          <KeyRound className="w-3.5 h-3.5 text-violet-600" />
          MahaChabi — Quantum-Resistant Key Lifecycle
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
          Hardware Security Module (HSM) Quantum Key Rotation
        </h1>
        <p className="mt-2 text-base text-slate-600">
          Autonomous zero-downtime cryptographic key rotation compliant with FIPS 140-3 Level 4 and NIST ML-DSA (Dilithium) lattice signatures. Automates root key lifecycle transitions across all 36 district collectorates without dropping citizen transactions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Active HSM Key Rings (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-violet-600" />
              State Hardware Security Module (HSM) Rings
            </h2>

            <div className="space-y-3">
              {data?.key_rings?.map((ring: any) => (
                <div
                  key={ring.key_ring_id}
                  onClick={() => setSelectedRingId(ring.key_ring_id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer text-xs space-y-2 ${
                    selectedRingId === ring.key_ring_id
                      ? 'border-violet-500 bg-violet-50/50 shadow-sm'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-900">{ring.key_ring_id}</span>
                    <span className="text-[10px] font-bold text-violet-700 bg-violet-100 px-2 py-0.5 rounded-full">
                      {ring.key_version} • {ring.status}
                    </span>
                  </div>

                  <div>
                    <span className="font-bold text-slate-900 text-sm">{ring.scope}</span>
                    <p className="text-slate-500 text-[11px] font-mono mt-0.5">Algorithm: {ring.algorithm}</p>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1 border-t border-slate-200/60">
                    <span>Key Age: {ring.age_days} days</span>
                    <span>Interval: Every {ring.rotation_interval_days} days</span>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleRotate}
              disabled={rotating}
              className="w-full py-3 px-4 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs rounded-xl transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {rotating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4 text-violet-200" />}
              Execute Zero-Downtime Post-Quantum Key Rotation
            </button>
          </div>
        </div>

        {/* Right: Key Rotation Result Drawer (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {rotationResult ? (
            <div className="bg-slate-900 text-white rounded-2xl border border-violet-500/40 shadow-xl p-6 space-y-4 animate-in fade-in duration-300 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-violet-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> QUANTUM LATTICE ROTATED
                </span>
                <span className="font-mono text-[10px] text-slate-400">{rotationResult.active_new_version}</span>
              </div>

              <div>
                <span className="text-[10px] uppercase text-slate-400 block mb-0.5">New Public Key Fingerprint</span>
                <p className="font-mono text-xs text-amber-300 bg-slate-950 p-2 rounded border border-slate-800 select-all">
                  {rotationResult.new_public_key_fingerprint}
                </p>
              </div>

              <div>
                <span className="text-[10px] uppercase text-slate-400 block mb-0.5">HSM Audit URN</span>
                <p className="font-mono text-[9px] text-violet-300 bg-slate-950 p-2 rounded border border-slate-800 break-all select-all">
                  {rotationResult.audit_certificate_urn}
                </p>
              </div>

              <div className="bg-violet-950/60 p-3 rounded-xl border border-violet-800 text-[11px] text-violet-200 space-y-1">
                <p className="font-bold">Zero-Downtime Session Guarantee</p>
                <p className="text-violet-300/90 text-[10px]">{rotationResult.zero_downtime_guarantee}</p>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-8 text-center space-y-3">
              <KeyRound className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-700">HSM Sentinel Standby</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Trigger autonomous rotation to mint fresh NIST ML-DSA Dilithium key pairs with zero disruption to inflight citizen verifications.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
