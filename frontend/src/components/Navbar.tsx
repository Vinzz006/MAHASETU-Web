import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDemo } from '../context/DemoContext';
import { useLanguage } from '../context/LanguageContext';
import { NotificationBell } from './NotificationBell';
import {
  Shield, Layers, FileCheck, Activity, Users, AlertTriangle,
  Code2, MessageSquare, Wrench, Radio, Clock, FolderKey, Globe,
  GitBranch, FileSpreadsheet, WifiOff, ChevronDown, Menu, X,
  ShieldAlert, Sliders, Lock, Sparkles, Mic, Globe2, CreditCard, UserCheck,
  Fingerprint, LifeBuoy, Building, Webhook, Flame, MapPin,
  Gift, Compass, EyeOff, Leaf, Atom,
  Trash2, FileSearch, Terminal,
  Crown, Award, Plane,
  Scale, Satellite, TreePine, Eye,
  Coins, KeyRound, HeartHandshake, Sprout,
  Baby, Bug, Calculator, Sun, PhoneCall,
  Wheat, Droplet, Bus,
  Heart, CloudFog, BrainCircuit, Trophy, Beaker,
  LogIn, LogOut, User
} from 'lucide-react';

export const Navbar: React.FC<{ onOpenTour?: () => void }> = ({ onOpenTour }) => {
  const navigate = useNavigate();
  const { currentUser, switchPersona, logout, personas } = useAuth();
  const { isFailureSimulated } = useDemo();
  const { language, toggleLanguage, t } = useLanguage();
  const location = useLocation();

  const [labDropdownOpen, setLabDropdownOpen] = useState(false);
  const [labTab, setLabTab] = useState<'citizen' | 'admin'>('citizen');

  const handlePersonaClick = (role: 'CITIZEN' | 'OFFICER' | 'ADMIN') => {
    if (!currentUser || personas.length === 0) {
      navigate(`/login?role=${role.toLowerCase()}`);
      return;
    }
    if (role === 'CITIZEN') {
      switchPersona('CITIZEN');
      navigate('/citizen/dashboard');
    } else if (role === 'OFFICER') {
      const officerPersona = personas.find(p => ['OFFICER', 'DEPARTMENT_A', 'DEPARTMENT_B', 'DEPARTMENT_C'].includes(p.role));
      if (officerPersona) {
        switchPersona(officerPersona.role);
      } else {
        switchPersona('OFFICER');
      }
      navigate('/admin/officer');
    } else {
      switchPersona('SYSTEM_ADMIN');
      navigate('/admin/dashboard');
    }
  };
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Check if current route is inside innovation lab
  const isLabActive = location.pathname.startsWith('/lab') || [
    '/citizen/locker', '/citizen/vaani', '/citizen/credentials', '/citizen/nivarana',
    '/citizen/entitlements', '/citizen/interstate', '/citizen/privacy-erasure', '/citizen/diaspora',
    '/citizen/accessibility', '/citizen/drone-pmfby', '/citizen/zk-property-tax', '/citizen/voice-hotline',
    '/citizen/police-cctns', '/citizen/meripehchaan', '/citizen/marriage-registry',
    '/admin/event-radar', '/admin/sla-monitor', '/admin/fraud-detector', '/admin/policy-simulator',
    '/admin/security-audit', '/admin/dpi-gateway', '/admin/disbursal-ledger', '/officer/field-verify',
    '/admin/audit-report', '/admin/edge-sync', '/admin/connectors-studio', '/admin/mahadrpan',
    '/admin/webhooks', '/admin/chaos', '/admin/mpc', '/admin/green-gov', '/admin/pqc',
    '/admin/disaster-surge', '/admin/document-forensics', '/admin/mesh-autonomous', '/admin/developer-sdk',
    '/admin/war-room', '/admin/merkle-ledger', '/admin/workforce-rebalance', '/admin/capstone-showcase',
    '/admin/smart-escrow', '/admin/bhoomi-cadastre', '/admin/tribunal-nyaya', '/admin/tribal-fra',
    '/admin/treasury-beams', '/admin/tender-shield', '/admin/crisis-logistics', '/admin/key-rotation',
    '/admin/life-events', '/admin/epidemic-surveillance', '/admin/kiosk-solar', '/admin/pds-ration',
    '/admin/jal-jeevan', '/admin/ev-grid', '/admin/industrial-emissions', '/admin/solar-feeder',
    '/admin/policy-copilot', '/admin/master-showcase'
  ].includes(location.pathname) || location.pathname.startsWith('/admin/lineage');

  return (
    <header className="sticky top-0 z-40 bg-[#0f2942] text-white shadow-lg">
      {/* Top Gov Tricolor Thin Accent */}
      <div className="h-1 bg-gradient-to-r from-[#ea580c] via-white to-[#16a34a]" />

      {/* Official Government of Maharashtra Identity Banner */}
      <div className="bg-[#0b1f33] px-4 py-1.5 border-b border-white/10 text-xs flex flex-wrap items-center justify-between text-slate-300">
        <div className="flex items-center gap-2">
          <span className="font-bold text-amber-400">महाराष्ट्र शासन</span>
          <span className="text-white/40">•</span>
          <span className="text-slate-300">Government of Maharashtra</span>
          <span className="text-white/40">•</span>
          <span className="text-amber-300 font-mono text-[11px] bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
            Problem Statement 26129
          </span>
        </div>

        <div className="flex items-center gap-4 text-[11px]">
          {isFailureSimulated && (
            <div className="flex items-center gap-1.5 text-rose-300 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-500/50 animate-pulse font-semibold">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>Simulating Dept B Outage</span>
            </div>
          )}

          {/* Judge Mode Interactive Tour Button */}
          {onOpenTour && (
            <button
              onClick={onOpenTour}
              className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold transition-all shadow text-[11px]"
            >
              <Sparkles className="w-3 h-3 text-slate-950" />
              <span>{t('action.start_tour')}</span>
            </button>
          )}

          {/* Bilingual Language Toggle */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white font-bold transition-colors border border-white/20"
            title="Toggle between English and Marathi"
          >
            <Globe className="w-3 h-3 text-amber-400" />
            <span>{language === 'en' ? 'मराठी' : 'English'}</span>
          </button>

          <span className="hidden md:inline text-slate-400">
            Universal Service Passport &amp; Interop Engine
          </span>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Logo Branding */}
          <Link to="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 font-black text-lg shadow-md border border-amber-400/50 group-hover:scale-105 transition-transform">
              म
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-lg tracking-tight text-white font-sans">
                  MAHA<span className="text-amber-400">SETU</span>
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1 rounded font-mono font-bold">
                  v3.0
                </span>
              </div>
              <p className="text-[9px] text-slate-300 tracking-wider uppercase font-medium">
                Interoperability Hub
              </p>
            </div>
          </Link>

          {/* Primary Core Desktop Navigation Links (PS 26129 Focus) */}
          <nav className="hidden xl:flex items-center gap-1 text-xs font-medium">
            <Link
              to="/"
              className={`px-2.5 py-1.5 rounded-md transition-colors ${
                location.pathname === '/' ? 'bg-white/10 text-white font-semibold' : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              {t('nav.home')}
            </Link>

            <Link
              to="/services"
              className={`px-2.5 py-1.5 rounded-md transition-colors ${
                location.pathname.startsWith('/services') ? 'bg-white/10 text-white font-semibold' : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              {t('nav.services')}
            </Link>

            {/* Citizen Portal Links */}
            {(!currentUser || currentUser.role === 'CITIZEN') && (
              <>
                <Link
                  to="/citizen/dashboard"
                  className={`px-2.5 py-1.5 rounded-md transition-colors ${
                    location.pathname === '/citizen/dashboard' ? 'bg-white/10 text-white font-semibold' : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {t('nav.citizen_portal')}
                </Link>

                <Link
                  to="/citizen/profile"
                  className={`px-2.5 py-1.5 rounded-md transition-colors ${
                    location.pathname === '/citizen/profile' ? 'bg-white/10 text-white font-semibold' : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Resident Profile
                </Link>
              </>
            )}

            {/* Admin Console Links */}
            {(currentUser?.role === 'ADMIN' || currentUser?.role === 'SYSTEM_ADMIN') && (
              <>
                <Link
                  to="/admin/dashboard"
                  className={`px-2.5 py-1.5 rounded-md transition-colors ${
                    location.pathname === '/admin/dashboard' ? 'bg-white/10 text-white font-semibold' : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Admin Console
                </Link>

                <Link
                  to="/admin/citizens"
                  className={`px-2.5 py-1.5 rounded-md transition-colors ${
                    location.pathname === '/admin/citizens' ? 'bg-white/10 text-white font-semibold' : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Citizen Directory
                </Link>

                <Link
                  to="/admin/integrations"
                  className={`px-2.5 py-1.5 rounded-md transition-colors ${
                    location.pathname === '/admin/integrations' ? 'bg-white/10 text-white font-semibold' : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Integrations Monitor
                </Link>

                <Link
                  to="/admin/services"
                  className={`px-2.5 py-1.5 rounded-md transition-colors ${
                    location.pathname === '/admin/services' ? 'bg-white/10 text-white font-semibold' : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Services Catalogue
                </Link>
              </>
            )}

            {/* Department Queue Links */}
            {(currentUser?.role === 'DEPARTMENT_A' || currentUser?.role === 'DEPARTMENT_B' || currentUser?.role === 'DEPARTMENT_C' || currentUser?.role === 'OFFICER') && (
              <>
                <Link
                  to="/department/dashboard"
                  className={`px-2.5 py-1.5 rounded-md transition-colors ${
                    location.pathname === '/department/dashboard' ? 'bg-white/10 text-white font-semibold' : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Department Queue
                </Link>

                <Link
                  to="/admin/integrations"
                  className={`px-2.5 py-1.5 rounded-md transition-colors ${
                    location.pathname === '/admin/integrations' ? 'bg-white/10 text-white font-semibold' : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Integrations Monitor
                </Link>

                <Link
                  to="/admin/schema-mapper"
                  className={`px-2.5 py-1.5 rounded-md transition-colors ${
                    location.pathname === '/admin/schema-mapper' ? 'bg-white/10 text-white font-semibold' : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {t('nav.schema_mapper')}
                </Link>
              </>
            )}

            {/* Auditor Cockpit Links */}
            {currentUser?.role === 'AUDITOR' && (
              <>
                <Link
                  to="/auditor/dashboard"
                  className={`px-2.5 py-1.5 rounded-md transition-colors ${
                    location.pathname === '/auditor/dashboard' ? 'bg-white/10 text-white font-semibold' : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Auditor Cockpit
                </Link>

                <Link
                  to="/admin/executive-audit"
                  className={`px-2.5 py-1.5 rounded-md transition-colors ${
                    location.pathname === '/admin/executive-audit' ? 'bg-white/10 text-white font-semibold' : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Audit Reports
                </Link>

                <Link
                  to="/admin/lineage"
                  className={`px-2.5 py-1.5 rounded-md transition-colors ${
                    location.pathname === '/admin/lineage' ? 'bg-white/10 text-white font-semibold' : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Data Lineage
                </Link>
              </>
            )}

            <Link
              to="/admin/grievances"
              className={`px-2.5 py-1.5 rounded-md transition-colors ${
                location.pathname === '/admin/grievances' ? 'bg-white/10 text-white font-semibold' : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              {t('nav.grievances')}
            </Link>

            {/* Collapsed Innovation Lab / Exploratory Modules Dropdown */}
            <div className="relative">
              <button
                onClick={() => setLabDropdownOpen(!labDropdownOpen)}
                onMouseEnter={() => setLabDropdownOpen(true)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-colors ${
                  isLabActive ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold' : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Beaker className="w-3.5 h-3.5 text-amber-400" />
                <span>Innovation Lab</span>
                <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1 rounded font-mono">50+</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {labDropdownOpen && (
                <div
                  onMouseLeave={() => setLabDropdownOpen(false)}
                  className="absolute right-0 mt-1 w-[580px] max-h-[75vh] overflow-y-auto bg-[#0b1f33] border border-white/15 rounded-xl shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-1 text-xs"
                >
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <Beaker className="w-4 h-4 text-amber-400" />
                      <span className="font-bold text-white">Innovation Lab &amp; Exploratory Extensions</span>
                    </div>
                    <span className="text-[10px] text-slate-400 italic">Beyond Core Interop Scope</span>
                  </div>

                  {/* Tabs */}
                  <div className="flex gap-2 mb-3">
                    <button
                      onClick={() => setLabTab('citizen')}
                      className={`flex-1 py-1 rounded text-center font-bold text-[11px] transition-colors ${
                        labTab === 'citizen' ? 'bg-amber-500 text-slate-950' : 'bg-white/5 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      Citizen Showcase Modules
                    </button>
                    <button
                      onClick={() => setLabTab('admin')}
                      className={`flex-1 py-1 rounded text-center font-bold text-[11px] transition-colors ${
                        labTab === 'admin' ? 'bg-amber-500 text-slate-950' : 'bg-white/5 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      Officer &amp; Admin Extensions
                    </button>
                  </div>

                  {labTab === 'citizen' ? (
                    <div className="grid grid-cols-2 gap-1.5">
                      <Link to="/citizen/locker" onClick={() => setLabDropdownOpen(false)} className="flex items-center gap-2 p-1.5 rounded hover:bg-white/10 text-slate-200">
                        <FolderKey className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <div><div className="font-bold text-white text-[11px]">{t('nav.locker')}</div><div className="text-[9px] text-slate-400">DigiLocker vault</div></div>
                      </Link>
                      <Link to="/citizen/vaani" onClick={() => setLabDropdownOpen(false)} className="flex items-center gap-2 p-1.5 rounded hover:bg-white/10 text-slate-200">
                        <Mic className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <div><div className="font-bold text-white text-[11px]">{t('nav.vaani')}</div><div className="text-[9px] text-slate-400">Marathi speech AI</div></div>
                      </Link>
                      <Link to="/citizen/credentials" onClick={() => setLabDropdownOpen(false)} className="flex items-center gap-2 p-1.5 rounded hover:bg-white/10 text-slate-200">
                        <Fingerprint className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <div><div className="font-bold text-white text-[11px]">ZKP Credentials</div><div className="text-[9px] text-slate-400">W3C verifiable proofs</div></div>
                      </Link>
                      <Link to="/citizen/nivarana" onClick={() => setLabDropdownOpen(false)} className="flex items-center gap-2 p-1.5 rounded hover:bg-white/10 text-slate-200">
                        <LifeBuoy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <div><div className="font-bold text-white text-[11px]">Nivarana AI</div><div className="text-[9px] text-slate-400">Ombudsperson redressal</div></div>
                      </Link>
                      <Link to="/citizen/entitlements" onClick={() => setLabDropdownOpen(false)} className="flex items-center gap-2 p-1.5 rounded hover:bg-white/10 text-slate-200">
                        <Gift className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <div><div className="font-bold text-white text-[11px]">Entitlements</div><div className="text-[9px] text-slate-400">Proactive discovery</div></div>
                      </Link>
                      <Link to="/citizen/interstate" onClick={() => setLabDropdownOpen(false)} className="flex items-center gap-2 p-1.5 rounded hover:bg-white/10 text-slate-200">
                        <Compass className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                        <div><div className="font-bold text-white text-[11px]">Inter-State</div><div className="text-[9px] text-slate-400">Cross-state portability</div></div>
                      </Link>
                      <Link to="/citizen/privacy-erasure" onClick={() => setLabDropdownOpen(false)} className="flex items-center gap-2 p-1.5 rounded hover:bg-white/10 text-slate-200">
                        <Trash2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        <div><div className="font-bold text-white text-[11px]">DPDP Erasure</div><div className="text-[9px] text-slate-400">Right to be forgotten</div></div>
                      </Link>
                      <Link to="/citizen/drone-pmfby" onClick={() => setLabDropdownOpen(false)} className="flex items-center gap-2 p-1.5 rounded hover:bg-white/10 text-slate-200">
                        <Plane className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                        <div><div className="font-bold text-white text-[11px]">Drone PMFBY</div><div className="text-[9px] text-slate-400">Crop loss assessment</div></div>
                      </Link>
                      <Link to="/citizen/zk-property-tax" onClick={() => setLabDropdownOpen(false)} className="flex items-center gap-2 p-1.5 rounded hover:bg-white/10 text-slate-200">
                        <Calculator className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <div><div className="font-bold text-white text-[11px]">ZK Property Tax</div><div className="text-[9px] text-slate-400">Zero-knowledge assessment</div></div>
                      </Link>
                      <Link to="/citizen/voice-hotline" onClick={() => setLabDropdownOpen(false)} className="flex items-center gap-2 p-1.5 rounded hover:bg-white/10 text-slate-200">
                        <PhoneCall className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <div><div className="font-bold text-white text-[11px]">Voice IVR Agent</div><div className="text-[9px] text-slate-400">AI toll-free operator</div></div>
                      </Link>
                      <Link to="/citizen/police-cctns" onClick={() => setLabDropdownOpen(false)} className="flex items-center gap-2 p-1.5 rounded hover:bg-white/10 text-slate-200">
                        <Shield className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <div><div className="font-bold text-white text-[11px]">Police CCTNS</div><div className="text-[9px] text-slate-400">Clearance &amp; verification</div></div>
                      </Link>
                      <Link to="/citizen/meripehchaan" onClick={() => setLabDropdownOpen(false)} className="flex items-center gap-2 p-1.5 rounded hover:bg-white/10 text-slate-200">
                        <Fingerprint className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <div><div className="font-bold text-white text-[11px]">MeriPehchaan SSO</div><div className="text-[9px] text-slate-400">National federated login</div></div>
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-1.5">
                      <Link to="/admin/connectors-studio" onClick={() => setLabDropdownOpen(false)} className="flex items-center gap-2 p-1.5 rounded hover:bg-white/10 text-slate-200">
                        <Wrench className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <div><div className="font-bold text-white text-[11px]">{t('nav.studio')}</div><div className="text-[9px] text-slate-400">Adapter builder</div></div>
                      </Link>
                      <Link to="/admin/sla-monitor" onClick={() => setLabDropdownOpen(false)} className="flex items-center gap-2 p-1.5 rounded hover:bg-white/10 text-slate-200">
                        <Clock className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                        <div><div className="font-bold text-white text-[11px]">{t('nav.sla_monitor')}</div><div className="text-[9px] text-slate-400">Charter escalations</div></div>
                      </Link>
                      <Link to="/admin/fraud-detector" onClick={() => setLabDropdownOpen(false)} className="flex items-center gap-2 p-1.5 rounded hover:bg-white/10 text-slate-200">
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <div><div className="font-bold text-white text-[11px]">{t('nav.fraud_detector')}</div><div className="text-[9px] text-slate-400">Anomaly radar</div></div>
                      </Link>
                      <Link to="/admin/policy-simulator" onClick={() => setLabDropdownOpen(false)} className="flex items-center gap-2 p-1.5 rounded hover:bg-white/10 text-slate-200">
                        <Sliders className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        <div><div className="font-bold text-white text-[11px]">{t('nav.policy_simulator')}</div><div className="text-[9px] text-slate-400">Outlay &amp; TPS projections</div></div>
                      </Link>
                      <Link to="/admin/security-audit" onClick={() => setLabDropdownOpen(false)} className="flex items-center gap-2 p-1.5 rounded hover:bg-white/10 text-slate-200">
                        <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <div><div className="font-bold text-white text-[11px]">{t('nav.security_audit')}</div><div className="text-[9px] text-slate-400">Zero-Trust scorecard</div></div>
                      </Link>
                      <Link to="/admin/key-rotation" onClick={() => setLabDropdownOpen(false)} className="flex items-center gap-2 p-1.5 rounded hover:bg-white/10 text-slate-200">
                        <KeyRound className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <div><div className="font-bold text-white text-[11px]">Quantum Key Rotation</div><div className="text-[9px] text-slate-400">MahaChabi HSM engine</div></div>
                      </Link>
                      <Link to="/admin/chaos" onClick={() => setLabDropdownOpen(false)} className="flex items-center gap-2 p-1.5 rounded hover:bg-white/10 text-slate-200">
                        <Flame className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <div><div className="font-bold text-white text-[11px]">Chaos Simulator</div><div className="text-[9px] text-slate-400">Resilience injection</div></div>
                      </Link>
                      <Link to="/admin/webhooks" onClick={() => setLabDropdownOpen(false)} className="flex items-center gap-2 p-1.5 rounded hover:bg-white/10 text-slate-200">
                        <Webhook className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <div><div className="font-bold text-white text-[11px]">Webhook Mesh</div><div className="text-[9px] text-slate-400">HMAC-SHA256 push bus</div></div>
                      </Link>
                      <Link to="/admin/audit-report" onClick={() => setLabDropdownOpen(false)} className="flex items-center gap-2 p-1.5 rounded hover:bg-white/10 text-slate-200">
                        <FileCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <div><div className="font-bold text-white text-[11px]">{t('nav.audit_report')}</div><div className="text-[9px] text-slate-400">Evidence Act telemetry</div></div>
                      </Link>
                      <Link to="/admin/lineage" onClick={() => setLabDropdownOpen(false)} className="flex items-center gap-2 p-1.5 rounded hover:bg-white/10 text-slate-200">
                        <GitBranch className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                        <div><div className="font-bold text-white text-[11px]">{t('nav.lineage')}</div><div className="text-[9px] text-slate-400">DAG provenance DAG</div></div>
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </nav>

          {/* Right Section: Persona Selector & Notifications */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Notification Bell */}
            <NotificationBell />

            {/* Persona Quick Toggle for Judges */}
            <div className="flex items-center bg-slate-800/90 rounded-lg p-0.5 border border-slate-700 text-xs">
              <span className="text-slate-400 px-2 flex items-center gap-1 font-medium hidden md:flex">
                <Users className="w-3.5 h-3.5" />
                Persona:
              </span>
              <button
                onClick={() => handlePersonaClick('CITIZEN')}
                className={`px-2 py-1 rounded transition-colors text-[11px] ${
                  currentUser?.role === 'CITIZEN' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'text-slate-300 hover:text-white'
                }`}
                title="Citizen Portal"
              >
                Citizen
              </button>
              <button
                onClick={() => handlePersonaClick('OFFICER')}
                className={`px-2 py-1 rounded transition-colors text-[11px] ${
                  ['OFFICER', 'DEPARTMENT_A', 'DEPARTMENT_B', 'DEPARTMENT_C'].includes(currentUser?.role || '')
                    ? 'bg-blue-600 text-white font-bold shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Department Officer Portal"
              >
                Officer
              </button>
              <button
                onClick={() => handlePersonaClick('ADMIN')}
                className={`px-2 py-1 rounded transition-colors text-[11px] ${
                  ['SYSTEM_ADMIN', 'ADMIN', 'AUDITOR'].includes(currentUser?.role || '')
                    ? 'bg-purple-600 text-white font-bold shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Administrator Portal"
              >
                Admin
              </button>
            </div>

            {/* Auth Action: Sign In vs Current User Profile & Sign Out */}
            {currentUser ? (
              <div className="flex items-center gap-1.5 pl-1 border-l border-white/10">
                <button
                  onClick={() => {
                    if (currentUser.role === 'CITIZEN') navigate('/citizen/profile');
                    else if (['ADMIN', 'SYSTEM_ADMIN'].includes(currentUser.role)) navigate('/admin/dashboard');
                    else navigate('/department/dashboard');
                  }}
                  className="flex items-center gap-1.5 px-2 py-1 rounded text-xs bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 transition-colors"
                  title={`Logged in as ${currentUser.name} (${currentUser.role})`}
                >
                  <User className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline font-medium max-w-[100px] truncate">{currentUser.name}</span>
                </button>
                <button
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                  className="p-1.5 rounded text-xs bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 transition-all shadow"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Link>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
              title="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile / Tablet Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-[#0b1f33] border-t border-white/10 px-4 py-4 space-y-3 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <span className="text-[11px] font-bold text-amber-400 uppercase">Portals &amp; Roles</span>
            <div className="flex gap-1.5">
              <Link to="/login?role=citizen" onClick={() => setMobileMenuOpen(false)} className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                Citizen
              </Link>
              <Link to="/login?role=officer" onClick={() => setMobileMenuOpen(false)} className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px] font-bold">
                Officer
              </Link>
              <Link to="/login?role=admin" onClick={() => setMobileMenuOpen(false)} className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-bold">
                Admin
              </Link>
            </div>
          </div>

          <div className="text-[10px] uppercase font-bold text-amber-400 mb-1">Core Interoperability (PS 26129)</div>
          <div className="grid grid-cols-2 gap-2">
            <Link to="/" onClick={() => setMobileMenuOpen(false)} className="p-2 bg-white/5 rounded-lg text-slate-200 hover:bg-white/10 font-medium">
              {t('nav.home')}
            </Link>
            <Link to="/services" onClick={() => setMobileMenuOpen(false)} className="p-2 bg-white/5 rounded-lg text-slate-200 hover:bg-white/10 font-medium">
              {t('nav.services')}
            </Link>
            <Link to="/citizen/dashboard" onClick={() => setMobileMenuOpen(false)} className="p-2 bg-white/5 rounded-lg text-slate-200 hover:bg-white/10 font-medium">
              {t('nav.citizen_portal')}
            </Link>
            <Link to="/admin/dashboard" onClick={() => setMobileMenuOpen(false)} className="p-2 bg-white/5 rounded-lg text-slate-200 hover:bg-white/10 font-medium">
              {t('nav.officer_dashboard')}
            </Link>
            <Link to="/admin/integrations" onClick={() => setMobileMenuOpen(false)} className="p-2 bg-white/5 rounded-lg text-slate-200 hover:bg-white/10 font-medium">
              Integrations Monitor
            </Link>
            <Link to="/admin/schema-mapper" onClick={() => setMobileMenuOpen(false)} className="p-2 bg-white/5 rounded-lg text-slate-200 hover:bg-white/10 font-medium">
              {t('nav.schema_mapper')}
            </Link>
            <Link to="/admin/grievances" onClick={() => setMobileMenuOpen(false)} className="p-2 bg-white/5 rounded-lg text-slate-200 hover:bg-white/10 font-medium">
              {t('nav.grievances')}
            </Link>
          </div>

          <div className="pt-2 border-t border-white/10">
            <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Innovation Lab (Exploratory)</div>
            <div className="grid grid-cols-2 gap-2">
              <Link to="/citizen/locker" onClick={() => setMobileMenuOpen(false)} className="p-2 bg-white/5 rounded-lg text-slate-200 hover:bg-white/10">
                {t('nav.locker')}
              </Link>
              <Link to="/citizen/vaani" onClick={() => setMobileMenuOpen(false)} className="p-2 bg-white/5 rounded-lg text-slate-200 hover:bg-white/10">
                {t('nav.vaani')}
              </Link>
              <Link to="/admin/connectors-studio" onClick={() => setMobileMenuOpen(false)} className="p-2 bg-white/5 rounded-lg text-slate-200 hover:bg-white/10">
                {t('nav.studio')}
              </Link>
              <Link to="/admin/security-audit" onClick={() => setMobileMenuOpen(false)} className="p-2 bg-white/5 rounded-lg text-slate-200 hover:bg-white/10">
                {t('nav.security_audit')}
              </Link>
            </div>
          </div>

          {currentUser ? (
            <div className="pt-2 border-t border-white/10 flex items-center justify-between">
              <span className="text-slate-300 text-[11px]">Logged in as <strong>{currentUser.name}</strong></span>
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                  navigate('/login');
                }}
                className="px-2.5 py-1 rounded bg-rose-500/20 text-rose-300 text-[11px] font-bold"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="pt-2 border-t border-white/10">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-1.5 p-2 rounded-lg bg-amber-500 text-slate-950 font-bold"
              >
                <LogIn className="w-4 h-4" />
                Sign In to MahaSetu
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
