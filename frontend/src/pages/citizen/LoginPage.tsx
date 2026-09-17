import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth, AppRole } from '../../context/AuthContext';
import {
  Shield, User, Lock, ArrowRight, CheckCircle2, AlertCircle, Clock,
  LogOut, Sparkles, Building2, Landmark, KeyRound, ShieldCheck,
  UserCheck, ChevronRight, Check, Eye, EyeOff
} from 'lucide-react';

export type PortalRoleTab = 'CITIZEN' | 'OFFICER' | 'ADMIN';

export const LoginPage: React.FC = () => {
  const { login, register, switchPersona, currentUser, logout, isPendingApproval, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active role portal tab: Citizen, Officer, or Admin
  const [activeRoleTab, setActiveRoleTab] = useState<PortalRoleTab>('CITIZEN');
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  // Officer department sub-selection
  const [officerDept, setOfficerDept] = useState<'DEPT_A' | 'DEPT_B' | 'DEPT_C'>('DEPT_C');
  // Admin sub-role selection
  const [adminType, setAdminType] = useState<'ADMIN' | 'AUDITOR'>('ADMIN');

  // Form fields
  const [username, setUsername] = useState('9999999999');
  const [password, setPassword] = useState('mahasetu123');
  const [showPassword, setShowPassword] = useState(false);

  // Register form state (Citizen only)
  const [regName, setRegName] = useState('');
  const [regMobile, setRegMobile] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Synchronize URL query param ?role=citizen|officer|admin
  useEffect(() => {
    const roleParam = searchParams.get('role')?.toUpperCase();
    if (roleParam === 'OFFICER') {
      selectRolePortal('OFFICER');
    } else if (roleParam === 'ADMIN') {
      selectRolePortal('ADMIN');
    } else if (roleParam === 'CITIZEN') {
      selectRolePortal('CITIZEN');
    }
  }, [searchParams]);

  const selectRolePortal = (tab: PortalRoleTab) => {
    setActiveRoleTab(tab);
    setError(null);
    setSuccessMsg(null);
    setSearchParams({ role: tab.toLowerCase() });

    if (tab === 'CITIZEN') {
      setUsername('9999999999');
      setPassword('mahasetu123');
    } else if (tab === 'OFFICER') {
      setUsername('8888888888'); // Default Dept C Employment
      setPassword('mahasetu123');
      setOfficerDept('DEPT_C');
    } else if (tab === 'ADMIN') {
      setUsername('7777777777'); // Default Central Admin
      setPassword('mahasetu123');
      setAdminType('ADMIN');
    }
  };

  const selectOfficerDept = (dept: 'DEPT_A' | 'DEPT_B' | 'DEPT_C') => {
    setOfficerDept(dept);
    setError(null);
    if (dept === 'DEPT_A') {
      setUsername('8888888881');
    } else if (dept === 'DEPT_B') {
      setUsername('8888888882');
    } else {
      setUsername('8888888888');
    }
  };

  const selectAdminType = (type: 'ADMIN' | 'AUDITOR') => {
    setAdminType(type);
    setError(null);
    if (type === 'AUDITOR') {
      setUsername('6666666666');
    } else {
      setUsername('7777777777');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(username, password);

      // Smart redirection based on authenticated persona
      if (activeRoleTab === 'OFFICER') {
        navigate('/admin/officer');
      } else if (activeRoleTab === 'ADMIN') {
        if (username.startsWith('666') || adminType === 'AUDITOR') {
          navigate('/auditor/dashboard');
        } else {
          navigate('/admin/dashboard');
        }
      } else {
        navigate('/citizen/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (regPassword && regPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      setLoading(false);
      return;
    }

    try {
      const res = await register({
        name: regName,
        mobile: regMobile,
        email: regEmail,
        password: regPassword || 'mahasetu123'
      });
      setSuccessMsg(res.message || 'Citizen registration submitted. Account is pending state administrative approval.');
      setMode('LOGIN');
      setUsername(regMobile);
      setPassword(regPassword || 'mahasetu123');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check your details and try again.');
    } finally {
      setLoading(false);
    }
  };

  // If user is currently in PENDING approval status, render the holding page
  if (isPendingApproval || (currentUser && currentUser.registration_status === 'PENDING')) {
    return (
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl border border-amber-200 overflow-hidden">
          <div className="bg-gradient-to-r from-amber-600 to-amber-700 p-6 text-white text-center">
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
              <Clock className="w-8 h-8 text-white animate-pulse" />
            </div>
            <h2 className="text-xl font-bold">Registration Pending Approval</h2>
            <p className="text-xs text-amber-100 mt-1">Application Reference: {currentUser?.id || 'CIT-NEW'}</p>
          </div>

          <div className="p-6 space-y-4">
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 text-xs text-amber-900 leading-relaxed">
              <p className="font-bold flex items-center gap-1.5 text-amber-950 mb-1">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                State Administrative Review Required
              </p>
              Your citizen account for <strong>{currentUser?.name || 'Citizen'}</strong> ({currentUser?.mobile || currentUser?.email}) has been submitted into the MahaSetu Core Interoperability Hub.
              Per state security protocols, all newly self-registered citizens must be vetted and approved by a state System Administrator before cross-department data sharing or service applications can be accessed.
            </div>

            <div className="border border-slate-200 rounded-xl p-4 text-xs space-y-2 bg-slate-50">
              <div className="flex justify-between">
                <span className="text-slate-500">Registered Name:</span>
                <span className="font-semibold text-slate-800">{currentUser?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Contact Mobile:</span>
                <span className="font-semibold text-slate-800">{currentUser?.mobile}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Role Assigned:</span>
                <span className="font-semibold text-slate-800">{currentUser?.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Verification Status:</span>
                <span className="font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
                  {currentUser?.registration_status}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => refreshProfile()}
                className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2"
              >
                <span>Check Approval Status</span>
              </button>
              <button
                onClick={logout}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-[calc(100vh-4rem)] flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#06121e] via-[#091b2c] to-[#0c2339]">
      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Left Side: Role Portal Branding & Architecture Highlights */}
        <div className="lg:col-span-5 flex flex-col justify-between p-6 sm:p-8 bg-[#0b1f33]/90 border border-white/10 rounded-3xl backdrop-blur-xl shadow-2xl text-white">
          <div>
            {/* Government Crest / Platform Seal */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg text-slate-950">
                <Shield className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-lg font-black tracking-tight text-white">MahaSetu</h1>
                <p className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider">
                  Government of Maharashtra • PS 26129
                </p>
              </div>
            </div>

            <div className="mb-6">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 border ${
                activeRoleTab === 'CITIZEN'
                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                  : activeRoleTab === 'OFFICER'
                  ? 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                  : 'bg-purple-500/10 text-purple-300 border-purple-500/30'
              }`}>
                <span className={`w-2 h-2 rounded-full ${
                  activeRoleTab === 'CITIZEN' ? 'bg-amber-400' : activeRoleTab === 'OFFICER' ? 'bg-blue-400' : 'bg-purple-400'
                }`} />
                {activeRoleTab === 'CITIZEN' ? 'Citizen Portal' : activeRoleTab === 'OFFICER' ? 'Department Portal' : 'Administrative Console'}
              </span>

              <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                {activeRoleTab === 'CITIZEN' && 'Access Your Unified Citizen Service Passport'}
                {activeRoleTab === 'OFFICER' && 'Department Attestation & Verification Gateway'}
                {activeRoleTab === 'ADMIN' && 'Central Directorate Oversight & Audit Ledger'}
              </h2>

              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                {activeRoleTab === 'CITIZEN' && 'Seamlessly apply for 4 major welfare schemes, track cross-departmental verification milestones, and manage digital consent.'}
                {activeRoleTab === 'OFFICER' && 'Perform eligibility evaluations, review identity attestations, and issue DBT sanctions with auditable governance.'}
                {activeRoleTab === 'ADMIN' && 'Review pending citizen registrations, monitor real-time SLA metrics, and verify immutable RFC 6962 Merkle audit proofs.'}
              </p>
            </div>

            {/* Feature Bullets */}
            <div className="space-y-2.5 pt-4 border-t border-white/10 text-xs">
              <div className="flex items-start gap-2 text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>100% DPDP Act 2023 Purpose-Bound Digital Consent</span>
              </div>
              <div className="flex items-start gap-2 text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Zero Physical Paper Visits with DigiLocker Federation</span>
              </div>
              <div className="flex items-start gap-2 text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>SHA-256 Merkle Cryptographic Notarisation</span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
            <span>256-Bit TLS Secured</span>
            <Link to="/services" className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1">
              <span>View Schemes</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Right Side: Role Selector Tabs & Login / Register Card */}
        <div className="lg:col-span-7 bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col justify-between">
          
          {/* Top 3-Role Tab Switcher Bar */}
          <div>
            <div className="bg-slate-100 p-1.5 border-b border-slate-200 grid grid-cols-3 gap-1">
              
              {/* Role 1: Citizen */}
              <button
                type="button"
                onClick={() => selectRolePortal('CITIZEN')}
                className={`py-3 px-2 rounded-2xl flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 transition-all text-xs font-bold ${
                  activeRoleTab === 'CITIZEN'
                    ? 'bg-white text-amber-900 shadow-md border border-amber-300/60'
                    : 'text-slate-600 hover:text-slate-950 hover:bg-white/60'
                }`}
              >
                <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                  activeRoleTab === 'CITIZEN' ? 'bg-amber-500 text-slate-950' : 'bg-slate-200 text-slate-600'
                }`}>
                  <UserCheck className="w-4 h-4" />
                </div>
                <div className="text-center sm:text-left">
                  <div className="leading-tight">Citizen</div>
                  <div className="text-[9px] font-normal text-slate-500 hidden sm:block">Resident Portal</div>
                </div>
              </button>

              {/* Role 2: Officer */}
              <button
                type="button"
                onClick={() => selectRolePortal('OFFICER')}
                className={`py-3 px-2 rounded-2xl flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 transition-all text-xs font-bold ${
                  activeRoleTab === 'OFFICER'
                    ? 'bg-white text-blue-900 shadow-md border border-blue-300/60'
                    : 'text-slate-600 hover:text-slate-950 hover:bg-white/60'
                }`}
              >
                <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                  activeRoleTab === 'OFFICER' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="text-center sm:text-left">
                  <div className="leading-tight">Officer</div>
                  <div className="text-[9px] font-normal text-slate-500 hidden sm:block">Dept Sanctions</div>
                </div>
              </button>

              {/* Role 3: Admin */}
              <button
                type="button"
                onClick={() => selectRolePortal('ADMIN')}
                className={`py-3 px-2 rounded-2xl flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 transition-all text-xs font-bold ${
                  activeRoleTab === 'ADMIN'
                    ? 'bg-white text-purple-900 shadow-md border border-purple-300/60'
                    : 'text-slate-600 hover:text-slate-950 hover:bg-white/60'
                }`}
              >
                <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                  activeRoleTab === 'ADMIN' ? 'bg-purple-600 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  <Landmark className="w-4 h-4" />
                </div>
                <div className="text-center sm:text-left">
                  <div className="leading-tight">Admin</div>
                  <div className="text-[9px] font-normal text-slate-500 hidden sm:block">State Console</div>
                </div>
              </button>
            </div>

            {/* Sub-Role Filters / Contextual Selectors */}
            {activeRoleTab === 'OFFICER' && (
              <div className="bg-blue-50/70 p-3 border-b border-blue-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-blue-950 flex items-center gap-1 text-[11px]">
                  <Building2 className="w-3.5 h-3.5 text-blue-700" />
                  Select Department Authority:
                </span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => selectOfficerDept('DEPT_A')}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                      officerDept === 'DEPT_A'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-blue-100'
                    }`}
                  >
                    Dept A (Identity)
                  </button>
                  <button
                    type="button"
                    onClick={() => selectOfficerDept('DEPT_B')}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                      officerDept === 'DEPT_B'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-blue-100'
                    }`}
                  >
                    Dept B (Eligibility)
                  </button>
                  <button
                    type="button"
                    onClick={() => selectOfficerDept('DEPT_C')}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                      officerDept === 'DEPT_C'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-blue-100'
                    }`}
                  >
                    Dept C (Sanction)
                  </button>
                </div>
              </div>
            )}

            {activeRoleTab === 'ADMIN' && (
              <div className="bg-purple-50/70 p-3 border-b border-purple-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-purple-950 flex items-center gap-1 text-[11px]">
                  <KeyRound className="w-3.5 h-3.5 text-purple-700" />
                  Select Administrative Console:
                </span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => selectAdminType('ADMIN')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                      adminType === 'ADMIN'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-purple-100'
                    }`}
                  >
                    System Administrator
                  </button>
                  <button
                    type="button"
                    onClick={() => selectAdminType('AUDITOR')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                      adminType === 'AUDITOR'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-purple-100'
                    }`}
                  >
                    State Auditor
                  </button>
                </div>
              </div>
            )}

            {/* Citizen Tab: Sign In vs Register Toggle */}
            {activeRoleTab === 'CITIZEN' && (
              <div className="flex border-b border-slate-200 text-xs font-bold bg-white">
                <button
                  type="button"
                  onClick={() => { setMode('LOGIN'); setError(null); setSuccessMsg(null); }}
                  className={`flex-1 py-2.5 text-center transition-all border-b-2 ${
                    mode === 'LOGIN'
                      ? 'border-amber-500 text-amber-900 bg-amber-50/40'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Citizen Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setMode('REGISTER'); setError(null); setSuccessMsg(null); }}
                  className={`flex-1 py-2.5 text-center transition-all border-b-2 ${
                    mode === 'REGISTER'
                      ? 'border-amber-500 text-amber-900 bg-amber-50/40'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Register New Resident
                </button>
              </div>
            )}
          </div>

          {/* Form Container */}
          <div className="p-6 sm:p-7">
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 text-rose-700 text-xs border border-rose-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}
            {successMsg && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs border border-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* LOGIN FORM (Shared across Citizen, Officer, Admin) */}
            {mode === 'LOGIN' ? (
              <form onSubmit={handleLogin} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">
                    {activeRoleTab === 'CITIZEN' && 'Registered Mobile Number or Email'}
                    {activeRoleTab === 'OFFICER' && 'Officer Government ID / Mobile'}
                    {activeRoleTab === 'ADMIN' && 'Administrator ID / Government Email'}
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      placeholder={
                        activeRoleTab === 'CITIZEN'
                          ? 'e.g. 9999999999'
                          : activeRoleTab === 'OFFICER'
                          ? 'e.g. 8888888888'
                          : 'e.g. 7777777777'
                      }
                      className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-semibold text-slate-700">
                      {activeRoleTab === 'CITIZEN' && 'Service Passport Password'}
                      {activeRoleTab === 'OFFICER' && 'Department Access Key / Password'}
                      {activeRoleTab === 'ADMIN' && 'Administrative Master Passkey'}
                    </label>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full pl-9 pr-10 py-2.5 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Quick Credential Pre-fill Demo Shortcut */}
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>Demo Credentials Loaded:</span>
                  </div>
                  <code className="bg-slate-200/80 px-1.5 py-0.5 rounded text-slate-800 font-mono text-[10px]">
                    {username} • mahasetu123
                  </code>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3 text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-xs uppercase tracking-wide ${
                    activeRoleTab === 'CITIZEN'
                      ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-slate-950 font-black'
                      : activeRoleTab === 'OFFICER'
                      ? 'bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600'
                      : 'bg-gradient-to-r from-purple-700 to-slate-900 hover:from-purple-600 hover:to-slate-800'
                  }`}
                >
                  <span>
                    {loading
                      ? 'Authenticating...'
                      : activeRoleTab === 'CITIZEN'
                      ? 'Sign In to Citizen Dashboard'
                      : activeRoleTab === 'OFFICER'
                      ? 'Authenticate Department Officer'
                      : 'Authorize Directorate Admin'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              /* CITIZEN REGISTRATION FORM */
              <form onSubmit={handleRegister} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Full Legal Name (as on Aadhaar)</label>
                  <input
                    type="text"
                    placeholder="e.g. Sunil Ramesh Patil"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Mobile Number (10 Digits)</label>
                    <input
                      type="tel"
                      placeholder="98XXXXXXXX"
                      pattern="[0-9]{10}"
                      value={regMobile}
                      onChange={(e) => setRegMobile(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      placeholder="citizen@example.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Password (Min. 8 characters, letter + number)</label>
                  <input
                    type="password"
                    placeholder="Create a strong password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
                  <p className="font-bold flex items-center gap-1 text-amber-950 mb-0.5">
                    <Shield className="w-3.5 h-3.5 text-amber-600" />
                    Government Verification Policy
                  </p>
                  Newly registered citizen accounts receive role <strong>CITIZEN</strong> with verification status <strong>PENDING</strong> until administrative review.
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-slate-950 font-black rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-xs uppercase tracking-wide"
                >
                  <span>{loading ? 'Submitting Registration...' : 'Register Citizen Account'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>

          {/* Footer Security Badges */}
          <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex flex-wrap items-center justify-between text-[10px] text-slate-500">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Role-Based Access Control (RBAC)
            </span>
            <span>MahaSetu Platform v2.1</span>
          </div>

        </div>
      </div>
    </div>
  );
};
