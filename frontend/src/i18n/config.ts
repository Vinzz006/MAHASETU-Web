import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      nav: {
        home: 'Home',
        services: 'Services',
        citizen_portal: 'Citizen Portal',
        officer_dashboard: 'Officer Dashboard',
        connectors: 'Connectors & Health',
        schema_mapper: 'AI Schema Mapper',
        grievances: 'Grievances',
        studio: 'Studio',
        event_radar: 'Event Radar',
        sla_monitor: 'SLA Monitor',
        locker: 'MahaLocker',
        audit_report: 'Audit Brief',
        lineage: 'Data Lineage',
        edge_sync: 'Gramin Sync',
        data_inspector: 'Data Inspector',
        command_center: 'Command Center',
        interop_platform: 'Interop & Governance',
        fraud_detector: 'Fraud Detector',
        policy_simulator: 'Policy Simulator',
        security_audit: 'Security Audit',
        vaani: 'MahaSetu Vaani',
        dpi_gateway: 'National DPI Gateway',
        disbursal_ledger: 'DBT Treasury Ledger',
        field_verify: 'Field Verification'
      },
      action: {
        start_tour: 'Platform Tour',
        apply: 'Apply Now',
        track: 'Track Application',
        view_passport: 'View Verifiable Service Passport',
        expedite: 'Expedite Processing',
        submit: 'Submit Application',
        cancel: 'Cancel',
        save: 'Save Changes',
        login: 'Sign In',
        logout: 'Sign Out',
        approve: 'Approve',
        reject: 'Reject',
        export_csv: 'Export CSV',
        export_pdf: 'Download Official Receipt'
      },
      status: {
        completed: 'Completed',
        in_progress: 'In Progress',
        exception: 'Integration Exception',
        pending: 'Pending Verification',
        approved: 'Approved',
        rejected: 'Rejected'
      },
      hero: {
        title: 'MAHASETU',
        subtitle: 'Government Interoperability & Service Passport Platform',
        govt: 'Government of Maharashtra',
        problem_badge: 'Problem Statement 26129',
        tagline: 'ONE CITIZEN. ONE CONSENT. ONE APPLICATION ID. MULTIPLE DEPARTMENTS.',
        subtext: 'Existing government portals stay in place. MahaSetu connects them seamlessly without requiring system rewrites.',
        explore_btn: 'Explore Government Services',
        officer_btn: 'Officer Command Center'
      }
    }
  },
  mr: {
    translation: {
      nav: {
        home: 'मुख्यपृष्ठ',
        services: 'शासकीय सेवा',
        citizen_portal: 'नागरिक पोर्टल',
        officer_dashboard: 'अधिकारी नियंत्रण कक्ष',
        connectors: 'प्रणाली समन्वय',
        schema_mapper: 'एआय स्कीमा मॅपर',
        grievances: 'तक्रार निवारण',
        studio: 'अ‍ॅडॉप्टर स्टुडिओ',
        event_radar: 'इव्हेंट रडार',
        sla_monitor: 'सेवा हमी मॉनिटर',
        locker: 'महा-लॉकर',
        audit_report: 'ऑडिट अहवाल',
        lineage: 'डेटा वंशावळ',
        edge_sync: 'ग्रामीण सिंक',
        data_inspector: 'डेटा तपासणी',
        command_center: 'नियंत्रण कक्ष',
        interop_platform: 'समन्वय व प्रशासन',
        fraud_detector: 'गैरव्यवहार शोधक',
        policy_simulator: 'धोरण सिम्युलेटर',
        security_audit: 'सुरक्षा ऑडिट',
        vaani: 'महासेतू वाणी',
        dpi_gateway: 'राष्ट्रीय डीपीआय गेटवे',
        disbursal_ledger: 'थेट लाभ हस्तांतरण नोंदवही',
        field_verify: 'क्षेत्रीय पडताळणी'
      },
      action: {
        start_tour: 'व्यासपीठ फेरफटका',
        apply: 'अर्ज करा',
        track: 'स्थिती तपासा',
        view_passport: 'सेवा पासपोर्ट पहा',
        expedite: 'तातडीने प्रक्रिया करा',
        submit: 'अर्ज सादर करा',
        cancel: 'रद्द करा',
        save: 'बदल जतन करा',
        login: 'प्रवेश करा',
        logout: 'बाहेर पडा',
        approve: 'मंजूर करा',
        reject: 'नाकारा',
        export_csv: 'सीएसव्ही निर्यात करा',
        export_pdf: 'अधिकृत पावती डाउनलोड करा'
      },
      status: {
        completed: 'मंजूर व पूर्ण',
        in_progress: 'प्रक्रियेत',
        exception: 'तांत्रिक अडचण',
        pending: 'पडताळणी प्रलंबित',
        approved: 'मंजूर',
        rejected: 'नाकारले'
      },
      hero: {
        title: 'महासेतू',
        subtitle: 'शासकीय डिजिटल समन्वय व सेवा पासपोर्ट व्यासपीठ',
        govt: 'महाराष्ट्र शासन',
        problem_badge: 'समस्या विधान २६१२९',
        tagline: 'एक नागरिक. एक संमती. एक अर्ज क्रमांक. सर्व विभाग.',
        subtext: 'विद्यमान शासकीय प्रणाली न बदलता महासेतू त्यांना सुरक्षितपणे जोडतो आणि नागरिकांना अखंड सेवा देतो.',
        explore_btn: 'शासकीय सेवा शोधा',
        officer_btn: 'अधिकारी नियंत्रण कक्ष'
      }
    }
  }
};

const savedLang = localStorage.getItem('mahasetu_lang') || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLang,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
