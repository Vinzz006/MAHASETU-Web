import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";
import {
  ShieldCheck, ArrowRight, ArrowLeft, User, Phone, Calendar, MapPin,
  Check, Lock, Fingerprint, Award, Zap, Clock, Building2, Shield,
  CheckCircle2, FileText, AlertCircle, Sparkles, ChevronRight, RefreshCw
} from "lucide-react";

// ---------------------------------------------------------------------------
// Service metadata
// ---------------------------------------------------------------------------
const SERVICE_META: Record<string, {
  title: string; titleMr: string; dept: string; sla: number;
  depts: string[]; eligibilityCap: number; benefits: string[];
}> = {
  "employment-support": {
    title: "Maharashtra Employment & Skill Assistance Scheme",
    titleMr: "महाराष्ट्र रोजगार व कौशल्य सहाय्य योजना",
    dept: "Skill Development, Employment & Entrepreneurship",
    sla: 3,
    depts: ["DEPT_A (Identity)", "DEPT_B (Eligibility)", "DEPT_C (Employment)"],
    eligibilityCap: 300000,
    benefits: ["Monthly stipend ₹5,000–₹12,000", "Skill upgrade vouchers", "Placement assistance"],
  },
  "farmer-dbt": {
    title: "MahaDBT Farmer Agricultural Assistance",
    titleMr: "महाडीबीटी शेतकरी कृषी सहाय्य योजना",
    dept: "Agriculture & Rural Development",
    sla: 7,
    depts: ["Agriculture Dept", "Land Records", "Finance Dept"],
    eligibilityCap: 500000,
    benefits: ["Crop input subsidy up to ₹25,000", "Micro-irrigation grant", "Soil health card"],
  },
  "urban-housing": {
    title: "Maharashtra Urban Affordable Housing Grant",
    titleMr: "महाराष्ट्र नागरी परवडणारे घरकुल अनुदान",
    dept: "Housing & Urban Development",
    sla: 14,
    depts: ["Urban Development", "Municipal Corp", "Revenue Dept"],
    eligibilityCap: 600000,
    benefits: ["Interest subsidy 6.5%", "Capital grant up to ₹2.5 lakh", "PMAY top-up eligibility"],
  },
  "smart-ration": {
    title: "Unified Food Security & Ration Card Portability",
    titleMr: "एकात्मिक अन्न सुरक्षा व शिधापत्रिका पोर्टेबिलिटी",
    dept: "Food, Civil Supplies & Consumer Protection",
    sla: 5,
    depts: ["Civil Supplies", "Legacy Civil Registry", "PDS Network"],
    eligibilityCap: 200000,
    benefits: ["5 kg grain per member / month", "State portability across 36 districts", "Priority household card"],
  },
};

const DISTRICTS = [
  "Pune", "Mumbai City", "Mumbai Suburban", "Thane", "Nagpur",
  "Nashik", "Chhatrapati Sambhajinagar", "Kolhapur", "Solapur",
  "Sangli", "Satara", "Raigad", "Palghar", "Ahmednagar",
  "Jalgaon", "Nandurbar", "Dhule", "Amravati", "Akola",
  "Washim", "Buldhana", "Yavatmal", "Wardha", "Chandrapur",
  "Gadchiroli", "Gondia", "Bhandara", "Osmanabad", "Latur",
  "Nanded", "Hingoli", "Parbhani", "Jalna", "Beed",
  "Ratnagiri", "Sindhudurg",
];

// ---------------------------------------------------------------------------
// Step progress bar
// ---------------------------------------------------------------------------
const STEPS = [
  { n: 1, label: "Service Review",       short: "Review"  },
  { n: 2, label: "Applicant Details",    short: "Details" },
  { n: 3, label: "Consent Preview",      short: "Consent" },
  { n: 4, label: "Application ID",       short: "Issued"  },
];

function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEPS.map((s, i) => {
        const done = current > s.n;
        const active = current === s.n;
        return (
          <React.Fragment key={s.n}>
            <div className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300 ${
                done   ? "bg-emerald-500 text-white"  :
                active ? "bg-blue-950 text-amber-400 ring-4 ring-blue-200" :
                         "bg-slate-200 text-slate-500"
              }`}>
                {done ? <Check className="w-4 h-4" /> : s.n}
              </div>
              <span className={`text-[9px] font-bold hidden sm:block ${active ? "text-blue-900" : done ? "text-emerald-600" : "text-slate-400"}`}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 w-16 sm:w-24 mb-3.5 mx-1 transition-all duration-500 ${current > s.n ? "bg-emerald-400" : "bg-slate-200"}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 1: Service overview
// ---------------------------------------------------------------------------
function Step1ServiceReview({ meta, serviceId, onNext }: { meta: typeof SERVICE_META[string]; serviceId: string; onNext: () => void }) {
  return (
    <div className="space-y-5">
      {/* Service hero */}
      <div className="rounded-2xl overflow-hidden border border-blue-200 shadow-sm">
        <div className="bg-blue-950 px-6 py-5 text-white">
          <div className="flex items-center gap-2 text-amber-300 text-[10px] font-bold uppercase tracking-widest mb-2">
            <Building2 className="w-3 h-3" /> {meta.dept}
          </div>
          <h2 className="text-lg font-black leading-snug">{meta.title}</h2>
          <p className="text-xs text-blue-200 mt-1">{meta.titleMr}</p>
        </div>
        <div className="bg-white p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-start gap-2.5">
            <Clock className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <div className="text-xs font-bold text-slate-800">SLA</div>
              <div className="text-sm font-black text-amber-600">{meta.sla} Days</div>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <Shield className="w-4 h-4 text-blue-700 mt-0.5 shrink-0" />
            <div>
              <div className="text-xs font-bold text-slate-800">Income Ceiling</div>
              <div className="text-sm font-black text-blue-700">₹{(meta.eligibilityCap/100000).toFixed(1)} Lakh / yr</div>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <Building2 className="w-4 h-4 text-slate-600 mt-0.5 shrink-0" />
            <div>
              <div className="text-xs font-bold text-slate-800">Departments</div>
              <div className="text-sm font-black text-slate-700">{meta.depts.length} Federated</div>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-bold text-emerald-800">Available Benefits</span>
        </div>
        <ul className="space-y-2">
          {meta.benefits.map(b => (
            <li key={b} className="flex items-center gap-2 text-xs text-emerald-900">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />{b}
            </li>
          ))}
        </ul>
      </div>

      {/* Dept chain */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Lock className="w-4 h-4 text-blue-700" />
          <span className="text-xs font-bold text-slate-700">Cross-Department Verification Chain</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-lg border border-indigo-200">PORTAL</span>
          {meta.depts.map((d, i) => (
            <React.Fragment key={d}>
              <ChevronRight className="w-3 h-3 text-slate-400" />
              <span className="text-[10px] font-bold px-2.5 py-1 bg-white text-slate-700 rounded-lg border border-slate-200">{d}</span>
            </React.Fragment>
          ))}
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <span className="text-[10px] font-bold px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-lg border border-emerald-200">DBT Disbursement</span>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-800">
          <strong className="font-bold">How MahaSetu works:</strong> You submit once. We share your verified data across departments with your explicit consent — zero duplicate uploads, one Universal Application ID for complete tracking.
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={onNext}
          className="flex items-center gap-2 px-6 py-3 bg-blue-950 hover:bg-blue-900 text-white font-black text-sm rounded-2xl transition-colors shadow-lg">
          Continue to Application <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2: Applicant details form
// ---------------------------------------------------------------------------
type FormData = { citizen_name: string; mobile: string; dob: string; district: string; annual_income: number; employment_status: string; };

function Step2Details({ formData, setFormData, meta, onNext, onBack }: {
  formData: FormData; setFormData: (d: FormData) => void;
  meta: typeof SERVICE_META[string]; onNext: () => void; onBack: () => void;
}) {
  const isEligible = formData.annual_income <= meta.eligibilityCap;
  const eligibilityPct = Math.min(100, Math.round((formData.annual_income / meta.eligibilityCap) * 100));

  return (
    <div className="space-y-5">
      {/* Pre-fill banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-900">
          <strong className="font-bold">Master Data Prefill Active:</strong> Verified attributes from Department A (Identity) and Civil Registry have been pre-populated.
          <span className="ml-1 text-blue-700">No physical document uploads required for initial processing.</span>
        </div>
      </div>

      {/* Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Name */}
        <div>
          <label className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
            <span>Citizen Full Name</span>
            <span className="flex items-center gap-0.5 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
              <Check className="w-2.5 h-2.5" /> Master Registry
            </span>
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input type="text" value={formData.citizen_name}
              onChange={e => setFormData({ ...formData, citizen_name: e.target.value })} required
              className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50" />
          </div>
        </div>

        {/* Mobile */}
        <div>
          <label className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
            <span>Mobile Number</span>
            <span className="flex items-center gap-0.5 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
              <Check className="w-2.5 h-2.5" /> OTP Verified
            </span>
          </label>
          <div className="relative">
            <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input type="text" value={formData.mobile}
              onChange={e => setFormData({ ...formData, mobile: e.target.value })} required
              className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50" />
          </div>
        </div>

        {/* DOB */}
        <div>
          <label className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
            <span>Date of Birth</span>
            <span className="flex items-center gap-0.5 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
              <Check className="w-2.5 h-2.5" /> Aadhaar Linked
            </span>
          </label>
          <div className="relative">
            <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input type="date" value={formData.dob}
              onChange={e => setFormData({ ...formData, dob: e.target.value })} required
              className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
        </div>

        {/* District */}
        <div>
          <label className="text-xs font-bold text-slate-700 mb-1.5 block">District (Maharashtra)</label>
          <div className="relative">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <select value={formData.district}
              onChange={e => setFormData({ ...formData, district: e.target.value })}
              className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white">
              {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>

        {/* Income */}
        <div className="md:col-span-2">
          <label className="text-xs font-bold text-slate-700 mb-1.5 block">
            Annual Family Income (INR)
          </label>
          <input type="number" value={formData.annual_income} min={0} max={2000000}
            onChange={e => setFormData({ ...formData, annual_income: Number(e.target.value) })} required
            className={`w-full px-3 py-2.5 border rounded-xl text-xs focus:ring-2 focus:outline-none transition-colors ${
              isEligible ? "border-emerald-300 focus:ring-emerald-400 bg-emerald-50/30" : "border-rose-300 focus:ring-rose-400 bg-rose-50/30"
            }`} />
          {/* Live eligibility meter */}
          <div className="mt-2">
            <div className="flex items-center justify-between text-[10px] font-bold mb-1">
              <span className={isEligible ? "text-emerald-700" : "text-rose-700"}>
                {isEligible
                  ? `✓ Eligible — ${eligibilityPct}% of scheme income ceiling`
                  : `✗ Income exceeds scheme ceiling of ₹${(meta.eligibilityCap/100000).toFixed(1)}L`}
              </span>
              <span className="text-slate-500">Ceiling: ₹{(meta.eligibilityCap/100000).toFixed(1)} Lakh</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-300 ${isEligible ? "bg-emerald-500" : "bg-rose-500"}`}
                style={{ width: `${Math.min(100, eligibilityPct)}%` }} />
            </div>
          </div>
        </div>

        {/* Employment status */}
        <div className="md:col-span-2">
          <label className="text-xs font-bold text-slate-700 mb-1.5 block">Employment Status</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              { v: "UNEMPLOYED",    label: "Unemployed / Job Seeker" },
              { v: "STUDENT",       label: "Graduating Student"       },
              { v: "SELF_EMPLOYED", label: "Informal Micro-Enterprise" },
            ].map(({ v, label }) => (
              <button key={v} type="button"
                onClick={() => setFormData({ ...formData, employment_status: v })}
                className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                  formData.employment_status === v
                    ? "bg-blue-950 border-blue-950 text-amber-400"
                    : "bg-white border-slate-200 text-slate-700 hover:border-blue-300"
                }`}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <button onClick={onBack}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
        <button onClick={onNext} disabled={!isEligible}
          className="flex items-center gap-2 px-6 py-3 bg-blue-950 hover:bg-blue-900 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-sm rounded-2xl transition-colors shadow-lg">
          Review Consent <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 3: Consent preview
// ---------------------------------------------------------------------------
function Step3ConsentPreview({ formData, meta, onSubmit, onBack, submitting }: {
  formData: FormData; meta: typeof SERVICE_META[string];
  onSubmit: () => void; onBack: () => void; submitting: boolean;
}) {
  const [agreed, setAgreed] = useState(false);
  const dataCategories = ["Full Legal Name", "Date of Birth", "Mobile Number", "District / Address", "Annual Income", "Employment Status"];
  const purposes = ["Eligibility Verification", "Identity Cross-check (DEPT_A)", "Employment Benefit Sanction (DEPT_C)", "Direct Benefit Transfer (DBT)"];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3 bg-indigo-50 border border-indigo-200 rounded-2xl p-4">
        <Lock className="w-5 h-5 text-indigo-700 shrink-0 mt-0.5" />
        <div className="text-xs text-indigo-900">
          <strong className="font-bold">DPDP Act 2023 Compliant Consent:</strong> You are granting one-time, purpose-limited data sharing. You can revoke this at any time from the Consent Manager page.
        </div>
      </div>

      {/* Application summary */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="bg-slate-900 px-4 py-3 flex items-center gap-2">
          <FileText className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-black text-white">Application Summary</span>
        </div>
        <div className="p-4 grid grid-cols-2 gap-3 text-xs">
          {[
            ["Service", meta.title.length > 40 ? meta.title.substring(0, 40) + "…" : meta.title],
            ["Applicant", formData.citizen_name],
            ["Mobile", formData.mobile],
            ["District", formData.district],
            ["Annual Income", `₹${formData.annual_income.toLocaleString("en-IN")}`],
            ["SLA",  `${meta.sla} working days`],
          ].map(([k, v]) => (
            <div key={k}>
              <div className="text-slate-500 mb-0.5">{k}</div>
              <div className="font-bold text-slate-900">{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Data categories shared */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Fingerprint className="w-4 h-4 text-blue-700" />
          <span className="text-xs font-bold text-slate-800">Data Categories Being Shared</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {dataCategories.map(cat => (
            <span key={cat} className="text-[10px] font-semibold px-2 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-lg">{cat}</span>
          ))}
        </div>
      </div>

      {/* Purposes */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Award className="w-4 h-4 text-emerald-700" />
          <span className="text-xs font-bold text-slate-800">Processing Purposes (Explicit &amp; Limited)</span>
        </div>
        <ul className="space-y-1.5">
          {purposes.map(p => (
            <li key={p} className="flex items-center gap-2 text-xs text-slate-700">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> {p}
            </li>
          ))}
        </ul>
      </div>

      {/* Consent checkbox */}
      <label className="flex items-start gap-3 cursor-pointer p-4 bg-amber-50 border border-amber-200 rounded-2xl hover:bg-amber-100 transition-colors">
        <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
          className="mt-0.5 w-4 h-4 rounded accent-blue-900" />
        <div className="text-xs text-amber-900">
          <strong className="font-bold">I authorize MahaSetu</strong> to share the above data categories with the listed government departments for the stated purposes only. I understand I can revoke this consent at any time via the Consent Manager.
        </div>
      </label>

      <div className="flex items-center justify-between">
        <button onClick={onBack}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
        <button onClick={onSubmit} disabled={!agreed || submitting}
          className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-sm rounded-2xl transition-colors shadow-lg">
          {submitting
            ? <><RefreshCw className="w-4 h-4 animate-spin" /> Issuing Universal ID…</>
            : <><Zap className="w-4 h-4" /> Submit Application</>
          }
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 4: Success — Universal ID issued
// ---------------------------------------------------------------------------
function Step4Success({ appId, appNumber, onTrack }: { appId: string; appNumber: string; onTrack: () => void }) {
  return (
    <div className="text-center space-y-6 py-4">
      {/* Animated success ring */}
      <div className="relative w-24 h-24 mx-auto">
        <div className="absolute inset-0 rounded-full bg-emerald-100 animate-ping opacity-30" />
        <div className="relative w-24 h-24 rounded-full bg-emerald-500 flex items-center justify-center shadow-xl shadow-emerald-200">
          <CheckCircle2 className="w-12 h-12 text-white" />
        </div>
      </div>

      <div>
        <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Application Accepted</div>
        <h2 className="text-2xl font-black text-slate-900 mb-1">Universal ID Issued!</h2>
        <p className="text-xs text-slate-500 max-w-xs mx-auto">
          Your interoperability Service Passport is now live across all participating departments.
        </p>
      </div>

      {/* Application ID hero */}
      <div className="bg-slate-900 rounded-2xl p-5 max-w-sm mx-auto border border-slate-700">
        <div className="text-[9px] text-slate-400 uppercase tracking-widest mb-2">Universal Application ID</div>
        <div className="font-mono text-xl font-black text-amber-400 tracking-wider mb-1">{appNumber}</div>
        <div className="text-[10px] text-slate-500">Cross-department tracking active · SHA-256 audit notarized</div>
      </div>

      {/* What happens next */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 max-w-sm mx-auto text-left shadow-sm">
        <div className="text-xs font-bold text-slate-800 mb-3">What happens next:</div>
        <ul className="space-y-2">
          {[
            { dept: "DEPT_A", action: "Identity verification", color: "text-blue-700" },
            { dept: "DEPT_B", action: "Eligibility assessment", color: "text-indigo-700" },
            { dept: "DEPT_C", action: "Employment sanction", color: "text-violet-700" },
            { dept: "PORTAL", action: "DBT disbursement", color: "text-emerald-700" },
          ].map(n => (
            <li key={n.dept} className="flex items-center gap-2.5 text-xs text-slate-700">
              <span className={`font-mono font-black ${n.color} text-[10px] shrink-0 w-14`}>{n.dept}</span>
              <span className="text-slate-500">{n.action}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button onClick={onTrack}
          className="flex items-center gap-2 px-6 py-3 bg-blue-950 hover:bg-blue-900 text-white font-black text-sm rounded-2xl transition-colors shadow-lg">
          <Zap className="w-4 h-4" /> Track Live Journey
        </button>
        <Link to="/citizen/dashboard"
          className="flex items-center gap-2 px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-2xl transition-colors">
          <FileText className="w-4 h-4" /> Go to Dashboard
        </Link>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main ApplicationFormPage — 4-step wizard
// ---------------------------------------------------------------------------
export const ApplicationFormPage: React.FC = () => {
  const { serviceId } = useParams<{ serviceId: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const svcId = serviceId || "employment-support";
  const meta = SERVICE_META[svcId] || SERVICE_META["employment-support"];

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    citizen_name: currentUser?.name || "Demo Citizen",
    mobile: currentUser?.mobile || "9999999999",
    dob: "1998-05-12",
    district: "Pune",
    annual_income: 180000,
    employment_status: "UNEMPLOYED",
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issuedApp, setIssuedApp] = useState<{ id: string; application_number: string } | null>(null);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const app = await api.createApplication({
        service_id: svcId,
        citizen_name: formData.citizen_name,
        mobile: formData.mobile,
        dob: formData.dob,
        district: formData.district,
        annual_income: formData.annual_income,
        employment_status: formData.employment_status,
      });
      setIssuedApp({ id: app.id, application_number: app.application_number });
      setStep(4);
    } catch (err: any) {
      setError(err.message || "Failed to submit application. Please retry.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
      {/* Page title */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-1">
          <Shield className="w-3 h-3" /> MahaSetu Service Passport Application
        </div>
        <h1 className="text-xl font-black text-slate-900">Apply for Government Scheme</h1>
        <p className="text-xs text-slate-500 mt-0.5">One form · One consent · Universal cross-department tracking</p>
      </div>

      <StepBar current={step} />

      {error && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-800">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      <div className="bg-white rounded-3xl border border-slate-200 shadow-lg p-6 sm:p-8">
        {step === 1 && <Step1ServiceReview meta={meta} serviceId={svcId} onNext={() => setStep(2)} />}
        {step === 2 && <Step2Details formData={formData} setFormData={setFormData} meta={meta} onNext={() => setStep(3)} onBack={() => setStep(1)} />}
        {step === 3 && <Step3ConsentPreview formData={formData} meta={meta} onSubmit={handleSubmit} onBack={() => setStep(2)} submitting={submitting} />}
        {step === 4 && issuedApp && (
          <Step4Success
            appId={issuedApp.id}
            appNumber={issuedApp.application_number}
            onTrack={() => navigate(`/applications/${issuedApp.id}/track`)}
          />
        )}
      </div>
    </div>
  );
};
