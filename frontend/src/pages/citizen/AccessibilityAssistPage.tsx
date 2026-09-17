import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import {
  Eye, Volume2, Sparkles, CheckCircle2, RefreshCw,
  Sun, AlignLeft, Headphones, Radio, ArrowRight
} from 'lucide-react';

export const AccessibilityAssistPage: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [sampleText, setSampleText] = useState('आपला अर्ज मंजूर करण्यात आला आहे. थेट बँक खात्यात रक्कम जमा झाली.');
  const [synthesizing, setSynthesizing] = useState(false);
  const [synthResult, setSynthResult] = useState<any | null>(null);
  const [highContrastMode, setHighContrastMode] = useState(false);

  const fetchProfiles = async () => {
    try {
      const res = await api.getAccessibilityProfiles();
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const handleSynthesize = async (e: React.FormEvent) => {
    e.preventDefault();
    setSynthesizing(true);
    setSynthResult(null);
    try {
      const res = await api.synthesizeAccessibilityNarration({
        text_content: sampleText,
        language: 'mr'
      });
      setSynthResult(res);
    } catch (e: any) {
      alert('Synthesis failed: ' + e.message);
    } finally {
      setSynthesizing(false);
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
    <div className={`max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 transition-colors ${
      highContrastMode ? 'bg-black text-yellow-300' : ''
    }`}>
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-900 rounded-full text-xs font-semibold tracking-wide uppercase mb-3">
            <Eye className="w-3.5 h-3.5 text-amber-600" />
            MahaSugamya — Divyangjan Universal Inclusion
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
            Universal Accessibility &amp; Bharat Assist Console
          </h1>
          <p className="mt-2 text-base text-slate-600">
            Conforming to WCAG 2.1 AAA, GIGW 3.0, and the Rights of Persons with Disabilities (RPwD) Act 2016. Delivers real-time Bharati Braille dot streaming, phonetic Marathi voice synthesis, and sensory-friendly navigation for all citizens.
          </p>
        </div>

        <button
          onClick={() => setHighContrastMode(!highContrastMode)}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
            highContrastMode
              ? 'bg-yellow-400 text-black border-2 border-yellow-300'
              : 'bg-slate-900 text-white hover:bg-slate-800'
          }`}
        >
          <Sun className="w-4 h-4" />
          {highContrastMode ? 'Exit High-Contrast Mode' : 'Toggle Solar Contrast (AAA)'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Accessibility Profiles (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Headphones className="w-4 h-4 text-indigo-600" />
              Supported Assistive Modalities (GIGW 3.0)
            </h2>

            <div className="space-y-3">
              {data?.profiles?.map((p: any) => (
                <div key={p.profile_id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <span className="font-bold text-slate-900 text-sm">{p.name}</span>
                  <p className="text-slate-600 text-xs">{p.intended_users}</p>
                  <span className="text-[10px] font-mono text-indigo-700 block pt-1">
                    Standard: {p.standard}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Interactive Braille & Phonetic Marathi Synthesizer (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-amber-600" />
              Live Braille &amp; Marathi Phonetic Synthesizer
            </h3>

            <form onSubmit={handleSynthesize} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                  Input Marathi Citizen Dispatch
                </label>
                <textarea
                  rows={3}
                  value={sampleText}
                  onChange={(e) => setSampleText(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-sans"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={synthesizing}
                className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {synthesizing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Generate Accessible Braille &amp; Voice Streams
              </button>
            </form>
          </div>

          {/* Accessible Results Display */}
          {synthResult && (
            <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 p-6 space-y-4 animate-in fade-in duration-300 text-xs shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-amber-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> STREAMS READY
                </span>
                <span className="font-mono text-[10px] text-slate-400">
                  {synthResult.bhashini_neural_voice}
                </span>
              </div>

              {/* Refreshable Braille Stream */}
              <div>
                <span className="text-[10px] uppercase text-slate-400 block mb-1">
                  Bharati Braille Unicode Tactile Stream (Grade 2)
                </span>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-2xl text-amber-400 tracking-wider">
                  {synthResult.bharati_braille_unicode_stream}
                </div>
              </div>

              {/* Phonetic SSML */}
              <div>
                <span className="text-[10px] uppercase text-slate-400 block mb-1">
                  Phonetic Marathi Speech SSML Script
                </span>
                <p className="font-mono text-[10px] text-indigo-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800 break-all select-all">
                  {synthResult.phonetic_speech_script}
                </p>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                <span>Duration: ~{synthResult.simulated_audio_duration_seconds}s</span>
                <span className="text-emerald-400 font-semibold">{synthResult.contrast_ratio}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
