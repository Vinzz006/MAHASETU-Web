import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import {
  Mic, MicOff, Volume2, Sparkles, MessageSquare, ArrowRight,
  ShieldCheck, HelpCircle, FileCheck, CheckCircle2, RotateCcw
} from 'lucide-react';

export const MahaSetuVaaniPage: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [inputText, setInputText] = useState('');
  const [language, setLanguage] = useState<'mr' | 'en'>('mr');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const sampleQueriesMr = [
    'माझ्या अर्जाची स्थिती काय आहे?',
    'महाडीबीटी शेतकरी अनुदानाबद्दल सांगा',
    'नागरी घरकुल योजनेचा अर्ज कसा करावा?',
    'माझा डिजिटल सेवा पासपोर्ट दाखवा',
    'माझा डेटा आणि संमती सुरक्षित आहे का?'
  ];

  const sampleQueriesEn = [
    'What is the status of my application?',
    'Tell me about the Farmer DBT scheme',
    'How do I apply for the Urban Housing grant?',
    'Show my Digital Service Passport',
    'How is my citizen consent protected under DPDP?'
  ];

  const handleQuery = async (textToQuery: string) => {
    if (!textToQuery.trim()) return;
    setLoading(true);
    setInputText(textToQuery);
    try {
      const res = await api.queryMahaSetuVaani(textToQuery, language);
      setResponse(res);

      // Trigger browser SpeechSynthesis if supported
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(res.spoken_response);
        utterance.lang = language === 'mr' ? 'mr-IN' : 'en-IN';
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
      }
    } catch (e: any) {
      alert('Error: ' + e.message);
    } finally {
      setLoading(false);
      setIsListening(false);
    }
  };

  const handleMicToggle = () => {
    if (isListening) {
      setIsListening(false);
    } else {
      setIsListening(true);
      // Simulate real-time voice speech recognition after 2.5 seconds
      setTimeout(() => {
        const query = language === 'mr' ? 'माझ्या अर्जाची स्थिती काय आहे?' : 'What is the status of my application?';
        handleQuery(query);
      }, 2200);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>Multilingual Voice AI for Inclusive Citizen Access</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900">
          महासेतू वाणी • MahaSetu Vaani
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-xl mx-auto">
          Empowering every citizen with voice-first public service delivery in <strong>मराठी (Marathi)</strong> and <strong>English</strong>. No complex menus or document confusion.
        </p>

        {/* Language Pill */}
        <div className="mt-4 inline-flex p-1 bg-slate-200 rounded-xl text-xs font-bold">
          <button
            onClick={() => setLanguage('mr')}
            className={`px-4 py-1.5 rounded-lg transition-all ${
              language === 'mr' ? 'bg-[#0f2942] text-white shadow' : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            मराठी (Marathi)
          </button>
          <button
            onClick={() => setLanguage('en')}
            className={`px-4 py-1.5 rounded-lg transition-all ${
              language === 'en' ? 'bg-[#0f2942] text-white shadow' : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            English
          </button>
        </div>
      </div>

      {/* Voice Interaction Orb Card */}
      <div className="bg-gradient-to-b from-slate-900 to-[#0f2942] rounded-3xl p-8 sm:p-12 text-white shadow-2xl border border-slate-800 text-center relative overflow-hidden mb-8">
        {/* Animated Background Rings */}
        <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
          <div className={`w-96 h-96 rounded-full border-4 border-amber-400 ${isListening || isSpeaking ? 'animate-ping' : ''}`} />
        </div>

        {/* Microphone Button Orb */}
        <div className="relative z-10 flex flex-col items-center">
          <button
            onClick={handleMicToggle}
            className={`w-28 h-28 sm:w-32 sm:h-32 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl ${
              isListening
                ? 'bg-rose-600 ring-8 ring-rose-400/40 animate-pulse scale-110'
                : isSpeaking
                ? 'bg-emerald-600 ring-8 ring-emerald-400/40 scale-105'
                : 'bg-gradient-to-tr from-amber-500 to-amber-600 hover:scale-105 ring-8 ring-amber-400/20'
            }`}
          >
            {isListening ? (
              <Mic className="w-12 h-12 text-white animate-bounce" />
            ) : isSpeaking ? (
              <Volume2 className="w-12 h-12 text-white animate-pulse" />
            ) : (
              <Mic className="w-12 h-12 text-slate-950" />
            )}
          </button>

          <span className="mt-4 text-xs font-bold tracking-wider text-amber-300 uppercase font-mono">
            {isListening
              ? language === 'mr' ? 'ऐकत आहे... बोला...' : 'Listening... Speak now...'
              : isSpeaking
              ? language === 'mr' ? 'उत्तर देत आहे...' : 'Speaking response...'
              : language === 'mr' ? 'माईक दाबा आणि बोला' : 'Tap to speak query'}
          </span>
        </div>

        {/* Form Query Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleQuery(inputText);
          }}
          className="relative z-10 mt-8 max-w-xl mx-auto flex gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              language === 'mr'
                ? 'किंवा येथे प्रश्न टाईप करा (उदा. माझ्या अर्जाची स्थिती)...'
                : 'Or type your query here (e.g. status of my application)...'
            }
            className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none backdrop-blur-sm"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition-colors shadow"
          >
            {loading ? '...' : language === 'mr' ? 'विचारा' : 'Ask'}
          </button>
        </form>
      </div>

      {/* Spoken Response Card */}
      {response && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border-2 border-emerald-500/30 shadow-xl space-y-4 mb-8 animate-in fade-in slide-in-from-bottom-2 text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span className="font-bold text-slate-900 text-sm">
                {language === 'mr' ? 'महासेतू वाणी उत्तर' : 'MahaSetu Vaani Response'}
              </span>
            </div>
            <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
              Intent: {response.intent}
            </span>
          </div>

          <p className="text-slate-800 text-sm sm:text-base leading-relaxed font-medium">
            "{response.spoken_response}"
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
            <span className="text-slate-400 text-[11px] font-mono">
              Linked Application: <strong>{response.application_number}</strong>
            </span>

            <Link
              to={response.action_url}
              className="px-4 py-2 bg-[#0f2942] hover:bg-[#163352] text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow"
            >
              <span>{language === 'mr' ? 'थेट पानावर जा' : 'Go to Relevant Page'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Suggested Quick Audio Prompts */}
      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 text-xs">
        <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-slate-600" />
          <span>{language === 'mr' ? 'वारंवार विचारले जाणारे प्रश्न (क्लिक करा):' : 'Suggested Voice Queries (Click to Ask):'}</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {(language === 'mr' ? sampleQueriesMr : sampleQueriesEn).map((query, idx) => (
            <button
              key={idx}
              onClick={() => handleQuery(query)}
              className="text-left p-3 rounded-xl bg-white hover:bg-amber-50 hover:border-amber-300 border border-slate-200 text-slate-800 font-medium transition-all shadow-sm flex items-center justify-between group"
            >
              <span>{query}</span>
              <Mic className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600 transition-colors" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
