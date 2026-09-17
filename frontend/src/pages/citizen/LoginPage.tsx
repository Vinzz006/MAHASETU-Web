import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, AppRole } from '../../context/AuthContext';
import { Shield, User, Lock, ArrowRight, CheckCircle2, AlertCircle, Clock, LogOut, Sparkles } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, register, switchPersona, currentUser, logout, isPendingApproval, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  // Login form state
  const [username, setUsername] = useState('9999999999');
  const [password, setPassword] = useState('mahasetu123');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regMobile, setRegMobile] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(username, password);
      if (username.startsWith('777')) {
        navigate('/admin/dashboard');
      } else if (username.startsWith('666')) {
        navigate('/auditor/dashboard');
      } else if (username.startsWith('888')) {
        navigate('/admin/dashboard');
      } else {
        navigate('/citizen/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await register({
        name: regName,
        mobile: regMobile,
        email: regEmail,
        password: regPassword || 'mahasetu123'
      });
      setSuccessMsg(res.message || 'Registration submitted. Awaiting administrative approval.');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSelect = (role: AppRole) => {
    switchPersona(role);
    if (role === 'CITIZEN') {
      setUsername('9999999999');
      navigate('/citizen/dashboard');
    } else if (role === 'AUDITOR') {
      setUsername('6666666666');
      navigate('/auditor/dashboard');
    } else if (role === 'ADMIN' || role === 'SYSTEM_ADMIN') {
      setUsername('7777777777');
      navigate('/admin/dashboard');
    } else if (role === 'DEPARTMENT_A') {
      setUsername('8888888881');
      navigate('/departments/dept-a');
    } else if (role === 'DEPARTMENT_B') {
      setUsername('8888888882');
      navigate('/departments/dept-b');
    } else {
      setUsername('8888888888');
      navigate('/departments/dept-c');
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
                <span className="text-slate-500">Contact Email:</span>
                <span className="font-semibold text-slate-800">{currentUser?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Current Role:</span>
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
    <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-[#0f2942] p-6 text-center text-white">
          <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto mb-3">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold">MahaSetu Universal Login</h2>
          <p className="text-xs text-slate-300 mt-1">
            Single sign-on access to connected Maharashtra department services
          </p>
        </div>

        {/* Quick Demo Switcher Across All 6 Roles */}
        <div className="bg-slate-50 p-4 border-b border-slate-200 text-xs">
          <p className="font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            ⚡ Quick 1-Click 6-Role Switcher:
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={() => handleQuickSelect('CITIZEN')}
              className="p-1.5 rounded-lg bg-white border border-slate-300 hover:border-amber-500 text-left transition-colors"
            >
              <div className="font-bold text-[11px] text-amber-700">Citizen</div>
              <div className="text-[9px] text-slate-500">CIT-001</div>
            </button>
            <button
              onClick={() => handleQuickSelect('DEPARTMENT_A')}
              className="p-1.5 rounded-lg bg-white border border-slate-300 hover:border-sky-500 text-left transition-colors"
            >
              <div className="font-bold text-[11px] text-sky-700">Dept A</div>
              <div className="text-[9px] text-slate-500">Identity API</div>
            </button>
            <button
              onClick={() => handleQuickSelect('DEPARTMENT_B')}
              className="p-1.5 rounded-lg bg-white border border-slate-300 hover:border-indigo-500 text-left transition-colors"
            >
              <div className="font-bold text-[11px] text-indigo-700">Dept B</div>
              <div className="text-[9px] text-slate-500">Eligibility</div>
            </button>
            <button
              onClick={() => handleQuickSelect('DEPARTMENT_C')}
              className="p-1.5 rounded-lg bg-white border border-slate-300 hover:border-emerald-500 text-left transition-colors"
            >
              <div className="font-bold text-[11px] text-emerald-700">Dept C</div>
              <div className="text-[9px] text-slate-500">Employment</div>
            </button>
            <button
              onClick={() => handleQuickSelect('AUDITOR')}
              className="p-1.5 rounded-lg bg-white border border-slate-300 hover:border-purple-500 text-left transition-colors"
            >
              <div className="font-bold text-[11px] text-purple-700">Auditor</div>
              <div className="text-[9px] text-slate-500">Oversight</div>
            </button>
            <button
              onClick={() => handleQuickSelect('ADMIN')}
              className="p-1.5 rounded-lg bg-white border border-slate-300 hover:border-rose-500 text-left transition-colors"
            >
              <div className="font-bold text-[11px] text-rose-700">Admin</div>
              <div className="text-[9px] text-slate-500">Integration Hub</div>
            </button>
          </div>
        </div>

        {/* Tab Selector: Login vs Register */}
        <div className="flex border-b border-slate-200 text-xs font-semibold bg-white">
          <button
            onClick={() => { setMode('LOGIN'); setError(null); setSuccessMsg(null); }}
            className={`flex-1 py-3 text-center transition-colors border-b-2 ${
              mode === 'LOGIN' ? 'border-amber-500 text-amber-900 font-bold bg-amber-50/50' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Sign In with Service Passport
          </button>
          <button
            onClick={() => { setMode('REGISTER'); setError(null); setSuccessMsg(null); }}
            className={`flex-1 py-3 text-center transition-colors border-b-2 ${
              mode === 'REGISTER' ? 'border-amber-500 text-amber-900 font-bold bg-amber-50/50' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Register New Citizen
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 text-rose-700 text-xs border border-rose-200">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs border border-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {mode === 'LOGIN' ? (
            <form onSubmit={handleLogin} className="space-y-4 text-sm">
              <div>
                <label className="block font-medium text-slate-700 text-xs mb-1">
                  Registered Mobile Number or Email
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 text-xs mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Demo password: <code className="bg-slate-100 px-1 py-0.5 rounded">mahasetu123</code>
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-[#0f2942] hover:bg-[#163352] text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 text-xs shadow"
              >
                <span>{loading ? 'Authenticating...' : 'Sign In to Service Passport'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3 text-sm">
              <div>
                <label className="block font-medium text-slate-700 text-xs mb-1">Full Legal Name</label>
                <input
                  type="text"
                  placeholder="e.g. Anand R. Deshpande"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 text-xs mb-1">Mobile Number (10 Digits)</label>
                <input
                  type="text"
                  placeholder="98XXXXXXXX"
                  value={regMobile}
                  onChange={(e) => setRegMobile(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 text-xs mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="citizen@example.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 text-xs mb-1">Password</label>
                <input
                  type="password"
                  placeholder="Minimum 6 characters"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 text-xs shadow"
                >
                  <span>{loading ? 'Submitting Registration...' : 'Register Citizen Account'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <p className="text-[10px] text-slate-400 mt-2 text-center">
                  Account will enter PENDING state until state administrator approval.
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
