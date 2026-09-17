import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, X, ChevronRight, ChevronLeft, Check, ShieldCheck,
  Activity, Layers, Award, ShieldAlert, ArrowRight
} from 'lucide-react';

interface GuidedTourModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuidedTourModal: React.FC<GuidedTourModalProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  if (!isOpen) return null;

  const tourSteps = [
    {
      title: 'Problem Statement 26129',
      badge: 'Core Challenge',
      headline: 'Fragmented Portals & Siloed Citizen Service Delivery',
      desc: 'Government departments traditionally operate independent portals, disparate data formats, and disconnected databases. Citizens are forced to submit the same documents repeatedly, visit multiple offices, and track disjointed applications.',
      callout: 'MAHASETU preserves existing department systems while bridging them via a non-invasive interoperability hub.',
      actionText: 'Explore Service Catalog',
      actionRoute: '/services',
      icon: Layers,
      color: 'from-blue-600 to-indigo-700'
    },
    {
      title: 'One Citizen • One Consent',
      badge: 'DPDP Architecture',
      headline: 'Cryptographic Consent & Universal Service Passport',
      desc: 'Instead of physical photocopies, citizen demographic and income data is shared strictly through SHA-256 cryptographic DPDP-2023 consent receipts bounded by 90-day validity. Beneficiaries receive an official Verifiable Service Passport with scannable QR.',
      callout: 'Eliminates 3.2 physical office visits and saves an average of 14 hours per application.',
      actionText: 'Inspect Verifiable Passport',
      actionRoute: '/passport/MH-APP-2026-000184',
      icon: ShieldCheck,
      color: 'from-amber-500 to-amber-700'
    },
    {
      title: 'Non-Invasive Canonical Engine',
      badge: 'Adapter Bus',
      headline: 'Harmonizing REST, JSON & Legacy Mainframe Streams',
      desc: 'MahaSetu uses bidirectional canonical transformations to connect modern REST APIs (Dept A), custom JSON APIs (Dept B), scheme sanction engines (Dept C), and pipe-delimited mainframe feeds (Mahabhulekh Land 7/12) without rewriting any legacy system.',
      callout: 'Includes automated retry resilience, exception resolution, and interactive schema onboarding studio.',
      actionText: 'Open Schema Mapper',
      actionRoute: '/admin/schema-mapper',
      icon: Activity,
      color: 'from-emerald-600 to-teal-700'
    },
    {
      title: 'Real-Time Radar & Statutory SLA',
      badge: 'Citizen Charter',
      headline: 'RTSA 72-Hour Breach Prediction & Auto-Escalation',
      desc: 'Live SVG topological radar visualizes inter-department packet pulses across the state. Under the Maharashtra Right to Public Services Act (RTSA), an automated escalation engine predicts approaching SLA breaches and expedites sanctions in 1 click.',
      callout: 'Delivers an average cross-department response latency of 58.4ms vs 14 days of traditional manual dispatch.',
      actionText: 'View Live Event Radar',
      actionRoute: '/admin/event-radar',
      icon: Award,
      color: 'from-purple-600 to-indigo-800'
    },
    {
      title: 'State Governance & Fraud Defense',
      badge: 'Policy & Security',
      headline: '₹4.2 Cr Fiscal Savings & Cross-Registry Fraud Detection',
      desc: 'State leadership receives a certified Executive Audit Brief, while real-time cross-department reconciliation identifies duplicate 7/12 land claims and income discrepancies. Rural Gramin edge sync enables offline processing in remote tribal talukas.',
      callout: 'Zero-trust security certified with 100% cryptographic consent audit trails.',
      actionText: 'Open Executive Audit Brief',
      actionRoute: '/admin/audit-report',
      icon: ShieldAlert,
      color: 'from-rose-600 to-pink-800'
    }
  ];

  const step = tourSteps[currentStep];
  const StepIcon = step.icon;

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleTakeAction = () => {
    navigate(step.actionRoute);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden text-xs">
        {/* Top Header Card */}
        <div className={`p-6 text-white bg-gradient-to-r ${step.color} relative`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-black/20 hover:bg-black/30 text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
              {step.badge}
            </span>
            <span className="text-[10px] text-white/80 font-mono font-semibold">
              Step {currentStep + 1} of {tourSteps.length}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/10 border border-white/20">
              <StepIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black">{step.headline}</h3>
              <p className="text-white/80 text-xs mt-0.5">{step.title}</p>
            </div>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-4">
          <p className="text-slate-700 text-xs sm:text-sm leading-relaxed">
            {step.desc}
          </p>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold text-xs flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>{step.callout}</span>
          </div>

          {/* Quick Action Link */}
          <button
            onClick={handleTakeAction}
            className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl flex items-center justify-between transition-colors shadow"
          >
            <span>Live Interactive Demo: {step.actionText}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Footer Navigation */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
          <div className="flex gap-1.5">
            {tourSteps.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentStep(i)}
                className={`h-2 rounded-full transition-all ${
                  i === currentStep ? 'w-6 bg-slate-900' : 'w-2 bg-slate-300'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-200 font-semibold flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>
            )}

            <button
              onClick={handleNext}
              className="px-4 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold flex items-center gap-1 shadow"
            >
              <span>{currentStep === tourSteps.length - 1 ? 'Finish Tour' : 'Next Step'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
