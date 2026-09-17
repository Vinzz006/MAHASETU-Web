import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useDemo } from '../context/DemoContext';
import {
  AlertTriangle, Database, LayoutDashboard, UserCheck, ShieldAlert,
  ChevronUp, Activity, Sparkles, Layers, Trophy
} from 'lucide-react';

export const DemoFloatingBar: React.FC = () => {
  const { isFailureSimulated, toggleFailure, setIsInspectorOpen } = useDemo();
  const location = useLocation();

  const [opsOpen, setOpsOpen] = useState(false);
  const [citizenOpen, setCitizenOpen] = useState(false);
  const [meshOpen, setMeshOpen] = useState(false);

  const closeAll = () => {
    setOpsOpen(false);
    setCitizenOpen(false);
    setMeshOpen(false);
  };

  return (
    <aside aria-label="Hackathon Evaluation Controller" className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 backdrop-blur-md border border-slate-700 text-white px-4 py-2 rounded-full shadow-2xl flex items-center gap-2.5 text-xs">
      {/* Demo Label */}
      <div className="flex items-center gap-2 pr-2.5 border-r border-slate-700">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="font-extrabold uppercase tracking-wider text-[10px] text-amber-400 hidden sm:inline">
          Demo Controller
        </span>
      </div>

      {/* Dept B Failure Simulation Button */}
      <button
        onClick={() => toggleFailure()}
        className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-semibold transition-all shadow-sm ${
          isFailureSimulated
            ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse'
            : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600'
        }`}
        title="Simulate Department B failure during eligibility verification"
      >
        {isFailureSimulated ? (
          <>
            <AlertTriangle className="w-3.5 h-3.5 text-white" />
            <span className="text-[11px]">Failure: ACTIVE</span>
          </>
        ) : (
          <>
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[11px]">Simulate Failure</span>
          </>
        )}
      </button>

      {/* Canonical Inspector Button */}
      <button
        onClick={() => setIsInspectorOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-full border border-slate-600 font-medium transition-colors text-[11px]"
      >
        <Database className="w-3.5 h-3.5 text-sky-400" />
        <span className="hidden sm:inline">Inspector</span>
      </button>

      {/* Grouped Dropdown 1: Operations */}
      <div className="relative">
        <button
          onClick={() => {
            setOpsOpen(!opsOpen);
            setCitizenOpen(false);
            setMeshOpen(false);
          }}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full border transition-colors text-[11px] font-semibold ${
            opsOpen ? 'bg-indigo-600 text-white border-indigo-400' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-600'
          }`}
        >
          <Activity className="w-3 h-3 text-indigo-400" />
          <span>Operations</span>
          <ChevronUp className={`w-3 h-3 transition-transform ${opsOpen ? 'rotate-180' : ''}`} />
        </button>

        {opsOpen && (
          <div className="absolute bottom-full mb-2.5 left-0 w-52 bg-slate-900 border border-slate-700 shadow-2xl rounded-2xl p-1.5 z-50 text-xs flex flex-col gap-1 backdrop-blur-md animate-in fade-in slide-in-from-bottom-2">
            <Link to="/admin/war-room" onClick={closeAll} className="px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 font-medium hover:text-white flex items-center justify-between">
              <span>CM Executive War Room</span>
            </Link>
            <Link to="/admin/mahadrpan" onClick={closeAll} className="px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 font-medium hover:text-white flex items-center justify-between">
              <span>MahaDarpan Collectorate</span>
            </Link>
            <Link to="/admin/treasury-beams" onClick={closeAll} className="px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 font-medium hover:text-white flex items-center justify-between">
              <span>State Treasury BeAMS</span>
            </Link>
            <Link to="/admin/tribunal-nyaya" onClick={closeAll} className="px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 font-medium hover:text-white flex items-center justify-between">
              <span>RTSA Tribunal Nyaya</span>
            </Link>
            <Link to="/admin/document-forensics" onClick={closeAll} className="px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 font-medium hover:text-white flex items-center justify-between">
              <span>Document Forensics</span>
            </Link>
            <Link to="/admin/disaster-surge" onClick={closeAll} className="px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 font-medium hover:text-white flex items-center justify-between">
              <span>Disaster Surge Relief</span>
            </Link>
          </div>
        )}
      </div>

      {/* Grouped Dropdown 2: Citizen DPI */}
      <div className="relative">
        <button
          onClick={() => {
            setCitizenOpen(!citizenOpen);
            setOpsOpen(false);
            setMeshOpen(false);
          }}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full border transition-colors text-[11px] font-semibold ${
            citizenOpen ? 'bg-emerald-600 text-white border-emerald-400' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-600'
          }`}
        >
          <Sparkles className="w-3 h-3 text-emerald-400" />
          <span>Citizen DPI</span>
          <ChevronUp className={`w-3 h-3 transition-transform ${citizenOpen ? 'rotate-180' : ''}`} />
        </button>

        {citizenOpen && (
          <div className="absolute bottom-full mb-2.5 left-0 w-52 bg-slate-900 border border-slate-700 shadow-2xl rounded-2xl p-1.5 z-50 text-xs flex flex-col gap-1 backdrop-blur-md animate-in fade-in slide-in-from-bottom-2">
            <Link to="/citizen/credentials" onClick={closeAll} className="px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 font-medium hover:text-white">
              <span>ZKP Credentials Wallet</span>
            </Link>
            <Link to="/citizen/entitlements" onClick={closeAll} className="px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 font-medium hover:text-white">
              <span>Proactive Entitlements</span>
            </Link>
            <Link to="/citizen/voice-hotline" onClick={closeAll} className="px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 font-medium hover:text-white">
              <span>1800 Voice Hotline</span>
            </Link>
            <Link to="/citizen/police-cctns" onClick={closeAll} className="px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 font-medium hover:text-white">
              <span>Police CCTNS Desk</span>
            </Link>
            <Link to="/citizen/marriage-registry" onClick={closeAll} className="px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 font-medium hover:text-white">
              <span>Marriage e-Registry</span>
            </Link>
            <Link to="/citizen/zk-property-tax" onClick={closeAll} className="px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 font-medium hover:text-white">
              <span>ZK Property Tax</span>
            </Link>
          </div>
        )}
      </div>

      {/* Grouped Dropdown 3: Autonomous Mesh */}
      <div className="relative">
        <button
          onClick={() => {
            setMeshOpen(!meshOpen);
            setOpsOpen(false);
            setCitizenOpen(false);
          }}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full border transition-colors text-[11px] font-semibold ${
            meshOpen ? 'bg-amber-600 text-white border-amber-400' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-600'
          }`}
        >
          <Layers className="w-3 h-3 text-amber-400" />
          <span>Auto-Mesh</span>
          <ChevronUp className={`w-3 h-3 transition-transform ${meshOpen ? 'rotate-180' : ''}`} />
        </button>

        {meshOpen && (
          <div className="absolute bottom-full mb-2.5 right-0 sm:left-0 w-56 bg-slate-900 border border-slate-700 shadow-2xl rounded-2xl p-1.5 z-50 text-xs flex flex-col gap-1 backdrop-blur-md animate-in fade-in slide-in-from-bottom-2">
            <Link to="/admin/smart-escrow" onClick={closeAll} className="px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 font-medium hover:text-white">
              <span>e-RUPI Smart Escrow</span>
            </Link>
            <Link to="/citizen/drone-pmfby" onClick={closeAll} className="px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 font-medium hover:text-white">
              <span>Drone PMFBY Crop Loss</span>
            </Link>
            <Link to="/admin/pds-ration" onClick={closeAll} className="px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 font-medium hover:text-white">
              <span>PDS Grain Supply Chain</span>
            </Link>
            <Link to="/admin/jal-jeevan" onClick={closeAll} className="px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 font-medium hover:text-white">
              <span>Jal Jeevan Aquifer Telemetry</span>
            </Link>
            <Link to="/admin/ev-grid" onClick={closeAll} className="px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 font-medium hover:text-white">
              <span>Clean EV Grid Balancer</span>
            </Link>
            <Link to="/admin/industrial-emissions" onClick={closeAll} className="px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 font-medium hover:text-white">
              <span>Industrial Emissions CEMS</span>
            </Link>
            <Link to="/admin/solar-feeder" onClick={closeAll} className="px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 font-medium hover:text-white">
              <span>Solar Feeder Balancer</span>
            </Link>
            <Link to="/admin/policy-copilot" onClick={closeAll} className="px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 font-medium hover:text-white">
              <span>Policy AI SQL Copilot</span>
            </Link>
          </div>
        )}
      </div>

      {/* Master 15-Phase Showcase Button */}
      <Link
        to="/admin/master-showcase"
        onClick={closeAll}
        className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black rounded-full transition-all text-[11px] shadow-md shrink-0"
        title="Master 15-Phase Hackathon Capstone"
      >
        <Trophy className="w-3.5 h-3.5" />
        <span>Master ★</span>
      </Link>

      {/* Role Switcher */}
      {location.pathname.startsWith('/admin') ? (
        <Link
          to="/citizen/dashboard"
          onClick={closeAll}
          className="flex items-center gap-1 px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-full transition-colors text-[11px] shrink-0"
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Citizen View</span>
        </Link>
      ) : (
        <Link
          to="/admin/dashboard"
          onClick={closeAll}
          className="flex items-center gap-1 px-3 py-1 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-full transition-colors text-[11px] shrink-0"
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Officer Cockpit</span>
        </Link>
      )}
    </aside>
  );
};
