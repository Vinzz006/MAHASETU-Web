import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'mr';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Nav
    'nav.home': 'Home',
    'nav.services': 'Services',
    'nav.citizen_portal': 'Citizen Portal',
    'nav.officer_dashboard': 'Officer Dashboard',
    'nav.connectors': 'Connectors & Health',
    'nav.schema_mapper': 'AI Schema Mapper',
    'nav.grievances': 'Grievances',
    'nav.studio': 'Studio',
    'nav.event_radar': 'Event Radar',
    'nav.sla_monitor': 'SLA Monitor',
    'nav.locker': 'MahaLocker',
    'nav.audit_report': 'Audit Brief',
    'nav.lineage': 'Data Lineage',
    'nav.edge_sync': 'Gramin Sync',
    'nav.data_inspector': 'Data Inspector',
    'nav.command_center': 'Command Center',
    'nav.interop_platform': 'Interop & Governance',
    'nav.fraud_detector': 'Fraud Detector',
    'nav.policy_simulator': 'Policy Simulator',
    'nav.security_audit': 'Security Audit',
    'nav.vaani': 'MahaSetu Vaani',
    'nav.dpi_gateway': 'National DPI Gateway',
    'nav.disbursal_ledger': 'DBT Treasury Ledger',
    'nav.field_verify': 'Field Verification',
    'action.start_tour': 'Judge Mode Tour',

    // Hero & Proposition
    'hero.title': 'MAHASETU',
    'hero.subtitle': 'Government Interoperability & Service Passport Platform',
    'hero.govt': 'Government of Maharashtra',
    'hero.problem_badge': 'Problem Statement 26129',
    'hero.tagline': 'ONE CITIZEN. ONE CONSENT. ONE APPLICATION ID. MULTIPLE DEPARTMENTS.',
    'hero.subtext': 'Existing government portals stay in place. MahaSetu connects them seamlessly without requiring system rewrites.',
    'hero.explore_btn': 'Explore Government Services',
    'hero.officer_btn': 'Officer Command Center',

    // Value Pillars
    'pillar1.title': 'Unified Citizen Access',
    'pillar1.desc': 'Single application ID across all departments eliminating redundant data entry.',
    'pillar2.title': 'Consent-Based Sharing',
    'pillar2.desc': 'DPDP-aligned cryptographic consent architecture ensuring citizen data sovereignty.',
    'pillar3.title': 'Non-Invasive Interoperability',
    'pillar3.desc': 'Canonical transformations connecting modern REST, JSON, and Legacy Mainframe streams.',

    // Common
    'action.apply': 'Apply Now',
    'action.track': 'Track Application',
    'action.view_passport': 'View Verifiable Service Passport',
    'action.expedite': 'Expedite Processing',
    'status.completed': 'Completed',
    'status.in_progress': 'In Progress',
    'status.exception': 'Integration Exception'
  },
  mr: {
    // Nav
    'nav.home': 'मुख्यपृष्ठ',
    'nav.services': 'शासकीय सेवा',
    'nav.citizen_portal': 'नागरिक पोर्टल',
    'nav.officer_dashboard': 'अधिकारी नियंत्रण कक्ष',
    'nav.connectors': 'प्रणाली समन्वय',
    'nav.schema_mapper': 'एआय स्कीमा मॅपर',
    'nav.grievances': 'तक्रार निवारण',
    'nav.studio': 'अ‍ॅडॉप्टर स्टुडिओ',
    'nav.event_radar': 'इव्हेंट रडार',
    'nav.sla_monitor': 'सेवा हमी मॉनिटर',
    'nav.locker': 'महा-लॉकर',
    'nav.audit_report': 'ऑडिट अहवाल',
    'nav.lineage': 'डेटा वंशावळ',
    'nav.edge_sync': 'ग्रामीण सिंक',
    'nav.data_inspector': 'डेटा तपासणी',
    'nav.command_center': 'नियंत्रण कक्ष',
    'nav.interop_platform': 'समन्वय व प्रशासन',
    'nav.fraud_detector': 'गैरव्यवहार शोधक',
    'nav.policy_simulator': 'धोरण सिम्युलेटर',
    'nav.security_audit': 'सुरक्षा ऑडिट',
    'nav.vaani': 'महासेतू वाणी',
    'nav.dpi_gateway': 'राष्ट्रीय डीपीआय गेटवे',
    'nav.disbursal_ledger': 'थेट लाभ हस्तांतरण नोंदवही',
    'nav.field_verify': 'क्षेत्रीय पडताळणी',
    'action.start_tour': 'परीक्षक फेरफटका',

    // Hero & Proposition
    'hero.title': 'महासेतू',
    'hero.subtitle': 'शासकीय डिजिटल समन्वय व सेवा पासपोर्ट व्यासपीठ',
    'hero.govt': 'महाराष्ट्र शासन',
    'hero.problem_badge': 'समस्या विधान २६१२९',
    'hero.tagline': 'एक नागरिक. एक संमती. एक अर्ज क्रमांक. सर्व विभाग.',
    'hero.subtext': 'विद्यमान शासकीय प्रणाली न बदलता महासेतू त्यांना सुरक्षितपणे जोडतो आणि नागरिकांना अखंड सेवा देतो.',
    'hero.explore_btn': 'शासकीय सेवा शोधा',
    'hero.officer_btn': 'अधिकारी नियंत्रण कक्ष',

    // Value Pillars
    'pillar1.title': 'एकात्मिक नागरिक सेवा',
    'pillar1.desc': 'एकाच अर्जाद्वारे सर्व संबंधित विभागांमध्ये स्वयंचलित माहिती देवाणघेवाण.',
    'pillar2.title': 'नागरिक संमती नियंत्रण',
    'pillar2.desc': 'डीपीडीपी कायद्यानुसार नागरिकांच्या स्पष्ट संमतीनेच सुरक्षित डेटा देवाणघेवाण.',
    'pillar3.title': 'विनाअडथळा प्रणाली समन्वय',
    'pillar3.desc': 'आधुनिक रेस्ट एपीआय व जुन्या मेनफ्रेम प्रणालींना एका कॅनोनिकल मॉडेलमध्ये जोडणे.',

    // Common
    'action.apply': 'अर्ज करा',
    'action.track': 'स्थिती तपासा',
    'action.view_passport': 'सेवा पासपोर्ट पहा',
    'action.expedite': 'तातडीने प्रक्रिया करा',
    'status.completed': 'मंजूर व पूर्ण',
    'status.in_progress': 'प्रक्रियेत',
    'status.exception': 'तांत्रिक अडचण'
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('mahasetu_lang') as Language) || 'en';
  });

  useEffect(() => {
    localStorage.setItem('mahasetu_lang', language);
  }, [language]);

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'en' ? 'mr' : 'en'));
  };

  const t = (key: string): string => {
    return translations[language][key] || translations['en'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
