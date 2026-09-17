import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import {
  Sparkles, Baby, CheckCircle2, RefreshCw, Send,
  UserCheck, Heart, Award, ArrowRight, ShieldCheck, Check
} from 'lucide-react';

export const LifeEventsMeshPage: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState('EVENT-CRS-BIRTH-2026-912');
  const [dispatching, setDispatching] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<any | null>(null);

  const fetchTriggers = async () => {
    try {
      const res = await api.getProactiveLifeEvents();
      setData(res);
      if (res.triggers?.length && !selectedEventId) {
        setSelectedEventId(res.triggers[0].event_id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTriggers();
  }, []);

  const handleDispatch = async () => {
    setDispatching(true);
    setDispatchResult(null);
    try {
      const res = await api.dispatchProactiveEntitlement({
        event_id: selectedEventId,
        send_citizen_consent_sms: true
      });
      setDispatchResult(res);
      fetchTriggers();
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
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-pink-100 text-pink-900 rounded-full text-xs font-semibold tracking-wide uppercase mb-3">
          <Baby className="w-3.5 h-3.5 text-pink-600" />
          MahaJeevan — Proactive Life-Event Governance
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
          Zero-Touch Proactive Life-Events Mesh
        </h1>
        <p className="mt-2 text-base text-slate-600">
          Form-free citizen welfare. Automatically synthesizes civil registration data (births, turning 60, land inheritance) to pre-approve and sanction government entitlements without requiring citizens to submit cumbersome application forms.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Active Life-Event Triggers (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-pink-600" />
              Real-Time Ingested Civil Triggers
            </h2>

            <div className="space-y-3">
              {data?.triggers?.map((ev: any) => (
                <div
                  key={ev.event_id}
                  onClick={() => setSelectedEventId(ev.event_id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer text-xs space-y-2 ${
                    selectedEventId === ev.event_id
                      ? 'border-pink-500 bg-pink-50/50 shadow-sm'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-900">{ev.event_id}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      ev.zero_touch_status.includes('SANCTIONED') ? 'bg-emerald-100 text-emerald-800' : 'bg-pink-100 text-pink-800'
                    }`}>
                      {ev.zero_touch_status}
                    </span>
                  </div>

                  <div>
                    <span className="font-bold text-slate-900 text-sm">{ev.beneficiary_name}</span>
                    <p className="text-slate-500 text-[11px] mt-0.5">{ev.district} • {ev.event_type}</p>
                  </div>

                  <div className="pt-1 border-t border-slate-200/60 text-[11px] space-y-0.5">
                    <p className="font-semibold text-pink-900">{ev.eligible_scheme}</p>
                    <p className="text-slate-600">{ev.entitlement_benefit}</p>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleDispatch}
              disabled={dispatching}
              className="w-full py-3 px-4 bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs rounded-xl transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {dispatching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Dispatch Zero-Touch Sanction &amp; DPDP 1-Tap Notification
            </button>
          </div>
        </div>

        {/* Right: Sanction Drawer (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          {dispatchResult ? (
            <div className="bg-slate-900 text-white rounded-2xl border border-pink-500/40 shadow-xl p-6 space-y-4 animate-in fade-in duration-300 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-pink-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> ZERO-TOUCH WELFARE SANCTIONED
                </span>
                <span className="font-mono text-[10px] text-slate-400">{dispatchResult.sanction_order_id}</span>
              </div>

              <div>
                <span className="text-[10px] uppercase text-slate-400 block">Beneficiary</span>
                <p className="text-base font-bold text-white">{dispatchResult.beneficiary_name}</p>
                <p className="text-xs text-pink-300 mt-0.5">{dispatchResult.scheme}</p>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] space-y-1">
                <span className="text-[10px] uppercase text-slate-400 block font-semibold">Sanctioned Entitlement</span>
                <p className="text-emerald-400 font-bold">{dispatchResult.entitlement}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Citizen Effort</span>
                  <span className="text-xs font-bold text-amber-400">0 Forms Filled</span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Time Saved</span>
                  <span className="text-xs font-bold text-emerald-400">{dispatchResult.citizen_effort_hours_saved} Hours</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-8 text-center space-y-3">
              <Baby className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-700">Proactive Dispatch Standby</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Select a civil registration event to dispatch a proactive welfare sanction directly to the citizen's DigiLocker with automated DPDP 1-tap consent verification.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
