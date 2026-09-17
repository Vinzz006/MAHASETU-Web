import React, { useState, useEffect, useRef } from 'react';
import { Bot, X, Send, Sparkles, RefreshCw, MessageSquare, ChevronDown, ExternalLink, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api, ChatMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';

export const AssistantChat: React.FC = () => {
  const { currentUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState<'en' | 'mr' | 'hi'>('en');
  const [modelStatus, setModelStatus] = useState<{
    gemini_active: boolean;
    model: string;
    provider: string;
    grounding_enabled: boolean;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      inputRef.current?.focus();
      if (!modelStatus) {
        api.getAssistantStatus()
          .then(setStatus => setModelStatus(setStatus))
          .catch(err => console.warn("Could not fetch assistant model status:", err));
      }
    }
  }, [isOpen, messages, loading]);

  const promptPresets = {
    en: [
      "What is the status of my application?",
      "What government schemes are available?",
      "What documents are required?",
      "How do I address a rework note?"
    ],
    mr: [
      "माझ्या अर्जाची स्थिती काय आहे?",
      "कोणत्या सरकारी योजना उपलब्ध आहेत?",
      "अर्जासाठी कोणती कागदपत्रे लागतात?",
      "त्रुटी असलेला अर्ज कसा दुरुस्त करावा?"
    ],
    hi: [
      "मेरे आवेदन की स्थिति क्या है?",
      "उपलब्ध सरकारी योजनाएं बताएं",
      "कौन से दस्तावेज आवश्यक हैं?",
      "सुधार अनुरोध कैसे ठीक करें?"
    ]
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || loading) return;

    setInputMessage('');
    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      sender: 'user',
      content: text,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, tempUserMsg]);
    setLoading(true);

    try {
      const response = await api.sendChatMessage(text, conversationId || undefined);
      setConversationId(response.conversation_id);
      setMessages(prev => [...prev, response.message]);
    } catch (err: any) {
      console.error(err);
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        content: "I am having trouble accessing the network. Please try again momentarily.",
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleResetConversation = () => {
    setMessages([]);
    setConversationId(null);
    setInputMessage('');
  };

  const renderContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, i) => {
      // Process bold **text**
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <p key={i} className={line.startsWith('•') || line.startsWith('-') ? 'ml-2 my-0.5' : 'my-1'}>
          {parts.map((part, j) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={j} className="text-amber-300 font-semibold">{part.slice(2, -2)}</strong>;
            }
            return part;
          })}
        </p>
      );
    });
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold rounded-full shadow-2xl transition-all duration-300 hover:scale-105 border border-amber-300/40"
          aria-label="Open MahaSetu Mitra AI Assistant"
        >
          <div className="w-8 h-8 rounded-full bg-slate-950/20 flex items-center justify-center">
            <Bot className="w-5 h-5 text-slate-950" />
          </div>
          <div className="text-left">
            <div className="text-xs font-black tracking-wide flex items-center gap-1">
              <span>MahaSetu Mitra</span>
              <Sparkles className="w-3 h-3 text-purple-900 animate-spin" />
            </div>
            <div className="text-[9px] text-slate-900/80 font-medium">
              Powered by Google Gemini
            </div>
          </div>
          <span className="flex h-2.5 w-2.5 relative ml-1">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
        </button>
      )}

      {/* Expandable Chat Drawer */}
      {isOpen && (
        <div className="w-[360px] sm:w-[420px] h-[560px] max-h-[calc(100vh-5rem)] bg-[#0b1f33] border border-white/20 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-xs animate-in fade-in slide-in-from-bottom-3 duration-200">
          {/* Header */}
          <div className="bg-[#081726] border-b border-white/10 p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 via-orange-500 to-purple-600 flex items-center justify-center text-slate-950 shadow-md">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-white text-sm">MahaSetu Mitra</h3>
                  <span className="text-[9px] bg-purple-500/20 text-purple-300 border border-purple-500/40 px-1.5 py-0.5 rounded-full font-medium flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" />
                    Gemini AI
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-300">
                  <span className={`w-1.5 h-1.5 rounded-full ${modelStatus?.gemini_active ? 'bg-purple-400 animate-pulse' : 'bg-emerald-400 animate-pulse'}`} />
                  <span>{modelStatus?.gemini_active ? `Google Gemini (${modelStatus.model})` : 'Grounded Citizen AI'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleResetConversation}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                title="Start new conversation"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                title="Minimize"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Language Selector Bar */}
          <div className="bg-[#071320] px-3.5 py-1.5 border-b border-white/5 flex items-center justify-between text-[10px]">
            <span className="text-slate-400 flex items-center gap-1">
              <Globe className="w-3 h-3 text-amber-400" />
              Language / भाषा:
            </span>
            <div className="flex gap-1">
              {(['en', 'mr', 'hi'] as const).map(lang => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all ${
                    language === lang
                      ? 'bg-amber-500 text-slate-950 font-bold shadow'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {lang === 'en' ? 'EN' : lang === 'mr' ? 'मराठी' : 'हिंदी'}
                </button>
              ))}
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-[#0b1f33] to-[#071320]">
            {messages.length === 0 && (
              <div className="space-y-3 my-2">
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-slate-200">
                  <div className="flex items-center gap-1.5 text-amber-400 font-bold mb-1">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span>
                      {language === 'mr'
                        ? `नमस्कार${currentUser?.name ? `, ${currentUser.name}` : ''}!`
                        : language === 'hi'
                        ? `नमस्ते${currentUser?.name ? `, ${currentUser.name}` : ''}!`
                        : `Namaste${currentUser?.name ? `, ${currentUser.name}` : ''}!`}
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    {language === 'mr'
                      ? "मी Google Gemini द्वारे समर्थित तुमचा डिजिटल सहाय्यक आहे. मला महाराष्ट्र शासनाच्या योजना, अर्जांची स्थिती आणि थेट लाभ हस्तांतरणाबद्दल काहीही विचारा."
                      : language === 'hi'
                      ? "मैं Google Gemini द्वारा संचालित आपका डिजिटल सहायक हूँ। महाराष्ट्र सरकार की योजनाओं, आवेदन ट्रैकिंग और डीबीटी के बारे में कुछ भी पूछें।"
                      : "I am your digital assistant powered by Google Gemini. Ask me anything about scheme eligibility, application tracking, or document requirements."}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {language === 'mr' ? 'त्वरित प्रश्न' : language === 'hi' ? 'त्वरित प्रश्न' : 'Quick Inquiries'}
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {promptPresets[language].map((chip, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(chip)}
                        className="text-left p-2 rounded-lg bg-white/5 hover:bg-amber-500/20 border border-white/10 hover:border-amber-500/30 text-slate-200 hover:text-white transition-all text-[11px] flex items-center justify-between group"
                      >
                        <span>{chip}</span>
                        <Send className="w-3 h-3 opacity-0 group-hover:opacity-100 text-amber-400 transition-opacity" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quick Portal Navigation Links */}
                <div className="pt-2 border-t border-white/5 flex items-center gap-2 text-[10px]">
                  <Link
                    to="/track"
                    onClick={() => setIsOpen(false)}
                    className="flex-1 text-center py-1.5 px-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded border border-white/10 transition-colors flex items-center justify-center gap-1"
                  >
                    <span>Tracking Portal</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </Link>
                  <Link
                    to="/services"
                    onClick={() => setIsOpen(false)}
                    className="flex-1 text-center py-1.5 px-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded border border-white/10 transition-colors flex items-center justify-center gap-1"
                  >
                    <span>Scheme Catalog</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </Link>
                </div>
              </div>
            )}

            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender === 'assistant' && (
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-amber-500/30 to-purple-500/30 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 mt-1 shadow-sm">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[11px] leading-relaxed shadow ${
                    m.sender === 'user'
                      ? 'bg-amber-500 text-slate-950 font-medium rounded-tr-none'
                      : 'bg-white/10 text-slate-100 border border-white/10 rounded-tl-none'
                  }`}
                >
                  {renderContent(m.content)}
                  <div
                    className={`text-[9px] mt-1 flex items-center justify-between gap-2 ${
                      m.sender === 'user' ? 'text-slate-900/60' : 'text-slate-400'
                    }`}
                  >
                    {m.sender === 'assistant' && (
                      <span className="text-[8px] text-purple-300/80 font-mono">Google Gemini</span>
                    )}
                    <span className="ml-auto">
                      {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2.5 items-center text-slate-400 text-[11px]">
                <div className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
                  <Bot className="w-3.5 h-3.5 animate-spin" />
                </div>
                <div className="bg-white/10 px-3 py-2 rounded-2xl rounded-tl-none flex items-center gap-1.5">
                  <span className="text-[10px] text-purple-300 font-medium">Gemini is thinking</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <div className="p-3 bg-[#081726] border-t border-white/10">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={
                  language === 'mr'
                    ? "महासेतू मित्राला विचारा (उदा. अर्जाची स्थिती)..."
                    : language === 'hi'
                    ? "महासेतु मित्र से पूछें (उदा. आवेदन की स्थिति)..."
                    : "Ask MahaSetu Mitra anything..."
                }
                disabled={loading}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-400 focus:border-amber-400 transition-all"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || loading}
                className="p-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-40 text-slate-950 font-bold transition-all shadow"
                title="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
