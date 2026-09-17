import React from 'react';
import { Shield, ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#0b1f33] text-slate-400 text-xs border-t border-slate-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-5 h-5 text-amber-500" />
              <span className="text-white font-bold text-base">MAHASETU</span>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700">
                MVP Prototype
              </span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed mb-3">
              Built for Government of Maharashtra Problem Statement <strong>26129</strong>: 
              <em> "System integration and interoperability among government digital platforms, resulting in fragmented service delivery."</em>
            </p>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              <strong>Core Proposition:</strong> Existing departmental systems remain in place. 
              MahaSetu operates as a federated interoperability middleware providing a unified service passport, consent-based exchange, and canonical transformation.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-3">
              Simulated Connectors
            </h4>
            <ul className="space-y-1.5 text-[11px]">
              <li>• Demo Department A (Identity REST API)</li>
              <li>• Demo Department B (Eligibility JSON v2.1)</li>
              <li>• Demo Department C (Sanction Engine)</li>
              <li>• Demo Legacy System (Pipe Delimited Stream)</li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-3">
              Compliance & Security
            </h4>
            <ul className="space-y-1.5 text-[11px]">
              <li>• Citizen Consent Mandatory Guard</li>
              <li>• Granular RBAC (4 Roles)</li>
              <li>• Immutable Audit Trails</li>
              <li>• Synthetic Demo Data Only (Zero Real PII)</li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800 flex flex-wrap items-center justify-between text-[11px] text-slate-500">
          <div>
            © 2026 Government of Maharashtra Prototype | Developed for Hackathon Evaluation
          </div>
          <div className="flex items-center gap-4 mt-2 sm:mt-0">
            <span>One Citizen • One Consent • One Application ID</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
