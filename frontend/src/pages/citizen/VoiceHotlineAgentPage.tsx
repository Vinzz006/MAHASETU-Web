import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import {
  PhoneCall, Mic, Volume2, RefreshCw, CheckCircle2,
  Sparkles, Radio, Globe, ArrowRight, User, Bot
} from 'lucide-react';

export const VoiceHotlineAgentPage: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialectCode, setDialectCode] = useState('mr-IN-varhadi');
  const [speechInput, setSpeechInput] = useState('माझं शेतकरी अनुदान कधी जमा व्हनार हाये? लय दिवस झाले.');
  const [calling, setCalling] = useState(false);
  const [callResult, setCallResult] = useState<any | null>(null);

  const fetchDialects = async () => {
    try {
      const res = await api.getVoiceHotlineDialects();
      setData(res);
      if (res.dialects?.length && !dialectCode) {
        setDialectCode(res.dialects[0].dialect_code);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDialects();
  }, []);

  const handleCall = async (e: React.FormEvent) => {
    e.preventDefault();
    setCalling(true);
    setCallResult(null);
    try {
      const res = await api.converseWithVoiceHotline({
        dialect_code: dialectCode,
        citizen_speech_input: speechInput
      });
      setCallResult(res);
    } catch (e: any) {
      alert('Call failed: ' + e.message);
    } finally {
      setCalling(false);
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
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-900 rounded-full text-xs font-semibold tracking-wide uppercase mb-3">
          <PhoneCall className="w-3.5 h-3.5 text-amber-600" />
          MahaSanvad — Next-Gen Marathi Bhashini Voice Agent
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
          1800-MAHA-SETU Dialectal Voice Hotline
        </h1>
        <p className="mt-2 text-base text-slate-600">
          Real-time conversational voice agent powered by Indic Bhashini AI. Speaks fluent regional Marathi dialects (Varhadi, Ahirani, Konkani, and Deshi) so rural citizens can check DBT welfare, pension dates, and dispute escalations using their mother tongue.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Dialect Selector & Call Simulator (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Globe className="w-4 h-4 text-amber-500" />
              Select Regional Marathi Dialect
            </h2>

            <div className="space-y-2.5">
              {data?.dialects?.map((d: any) => (
                <div
                  key={d.dialect_code}
                  onClick={() => {
                    setDialectCode(d.dialect_code);
                    if (d.dialect_code === 'mr-IN-varhadi') {
                      setSpeechInput('माझं शेतकरी अनुदान कधी जमा व्हनार हाये? लय दिवस झाले.');
                    } else if (d.dialect_code === 'mr-IN-ahirani') {
                      setSpeechInput('माझं कर्जमाफी ना पैका कधी येई? तारीख सांगा.');
                    } else if (d.dialect_code === 'mr-IN-konkani') {
                      setSpeechInput('म्हाका पेन्शन केन्ना मेळतली? कचेरीचे खंय पावली?');
                    } else {
                      setSpeechInput('माझ्या रेशन कार्ड अर्जाची सद्यस्थिती काय आहे?');
                    }
                  }}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer text-xs space-y-1 ${
                    dialectCode === d.dialect_code
                      ? 'border-amber-500 bg-amber-50/60 shadow-sm'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">{d.dialect_name}</span>
                    <span className="text-[10px] text-slate-500">{d.region}</span>
                  </div>
                  <p className="text-[11px] text-amber-900 italic">"{d.sample_greeting}"</p>
                </div>
              ))}
            </div>

            <form onSubmit={handleCall} className="space-y-3 pt-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                  Citizen Speech Input (Audio Transcript)
                </label>
                <textarea
                  rows={2}
                  value={speechInput}
                  onChange={(e) => setSpeechInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={calling}
                className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {calling ? <RefreshCw className="w-4 h-4 animate-spin" /> : <PhoneCall className="w-4 h-4 text-emerald-400" />}
                Connect Audio Call to 1800-MAHA-SETU
              </button>
            </form>
          </div>
        </div>

        {/* Right: Audio Call Conversation Box (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          {callResult ? (
            <div className="bg-slate-900 text-white rounded-2xl border border-emerald-500/40 shadow-xl p-6 space-y-4 animate-in fade-in duration-300 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 animate-pulse" /> CALL IN PROGRESS (2-WAY AUDIO)
                </span>
                <span className="font-mono text-[10px] text-slate-400">{callResult.call_session_id}</span>
              </div>

              <div className="space-y-3 pt-1">
                {/* Citizen Audio Bubble */}
                <div className="flex items-start gap-2.5 bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div className="p-1.5 bg-slate-800 rounded-full">
                    <User className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Citizen Speech (Regional Dialect)</span>
                    <p className="text-xs text-white mt-0.5 italic">"{callResult.citizen_speech_query}"</p>
                  </div>
                </div>

                {/* AI Agent Response Bubble */}
                <div className="flex items-start gap-2.5 bg-emerald-950/50 p-3 rounded-xl border border-emerald-800">
                  <div className="p-1.5 bg-emerald-800 rounded-full">
                    <Bot className="w-3.5 h-3.5 text-emerald-200" />
                  </div>
                  <div>
                    <span className="text-[10px] text-emerald-300 block font-semibold">MahaSetu AI Agent ({callResult.dialect_used})</span>
                    <p className="text-xs text-emerald-100 font-bold mt-0.5">"{callResult.agent_audio_response_text}"</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Recognized Intent</span>
                  <span className="text-xs font-bold text-amber-400">{callResult.recognized_intent}</span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Speech Latency</span>
                  <span className="text-xs font-bold text-emerald-400">{callResult.natural_conversation_latency_ms} ms</span>
                </div>
              </div>

              <p className="font-mono text-[9px] text-slate-400 bg-slate-950 p-2 rounded border border-slate-800 break-all select-all">
                Token: {callResult.speech_synthesis_token}
              </p>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-8 text-center space-y-3">
              <PhoneCall className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-700">Voice Hotline Simulator Standby</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Pick a Marathi dialect and speak or submit your query to experience sub-second 2-way conversational voice response with regional acoustic vernacular synthesis.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
