import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import {
  Webhook, ShieldCheck, CheckCircle2, RefreshCw, Send,
  Lock, ArrowRight, Activity, Terminal, Key, Clock
} from 'lucide-react';

export const WebhookMeshPage: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSub, setSelectedSub] = useState<string>('SUB-DEPT-A');
  const [eventType, setEventType] = useState<string>('IDENTITY_VERIFIED');
  const [dispatching, setDispatching] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<any | null>(null);

  const fetchSubscriptions = async () => {
    try {
      const res = await api.getWebhookSubscriptions();
      setData(res);
      if (res.subscriptions && res.subscriptions.length > 0) {
        setSelectedSub(res.subscriptions[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const handleTestDispatch = async () => {
    setDispatching(true);
    setDispatchResult(null);
    try {
      const res = await api.dispatchTestWebhook(selectedSub, eventType);
      setDispatchResult(res);
      await fetchSubscriptions();
    } catch (e: any) {
      alert('Dispatch failed: ' + e.message);
    } finally {
      setDispatching(false);
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
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold tracking-wide uppercase mb-3">
          <Webhook className="w-3.5 h-3.5" />
          Event Mesh Architecture
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
          Cross-Department Interoperability Webhook Mesh
        </h1>
        <p className="mt-2 text-base text-slate-600">
          Decoupled, real-time departmental event delivery bus with cryptographic HMAC-SHA256 signature verification, exponential retry backoff, and replay prevention.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Active Subscriptions & Sandbox (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-600" />
              Registered Department Webhook Endpoints
            </h2>

            <div className="space-y-3 mb-6">
              {data?.subscriptions?.map((sub: any) => {
                const isSelected = selectedSub === sub.id;
                return (
                  <div
                    key={sub.id}
                    onClick={() => setSelectedSub(sub.id)}
                    className={`cursor-pointer p-4 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-purple-50/60 border-purple-400 shadow-sm ring-1 ring-purple-400/30'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div>
                        <span className="font-mono text-xs font-bold text-purple-700 bg-purple-100/70 px-2 py-0.5 rounded">
                          {sub.id}
                        </span>
                        <h3 className="text-sm font-bold text-slate-900 mt-1">{sub.department}</h3>
                      </div>
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> {sub.status}
                      </span>
                    </div>

                    <p className="font-mono text-[11px] text-slate-500 truncate mt-1">
                      {sub.target_url}
                    </p>

                    <div className="mt-3 flex items-center justify-between text-xs text-slate-500 border-t border-slate-200/60 pt-2">
                      <span className="flex items-center gap-1 text-[11px]">
                        <Key className="w-3 h-3 text-amber-500" /> {sub.auth_method}
                      </span>
                      <span className="text-[11px]">Latency: ~{sub.average_latency_ms}ms</span>
                      <span className="text-[11px] text-emerald-700 font-semibold">{sub.success_rate_pct}% Delivery</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Interactive Dispatch Sandbox */}
            <div className="border-t border-slate-200 pt-5 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Send className="w-4 h-4 text-purple-600" />
                Dispatch Test Event with HMAC-SHA256 Signature
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">Target Endpoint</label>
                  <select
                    value={selectedSub}
                    onChange={(e) => setSelectedSub(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-500 bg-white"
                  >
                    {data?.subscriptions?.map((s: any) => (
                      <option key={s.id} value={s.id}>{s.id} - {s.department}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">Event Type</label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-500 bg-white"
                  >
                    <option value="IDENTITY_VERIFIED">IDENTITY_VERIFIED</option>
                    <option value="ELIGIBILITY_EVALUATION_REQUESTED">ELIGIBILITY_EVALUATION_REQUESTED</option>
                    <option value="DBT_DISBURSED">DBT_DISBURSED</option>
                    <option value="PASSPORT_ISSUED">PASSPORT_ISSUED</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleTestDispatch}
                disabled={dispatching}
                className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white font-medium text-xs rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {dispatching ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                Send Signed Webhook Packet
              </button>
            </div>
          </div>
        </div>

        {/* Right: Dispatch Inspection & Live Delivery Logs (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Dispatch Inspector Result */}
          {dispatchResult && (
            <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-lg space-y-3 animate-in fade-in duration-300">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> 200 OK DELIVERED
                </span>
                <span className="font-mono text-[10px] text-slate-400">Latency: {dispatchResult.latency_ms}ms</span>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-0.5">X-MahaSetu-Signature (HMAC-SHA256)</p>
                <p className="font-mono text-[10px] text-amber-300 bg-slate-950 p-2 rounded border border-slate-800/80 break-all select-all">
                  {dispatchResult.headers_emitted['X-MahaSetu-Signature']}
                </p>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-0.5">Delivered JSON Payload</p>
                <pre className="font-mono text-[10px] text-indigo-200 bg-slate-950 p-2.5 rounded border border-slate-800/80 overflow-x-auto max-h-36">
                  {JSON.stringify(dispatchResult.payload_delivered, null, 2)}
                </pre>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                <span>Circuit Breaker: {dispatchResult.circuit_breaker_status}</span>
                <span className="text-emerald-400">{dispatchResult.verification_result}</span>
              </div>
            </div>
          )}

          {/* Delivery Stream */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-500" />
              Recent Webhook Deliveries Log
            </h3>

            <div className="space-y-2.5">
              {data?.recent_deliveries?.map((d: any) => (
                <div key={d.delivery_id} className="text-xs p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-bold text-slate-800">{d.event_type}</span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      {d.http_status} OK
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono truncate">{d.payload_snippet}</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                    <span>{d.subscription_id}</span>
                    <span>{d.latency_ms}ms</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
