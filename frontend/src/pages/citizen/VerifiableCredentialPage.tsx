import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import {
  ShieldCheck, Award, Key, CheckCircle2, Lock, EyeOff,
  Copy, RefreshCw, Sparkles, Send, FileCheck, AlertCircle, Fingerprint
} from 'lucide-react';

export const VerifiableCredentialPage: React.FC = () => {
  const [wallet, setWallet] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedClaims, setSelectedClaims] = useState<string[]>([
    'age_ge_18',
    'income_lt_threshold',
    'maharashtra_domicile'
  ]);
  const [generatingZKP, setGeneratingZKP] = useState(false);
  const [zkpProof, setZkpProof] = useState<any | null>(null);
  const [verifyingProof, setVerifyingProof] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchWallet = async () => {
    try {
      const res = await api.getVerifiableCredentials();
      setWallet(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  const toggleClaim = (claimId: string) => {
    if (selectedClaims.includes(claimId)) {
      if (selectedClaims.length === 1) return; // keep at least one
      setSelectedClaims(selectedClaims.filter(c => c !== claimId));
    } else {
      setSelectedClaims([...selectedClaims, claimId]);
    }
  };

  const handleGenerateProof = async () => {
    setGeneratingZKP(true);
    setZkpProof(null);
    setVerificationResult(null);
    try {
      const res = await api.generateZKPProof(selectedClaims, 'DEPT_B_ELIGIBILITY_EVALUATION');
      setZkpProof(res);
    } catch (e: any) {
      alert('ZKP generation failed: ' + e.message);
    } finally {
      setGeneratingZKP(false);
    }
  };

  const handleVerifyProof = async () => {
    if (!zkpProof) return;
    setVerifyingProof(true);
    try {
      const res = await api.verifyZKPProof({
        proof_token: zkpProof.proof_token,
        issuer_did: zkpProof.issuer_did,
        claims_proved: zkpProof.claims_proved,
        cryptographic_digest: zkpProof.cryptographic_digest,
        timestamp: zkpProof.timestamp
      });
      setVerificationResult(res);
    } catch (e: any) {
      alert('Verification failed: ' + e.message);
    } finally {
      setVerifyingProof(false);
    }
  };

  const copyToken = () => {
    if (zkpProof) {
      navigator.clipboard.writeText(zkpProof.proof_token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  const vc = wallet?.verifiable_credential;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-semibold tracking-wide uppercase mb-3">
          <Fingerprint className="w-3.5 h-3.5" />
          Self-Sovereign Identity (W3C DID / VC Standard)
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
          Citizen Verifiable Credentials & Zero-Knowledge Proofs
        </h1>
        <p className="mt-2 text-base text-slate-600">
          Prove your eligibility to any government department cryptographically without revealing raw personal details like birthdate, exact income, or street address.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Sovereign Digital Credential Card (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl shadow-xl overflow-hidden border border-indigo-800/40 p-6 relative">
            <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

            {/* Header Badge */}
            <div className="flex items-center justify-between border-b border-indigo-800/60 pb-4 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100 tracking-wide">MAHASETU VC WALLET</h3>
                  <p className="text-[10px] text-amber-400 font-mono">SOVEREIGN_PASSPORT_V1</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <CheckCircle2 className="w-3 h-3" /> W3C CERTIFIED
              </span>
            </div>

            {/* Credential Attributes */}
            <div className="space-y-3.5 mb-6">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-400">Citizen Decentralized Identifier (DID)</p>
                <p className="text-xs font-mono text-indigo-200 truncate mt-0.5">{wallet?.citizen_did}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-400">Holder</p>
                  <p className="text-sm font-semibold text-white">{vc?.credentialSubject?.fullName}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-400">State Domicile</p>
                  <p className="text-sm font-semibold text-amber-300">{vc?.credentialSubject?.domicileState}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-400">Issuer Authority</p>
                  <p className="text-xs font-medium text-slate-200">Govt. of Maharashtra</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-400">Validity</p>
                  <p className="text-xs font-medium text-slate-200">365 Days Active</p>
                </div>
              </div>
            </div>

            {/* Cryptographic Seal */}
            <div className="bg-indigo-950/80 rounded-xl p-3.5 border border-indigo-800/50">
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                  <Key className="w-3.5 h-3.5 text-amber-400" /> Ed25519 Signature Digest
                </span>
                <span className="text-emerald-400 font-mono">TAMPER_SEALED</span>
              </div>
              <p className="text-[10px] font-mono text-indigo-300 break-all leading-tight">
                {vc?.proof?.proofDigest}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-indigo-900/60 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-400" /> DPDP Act 2023 Sec 6
              </span>
              <span>Assurance: IAL3 / AAL3</span>
            </div>
          </div>

          {/* Privacy Callout */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 flex items-start gap-3">
            <EyeOff className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-0.5">Zero Raw Data Leakage Guarantee</p>
              <p className="text-amber-800/90 leading-relaxed">
                When you share a Zero-Knowledge Proof, departments receive a mathematical verification token that confirms "TRUE" without seeing your actual numbers or documents.
              </p>
            </div>
          </div>
        </div>

        {/* Right: Zero-Knowledge Proof Interactive Studio (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  Select Claims to Prove (ZKP Generator)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Choose which eligibility statements to cryptographically prove to the department.
                </p>
              </div>
            </div>

            {/* Predicate Toggles */}
            <div className="space-y-3 mb-6">
              {vc?.zero_knowledge_predicates?.map((p: any) => {
                const isSelected = selectedClaims.includes(p.id);
                return (
                  <div
                    key={p.id}
                    onClick={() => toggleClaim(p.id)}
                    className={`cursor-pointer rounded-xl p-4 border transition-all flex items-start justify-between gap-4 ${
                      isSelected
                        ? 'bg-indigo-50/70 border-indigo-400/80 shadow-sm'
                        : 'bg-slate-50/60 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center mt-0.5 transition-colors ${
                        isSelected ? 'bg-indigo-600 text-white' : 'border border-slate-300 bg-white'
                      }`}>
                        {isSelected && <CheckCircle2 className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{p.label}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{p.statement}</p>
                        <span className="inline-block mt-1 font-mono text-[10px] text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded">
                          eval: {p.predicate}
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full shrink-0">
                      Pre-Verified
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleGenerateProof}
                disabled={generatingZKP}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-colors shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {generatingZKP ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                Generate Cryptographic ZKP Token
              </button>
            </div>
          </div>

          {/* Generated ZKP Token Display */}
          {zkpProof && (
            <div className="bg-slate-900 text-white rounded-2xl shadow-lg border border-slate-800 p-6 space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white tracking-wide">ZKP PROOF TOKEN GENERATED</h3>
                </div>
                <button
                  onClick={copyToken}
                  className="text-xs text-indigo-300 hover:text-white flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copied ? 'Copied!' : 'Copy Token'}
                </button>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">Verifiable Proof Token</p>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 font-mono text-xs text-emerald-400 break-all select-all">
                  {zkpProof.proof_token}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Claims Proved</span>
                  <span className="text-slate-200 font-medium">{zkpProof.claims_proved.length} Predicates</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Intended Recipient</span>
                  <span className="text-indigo-300 font-mono">{zkpProof.verifier_audience}</span>
                </div>
              </div>

              {/* Verify Action */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <p className="text-[11px] text-slate-400">
                  Simulate Department verifier testing this proof token:
                </p>
                <button
                  onClick={handleVerifyProof}
                  disabled={verifyingProof}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {verifyingProof ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FileCheck className="w-3.5 h-3.5" />}
                  Verify Proof Token
                </button>
              </div>

              {/* Verification Result Banner */}
              {verificationResult && (
                <div className="bg-emerald-950/90 border border-emerald-500/40 rounded-xl p-4 text-emerald-200 text-xs space-y-1.5 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2 font-bold text-emerald-400 text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    VERIFICATION RESULT: {verificationResult.verification_result}
                  </div>
                  <p>Authority: {verificationResult.issuer_authority}</p>
                  <p>All {verificationResult.claims_verified_count} predicates validated mathematically. Tamper detected: False.</p>
                  <span className="inline-block font-mono text-[10px] bg-emerald-900 text-emerald-300 px-2 py-0.5 rounded">
                    {verificationResult.dpdp_compliance}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
