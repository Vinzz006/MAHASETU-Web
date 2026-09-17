import React, { useState } from 'react';
import { Bell, MessageSquare, Smartphone, X, CheckCheck } from 'lucide-react';

export const NotificationDrawer: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const notifications = [
    {
      id: 1,
      channel: 'SMS',
      sender: 'MH-GOV-SETU',
      time: '10 mins ago',
      title: 'Application Registered',
      text_en: 'Gov of MH: Application MH-APP-2026-000186 for MahaDBT Farmer Scheme registered successfully with consent proof CON-2026-308846.',
      text_mr: 'महाराष्ट्र शासन: महाडीबीटी शेतकरी योजनेसाठी आपला अर्ज क्र. MH-APP-2026-000186 संमतीसह नोंदवला गेला आहे.'
    },
    {
      id: 2,
      channel: 'WhatsApp',
      sender: 'MahaSetu Official',
      time: '25 mins ago',
      title: 'Digital Service Passport Issued',
      text_en: 'Your Digital Service Passport for Employment Assistance has been sanctioned! View or verify: mahasetu.gov.in/passport/MH-APP-2026-000184',
      text_mr: 'आपला रोजगार सहाय्य डिजिटल सेवा पासपोर्ट मंजूर झाला आहे! तपासण्यासाठी: mahasetu.gov.in/passport/MH-APP-2026-000184'
    },
    {
      id: 3,
      channel: 'SMS',
      sender: 'MH-GOV-SETU',
      time: '1 hour ago',
      title: 'Identity Verified (Dept A)',
      text_en: 'Biometric master demographic verified via Department A Registry (Confidence: 99.4%). Zero physical documents required.',
      text_mr: 'विभाग अ मार्फत आपली बायोमेट्रिक ओळख ९९.४% अचूकतेने पडताळली गेली आहे.'
    }
  ];

  return (
    <>
      {/* Floating Notification Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-20 right-6 z-40 bg-emerald-700 hover:bg-emerald-600 text-white p-3 rounded-full shadow-2xl border-2 border-emerald-400 flex items-center justify-center transition-transform hover:scale-110"
        title="View Citizen SMS & WhatsApp Dispatches"
      >
        <Bell className="w-5 h-5" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full text-[9px] font-bold flex items-center justify-center">
          3
        </span>
      </button>

      {/* Drawer Overlay */}
      {isOpen && (
        <div className="fixed bottom-36 right-6 z-50 w-96 max-w-[90vw] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-xs">
          <div className="bg-[#0f2942] p-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-sm">Citizen Mobile Dispatches</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-3 bg-slate-50 border-b border-slate-200 text-[11px] text-slate-600">
            Real-time simulated multi-channel push to beneficiary mobile number (9999999999).
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 p-2">
            {notifications.map((n) => (
              <div key={n.id} className="p-3 space-y-1.5 hover:bg-slate-50/80 rounded-xl transition-colors">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-mono">
                    {n.channel} • {n.sender}
                  </span>
                  <span className="text-slate-400">{n.time}</span>
                </div>
                <h4 className="font-bold text-slate-900 text-xs">{n.title}</h4>
                <p className="text-slate-700 text-[11px] leading-relaxed">
                  {n.text_en}
                </p>
                <p className="text-amber-800 text-[10px] italic">
                  {n.text_mr}
                </p>
                <div className="flex items-center justify-end gap-1 text-[9px] text-slate-400">
                  <CheckCheck className="w-3 h-3 text-emerald-600" />
                  <span>Delivered to Handset</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};
