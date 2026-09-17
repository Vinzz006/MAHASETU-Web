import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import {
  Cpu, ShieldCheck, CheckCircle2, RefreshCw, Key,
  Lock, AlertTriangle, Atom, Zap, Server
} from 'lucide-react';

export const PQCSandboxPage: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState('DEPT_B_ELIGIBILITY');
  const [packetId, setPacketId] = useState('MH-APP-2026-PQC-01');
  const [simulating, setSimulating] = useState(false);
  const [handshakeResult, setHandshakeResult] = useState<any | null>(null);

  const fetchAssessment = async () => {
    try {
      const res = await api.getPQCQuantumAssessment();
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessment();
  }, []);

  const handleSimulateHandshake = async () => {
    setSimulating(true);
    setHandshakeResult(null);
    try {
      const res = await api.simulateHybridPQC({
        department_id: selectedDept,
        packet_id: packetId
      });
      setHandshakeResult(res);
    } catch (e: any) {
      alert('Handshake simulation failed: ' + e.message);
    } finally {
      setSimulating(false);
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
          <Atom className="w-3.5 h-3.5 text-violet-600" />
          Quantum-Safe Infrastructure
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
          Post-Quantum Cryptography (PQC) Transition Sandbox
        </h1>
        <p className="mt-2 text-base text-slate-600">
          Future-proofing inter-departmental government data exchanges against quantum cryptanalysis. Testing NIST-standardized Post-Quantum algorithms (ML-KEM lattice key exchange and ML-DSA digital signatures) in hybrid envelopes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Quantum Risk Audit Table & Simulator (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-violet-600" />
                Departmental Quantum Vulnerability Audit
              </h2>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                {data?.quantum_readiness_index_pct}% Readiness
              </span>
            </div>

            <div className="space-y-3 mb-6">
              {data?.evaluated_endpoints?.map((ep: any) => (
                <div key={ep.endpoint_name} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{ep.endpoint_name}</span>
                    <span className="font-mono text-[10px] font-semibold text-violet-700 bg-violet-100 px-2 py-0.5 rounded">
                      {ep.transition_status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1">
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block">Classical Primitive</span>
                      <span>{ep.classical_algorithm}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block">NIST Target Standard</span>
                      <span className="font-semibold text-indigo-700">{ep.pqc_target_standard}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Interactive Handshake Simulator */}
            <div className="border-t border-slate-200 pt-5 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Atom className="w-4 h-4 text-violet-600" />
                Simulate Hybrid Quantum-Resistant Envelope Handshake
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">Target Department</label>
                  <select
                    value={selectedDept}
                    onChange={(e) => setSelectedDept(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-violet-500 bg-white"
                  >
                    <option value="DEPT_B_ELIGIBILITY">Dept B (Eligibility Engine)</option>
                    <option value="DEPT_A_IDENTITY">Dept A (Civil Registry)</option>
                    <option value="DEPT_C_SANCTIONS">Dept C (PFMS Disbursals)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">Transaction Packet ID</label>
                  <input
                    type="text"
                    value={packetId}
                    onChange={(e) => setPacketId(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
              </div>

              <button
                onClick={handleSimulateHandshake}
                disabled={simulating}
                className="w-full py-2.5 px-4 bg-violet-600 hover:bg-violet-700 text-white font-medium text-xs rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {simulating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 text-amber-400" />}
                Execute Hybrid Classical + PQC Handshake
              </button>
            </div>
          </div>
        </div>

        {/* Right: Dual-Seal Cryptographic Envelope Inspector (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {handshakeResult ? (
            <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-xl p-6 space-y-4 animate-in fade-in duration-300 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-violet-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> HYBRID PQC ENVELOPE ACTIVE
                </span>
                <span className="text-[10px] font-mono text-emerald-400">DUAL-LAYER SEAL</span>
              </div>

              {/* Classical Layer */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-amber-400 block">
                  Layer 1: Classical Cryptography
                </span>
                <p className="text-[11px] text-slate-300">
                  Primitive: {handshakeResult.hybrid_envelope.classical_layer.primitive}
                </p>
                <p className="font-mono text-[9px] text-slate-400 break-all select-all">
                  {handshakeResult.hybrid_envelope.classical_layer.signature_digest}
                </p>
              </div>

              {/* Quantum Layer */}
              <div className="bg-violet-950/80 p-3 rounded-xl border border-violet-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-violet-300 block">
                  Layer 2: NIST Post-Quantum (Module Lattice)
                </span>
                <p className="text-[11px] text-violet-200">
                  Algorithm: {handshakeResult.hybrid_envelope.post_quantum_layer.primitive}
                </p>
                <p className="font-mono text-[9px] text-violet-300 break-all select-all">
                  {handshakeResult.hybrid_envelope.post_quantum_layer.shared_secret_cipher}
                </p>
                <span className="text-[10px] text-emerald-400 font-medium block pt-1">
                  ✓ {handshakeResult.hybrid_envelope.post_quantum_layer.resistance}
                </span>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                <span>Security Horizon: {handshakeResult.quantum_safe_expiry_horizon}</span>
                <span className="text-emerald-400">{handshakeResult.transport_security}</span>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-8 text-center space-y-3">
              <Cpu className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-700">Dual-Seal Cryptographic Sandbox</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Trigger the handshake simulation to inspect how classical Ed25519 signatures and NIST ML-KEM lattice encryption combine to protect public data across government boundaries.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
