import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Globe } from 'lucide-react';
import i18n from '../i18n/config';

export const LanguageSwitcher: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { language, setLanguage } = useLanguage();

  const handleToggle = () => {
    const nextLang = language === 'en' ? 'mr' : 'en';
    setLanguage(nextLang);
    i18n.changeLanguage(nextLang);
    localStorage.setItem('mahasetu_lang', nextLang);
  };

  return (
    <button
      onClick={handleToggle}
      type="button"
      id="language-switcher-btn"
      aria-label={`Switch language to ${language === 'en' ? 'मराठी' : 'English'}`}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-200 cursor-pointer shadow-sm ${
        language === 'mr'
          ? 'bg-orange-500/20 text-orange-300 border-orange-500/40 hover:bg-orange-500/30'
          : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 hover:bg-indigo-500/30'
      } ${className}`}
    >
      <Globe className="w-3.5 h-3.5" />
      <span>{language === 'en' ? 'मराठी (MR)' : 'English (EN)'}</span>
    </button>
  );
};
