import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import {
  CreditCard, IndianRupee, ShieldCheck, CheckCircle2, RefreshCw,
  Lock, ArrowRight, Store, Plus, Send, Zap
} from 'lucide-react';

export const SmartEscrowPage: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [beneficiaryName, setBeneficiaryName] = useState('Sunita Jadhav');
  const [aadhaar4, setAadhaar4] = useState('7721');
  const [amount, setAmount] = useState(5000);
  const [category, setCategory] = useState('MATERNAL_NUTRITION_SUPPLEMENTS');
  const [minting, setMinting] = useState(false);

  // Redemption simulator
  const [selectedVoucherId, setSelectedVoucherId] = useState('');
  const [merchantId, setMerchantId] = useState('MERCHANT-PCOOP-BARAMATI-09');
  const [mcc, setMcc] = useState('5169');
  const [otp, setOtp] = useState('849201');
  const [redeeming, setRedeeming] = useState(false);
  const [receipt, setReceipt] = useState<any | null>(null);

  const fetchVouchers = async () => {
    try {
      const res = await api.getActiveEscrowVouchers();
      setData(res);
      if (res.vouchers?.length && !selectedVoucherId) {
        setSelectedVoucherId(res.vouchers[0].voucher_id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, []);

  const handleMint = async (e: React.FormEvent) => {
    e.preventDefault();
    setMinting(true);
    try {
      await api.mintEscrowVoucher({
        beneficiary_name: beneficiaryName,
        aadhaar_last_four: aadhaar4,
        amount_inr: amount,
        purpose_category: category
      });
      fetchVouchers();
      alert('Programmable e-RUPI voucher minted successfully!');
    } catch (e: any) {
      alert('Minting failed: ' + e.message);
    } finally {
      setMinting(false);
    }
  };

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    setRedeeming(true);
    setReceipt(null);
    try {
      const res = await api.redeemEscrowVoucher({
        voucher_id: selectedVoucherId,
        merchant_id: merchantId,
        merchant_mcc: mcc,
        otp_code: otp
      });
      setReceipt(res);
      fetchVouchers();
    } catch (e: any) {
      alert('Redemption failed: ' + e.message);
    } finally {
      setRedeeming(false);
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
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-900 rounded-full text-xs font-semibold tracking-wide uppercase mb-3">
          <CreditCard className="w-3.5 h-3.5 text-purple-600" />
          MahaKosh — RBI e-RUPI Smart Escrow
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
          Programmable CBDC Digital Welfare Escrow
        </h1>
        <p className="mt-2 text-base text-slate-600">
          Eliminate fund diversion through purpose-locked digital tokens. Built on the RBI Digital Rupee wholesale rail and NPCI e-RUPI protocol, welfare disbursements are locked to registered Merchant Category Codes (MCC) and cannot be cashed out.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Active Vouchers & Mint Form (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Active Vouchers List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <IndianRupee className="w-4 h-4 text-purple-600" />
                Active Purpose-Bound Escrow Vouchers
              </h2>
              <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full">
                ₹{data?.total_escrow_committed_inr?.toLocaleString()} Allocated
              </span>
            </div>

            <div className="space-y-3">
              {data?.vouchers?.map((v: any) => (
                <div
                  key={v.voucher_id}
                  onClick={() => setSelectedVoucherId(v.voucher_id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer text-xs space-y-1.5 ${
                    selectedVoucherId === v.voucher_id
                      ? 'border-purple-500 bg-purple-50/50 shadow-sm'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-900">{v.voucher_id}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      v.status === 'MINTED_AVAILABLE'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-200 text-slate-700'
                    }`}>
                      {v.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="font-semibold text-slate-800">{v.beneficiary_name} (XXXX-{v.aadhaar_last_four})</span>
                    <span className="text-sm font-black text-purple-700">₹{v.amount_inr.toLocaleString()}</span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-200/50">
                    <span className="font-semibold text-slate-600 uppercase">{v.purpose_category}</span>
                    <span>Valid MCC: {v.merchant_mcc_whitelist?.join(', ')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mint New Voucher Form */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Plus className="w-4 h-4 text-purple-600" />
              Mint Purpose-Bound e-RUPI Token
            </h3>

            <form onSubmit={handleMint} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">Beneficiary Name</label>
                  <input
                    type="text"
                    value={beneficiaryName}
                    onChange={(e) => setBeneficiaryName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">Aadhaar (Last 4)</label>
                  <input
                    type="text"
                    maxLength={4}
                    value={aadhaar4}
                    onChange={(e) => setAadhaar4(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">Amount (INR)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">Purpose Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="FERTILIZER_BIO_NUTRIENTS">Fertilizer &amp; Bio-Nutrients (MCC 5169)</option>
                    <option value="STEM_TEXTBOOKS_LAPTOP">Educational Textbooks &amp; STEM (MCC 5942)</option>
                    <option value="MATERNAL_NUTRITION_SUPPLEMENTS">Maternal Nutrition &amp; Health (MCC 5411)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={minting}
                className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {minting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                Mint Smart Escrow Voucher
              </button>
            </form>
          </div>
        </div>

        {/* Right: Merchant Terminal Simulator & Receipt (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Store className="w-4 h-4 text-emerald-600" />
              Merchant POS Terminal Simulator
            </h3>

            <form onSubmit={handleRedeem} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">Selected Voucher</label>
                <input
                  type="text"
                  value={selectedVoucherId}
                  readOnly
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">Merchant Terminal ID</label>
                  <input
                    type="text"
                    value={merchantId}
                    onChange={(e) => setMerchantId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">Terminal MCC</label>
                  <input
                    type="text"
                    value={mcc}
                    onChange={(e) => setMcc(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">Beneficiary OTP</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono tracking-widest text-center font-bold text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={redeeming}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {redeeming ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Authorize &amp; Settle via RBI CBDC Rail
              </button>
            </form>
          </div>

          {/* Settlement Receipt */}
          {receipt && (
            <div className="bg-slate-900 text-white rounded-2xl border border-emerald-500/40 p-6 space-y-3 animate-in fade-in duration-300 text-xs shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> CBDC SETTLEMENT CONFIRMED
                </span>
                <span className="font-mono text-[10px] text-slate-400">INSTANT CREDIT</span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-400">Merchant Credit</span>
                <span className="text-lg font-black text-emerald-400">₹{receipt.amount_credited_inr?.toLocaleString()}</span>
              </div>

              <div>
                <span className="text-[10px] uppercase text-slate-400 block mb-0.5">NPCI e-RUPI Receipt URN</span>
                <p className="font-mono text-[9px] text-purple-300 bg-slate-950 p-2 rounded border border-slate-800 break-all select-all">
                  {receipt.npci_receipt_urn}
                </p>
              </div>

              <div className="bg-emerald-950/60 p-2.5 rounded-lg border border-emerald-800 text-[11px] text-emerald-200">
                <p className="font-bold">Anti-Diversion Protocol: PASS</p>
                <p className="text-emerald-300/90 text-[10px]">
                  Token redeemed strictly for authorized goods. 0% cash diversion possible.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
