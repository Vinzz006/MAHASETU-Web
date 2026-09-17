import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import {
  CreditCard, CheckCircle2, Clock, Landmark, DollarSign,
  ArrowUpRight, ShieldCheck, RefreshCw, Hash, FileCheck
} from 'lucide-react';

export const DBTDisbursalLedgerPage: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLedger = async () => {
    try {
      const res = await api.getDBTDisbursals();
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">
          <Landmark className="w-4 h-4 text-emerald-600" />
          <span>Direct Benefit Transfer &amp; State Treasury Settlement</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
          Cross-Department DBT Treasury Disbursal Ledger
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Real-time tracking of direct welfare cash benefit disbursements from department sanction orders into citizen bank accounts via RBI e-Kuber &amp; Aadhaar Payment Bridge (APB).
        </p>
      </div>

      {/* Summary KPI Cards */}
      {data?.summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 text-xs">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Benefits Disbursed</span>
            <strong className="text-2xl font-black text-emerald-700 block mt-1">
              ₹ {data.summary.total_disbursed_inr.toLocaleString()}
            </strong>
            <span className="text-[10px] text-slate-500 mt-1 block">
              Cleared directly via RBI Treasury
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Payment Rail</span>
            <strong className="text-sm font-black text-slate-900 block mt-1">
              {data.summary.payment_rail}
            </strong>
            <span className="text-[10px] text-emerald-700 font-semibold mt-1 block">
              100% Direct Account Credit
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Treasury Reconciliation</span>
            <strong className="text-sm font-black text-blue-900 block mt-1">
              {data.summary.reconciliation_status}
            </strong>
            <span className="text-[10px] text-slate-500 mt-1 block">
              Audited by Comptroller &amp; Auditor General
            </span>
          </div>
        </div>
      )}

      {/* Disbursals Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-xs">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between font-bold text-slate-800">
          <span>Executed Benefit Disbursements ({data?.transactions?.length || 0})</span>
          <button
            onClick={fetchLedger}
            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-semibold"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Refresh Ledger</span>
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {data?.transactions?.map((t: any) => {
            const isSettled = t.status === 'SETTLED_TO_ACCOUNT';
            return (
              <div key={t.id} className="p-4 hover:bg-slate-50/60 transition-colors">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{t.beneficiary_name}</span>
                      <span className="font-mono text-[10px] font-bold bg-blue-50 text-blue-900 px-2 py-0.5 rounded border border-blue-200">
                        {t.application_number}
                      </span>
                    </div>
                    <p className="text-slate-500 text-xs mt-0.5">{t.service_name}</p>
                  </div>

                  <div className="text-right">
                    <span className="text-lg font-black text-emerald-700 block">
                      + ₹ {t.amount_inr.toLocaleString()}
                    </span>
                    <span
                      className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded ${
                        isSettled ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] font-mono text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <div>
                    <span className="text-[9px] text-slate-400 block uppercase">Bank &amp; IFSC</span>
                    <strong className="text-slate-800">{t.bank_name} ({t.ifsc_prefix})</strong>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block uppercase">Account Mask</span>
                    <strong className="text-slate-800">{t.account_mask}</strong>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block uppercase">RBI UTR Number</span>
                    <strong className="text-blue-900">{t.utr_number}</strong>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block uppercase">Treasury Batch Token</span>
                    <strong className="text-slate-700">{t.treasury_batch_token.slice(0, 14)}...</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
