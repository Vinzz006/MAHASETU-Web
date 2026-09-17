import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import {
  GitBranch, ShieldCheck, CheckCircle2, RefreshCw, Key,
  Lock, ArrowRight, Layers, FileCheck, Database, Check
} from 'lucide-react';

export const MerkleAuditLedgerPage: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [appNumber, setAppNumber] = useState('MH-APP-2026-000184');
  const [blockNumber, setBlockNumber] = useState(1042);
  const [verifying, setVerifying] = useState(false);
  const [proofResult, setProofResult] = useState<any | null>(null);

  const fetchBlocks = async () => {
    try {
      const res = await api.getMerkleBlocks();
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlocks();
  }, []);

  const handleVerifyInclusion = async () => {
    setVerifying(true);
    setProofResult(null);
    try {
      const res = await api.verifyMerkleInclusion({
        application_number: appNumber,
        block_number: blockNumber
      });
      setProofResult(res);
    } catch (e: any) {
      alert('Merkle verification failed: ' + e.message);
    } finally {
      setVerifying(false);
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
          <GitBranch className="w-3.5 h-3.5 text-emerald-600" />
          MahaLekha — Cryptographic Audit Notary
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
          Zero-Trust Merkle Tree Audit Notary &amp; Proof Explorer
        </h1>
        <p className="mt-2 text-base text-slate-600">
          Mathematically immutable governance. Every inter-departmental transaction, DPDP consent grant, and field verification is hashed into a cryptographic Merkle tree anchored with root digests, enabling instant proof of non-tampering for judicial and CAG scrutiny.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Merkle Block Explorer & Verifier Form (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-600" />
              Notarized Merkle Blocks Explorer
            </h2>

            <div className="space-y-3 mb-6">
              {data?.recent_blocks?.map((block: any) => (
                <div key={block.block_number} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 font-mono">Block #{block.block_number}</span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      {block.state_seal}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase text-slate-400 block">Merkle Root Digest</span>
                    <p className="font-mono text-[10px] text-slate-700 break-all select-all">{block.merkle_root}</p>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-200/60">
                    <span>Transactions: {block.transactions_batched}</span>
                    <span>Validators: {block.validator_nodes.length} consensus nodes</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Interactive Inclusion Proof Verifier */}
            <div className="border-t border-slate-200 pt-5 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Key className="w-4 h-4 text-indigo-600" />
                Verify Merkle Audit Inclusion Proof (RFC 6962)
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">Target Application ID</label>
                  <input
                    type="text"
                    value={appNumber}
                    onChange={(e) => setAppNumber(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">Anchored Block Number</label>
                  <input
                    type="number"
                    value={blockNumber}
                    onChange={(e) => setBlockNumber(parseInt(e.target.value))}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
              </div>

              <button
                onClick={handleVerifyInclusion}
                disabled={verifying}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {verifying ? <RefreshCw className="w-4 h-4 animate-spin" /> : <GitBranch className="w-4 h-4" />}
                Compute Cryptographic Inclusion Proof
              </button>
            </div>
          </div>
        </div>

        {/* Right: Merkle Inclusion Proof Path Inspector (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {proofResult ? (
            <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-xl p-6 space-y-4 animate-in fade-in duration-300 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> MATHEMATICAL PROOF CONFIRMED
                </span>
                <span className="font-mono text-[10px] text-amber-300">DEPTH {proofResult.proof_depth}</span>
              </div>

              <div>
                <span className="text-[10px] uppercase text-slate-400 block mb-0.5">Leaf Transaction Hash</span>
                <p className="font-mono text-[9px] text-indigo-300 bg-slate-950 p-2 rounded border border-slate-800 break-all select-all">
                  {proofResult.leaf_hash}
                </p>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] uppercase text-slate-400 block font-bold">Cryptographic Sibling Proof Path</span>
                {proofResult.inclusion_proof_path?.map((step: any) => (
                  <div key={step.level} className="bg-slate-950 p-2 rounded border border-slate-800 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-semibold">Level {step.level} ({step.sibling_direction})</span>
                    <span className="font-mono text-[9px] text-emerald-400">{step.hash}</span>
                  </div>
                ))}
              </div>

              <div>
                <span className="text-[10px] uppercase text-slate-400 block mb-0.5">Anchored Merkle Root</span>
                <p className="font-mono text-[9px] text-amber-300 bg-slate-950 p-2 rounded border border-slate-800 break-all select-all">
                  {proofResult.merkle_root}
                </p>
              </div>

              <div className="bg-emerald-950/80 p-3 rounded-xl border border-emerald-800 text-[11px] text-emerald-200">
                <p className="font-bold mb-0.5">Judicial Integrity Seal</p>
                <p className="text-emerald-300/90">{proofResult.tamper_evidence}</p>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-8 text-center space-y-3">
              <GitBranch className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-700">Audit Verification Standby</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Trigger the inclusion proof computation to observe how SHA-256 sibling hashes reconstruct the block root, guaranteeing mathematically unforgeable audit records.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
