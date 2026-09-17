import React, { useState, useEffect } from 'react';
import { useDemo } from '../context/DemoContext';
import { X, ArrowRight, RefreshCw, CheckCircle2, ShieldCheck, Database, FileCode } from 'lucide-react';

export const CanonicalInspector: React.FC = () => {
  const { isInspectorOpen, setIsInspectorOpen, inspectorTrace, inspectTransformation } = useDemo();
  const [sourceDept, setSourceDept] = useState('DEPT_A');
  const [targetDept, setTargetDept] = useState('DEPT_B');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isInspectorOpen && !inspectorTrace) {
      handleRunTrace();
    }
  }, [isInspectorOpen]);

  const handleRunTrace = async () => {
    setLoading(true);
    await inspectTransformation(sourceDept, targetDept);
    setLoading(false);
  };

  if (!isInspectorOpen) return null;

  const trace = inspectorTrace || {
    source_department: sourceDept,
    target_department: targetDept,
    stage_1_raw_source: {
      citizen_name: "Demo Citizen",
      mobile_no: "9999999999",
      dob: "1998-05-12",
      district: "Pune"
    },
    stage_2_canonical_model: {
      citizen: {
        id: "CIT-001",
        name: "Demo Citizen",
        phone: "9999999999",
        dateOfBirth: "1998-05-12",
        address: { district: "Pune", state: "Maharashtra" }
      }
    },
    stage_3_transformed_target: {
      fullName: "Demo Citizen",
      phone: "9999999999",
      date_of_birth: "1998-05-12",
      residence_district: "Pune"
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-6xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#0f2942] px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/30">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">Canonical Data Model Transformer</h3>
                <span className="text-[10px] uppercase font-bold tracking-wider bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                  Live Interoperability Hub
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Department A Schema → Adapter A → Canonical Model → Adapter B → Department B Schema
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsInspectorOpen(false)}
            className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls Bar */}
        <div className="bg-slate-800/80 px-6 py-3 border-b border-slate-700 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-400 font-medium">Source System:</span>
            <select
              value={sourceDept}
              onChange={(e) => setSourceDept(e.target.value)}
              className="bg-slate-900 text-slate-200 border border-slate-700 rounded px-2.5 py-1 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
            >
              <option value="DEPT_A">Dept A (REST API)</option>
              <option value="DEPT_B">Dept B (Heterogeneous JSON)</option>
              <option value="LEGACY_01">Legacy Registry (Pipe ASCII)</option>
            </select>

            <ArrowRight className="w-4 h-4 text-slate-500" />

            <span className="text-slate-400 font-medium">Target System:</span>
            <select
              value={targetDept}
              onChange={(e) => setTargetDept(e.target.value)}
              className="bg-slate-900 text-slate-200 border border-slate-700 rounded px-2.5 py-1 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
            >
              <option value="DEPT_B">Dept B (Heterogeneous JSON)</option>
              <option value="DEPT_A">Dept A (REST API)</option>
              <option value="DEPT_C">Dept C (Sanction Payload)</option>
              <option value="LEGACY_01">Legacy Registry (Pipe ASCII)</option>
            </select>

            <button
              onClick={handleRunTrace}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded text-xs transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Transform Live
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <span>Non-invasive: No backend department schemas altered</span>
          </div>
        </div>

        {/* 3-Column Visual Transformation Pipeline */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950">
          {/* Column 1: Source System */}
          <div className="flex flex-col bg-slate-900 rounded-lg border border-slate-800 overflow-hidden">
            <div className="bg-slate-800/90 px-4 py-2.5 border-b border-slate-700 flex items-center justify-between">
              <span className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5" />
                1. Source Payload ({sourceDept})
              </span>
              <span className="text-[10px] text-slate-400">
                {sourceDept === 'LEGACY_01' ? 'Plain Pipe Stream' : 'Native Schema'}
              </span>
            </div>
            <div className="p-3 flex-1 overflow-x-auto text-[11px] font-mono text-slate-300 leading-relaxed bg-slate-950/60">
              <pre>
                {typeof trace.stage_1_raw_source === 'string'
                  ? trace.stage_1_raw_source
                  : JSON.stringify(trace.stage_1_raw_source, null, 2)}
              </pre>
            </div>
          </div>

          {/* Column 2: Canonical Model (The Core Interoperability Bridge) */}
          <div className="flex flex-col bg-slate-900 rounded-lg border-2 border-amber-500/50 shadow-lg overflow-hidden relative">
            <div className="bg-amber-950/50 px-4 py-2.5 border-b border-amber-500/30 flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                2. MahaSetu Canonical Model
              </span>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-bold">
                STANDARDIZED
              </span>
            </div>
            <div className="p-3 flex-1 overflow-x-auto text-[11px] font-mono text-amber-200/90 leading-relaxed bg-slate-950/70">
              <pre>{JSON.stringify(trace.stage_2_canonical_model, null, 2)}</pre>
            </div>
          </div>

          {/* Column 3: Target System Payload */}
          <div className="flex flex-col bg-slate-900 rounded-lg border border-slate-800 overflow-hidden">
            <div className="bg-slate-800/90 px-4 py-2.5 border-b border-slate-700 flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5" />
                3. Target Payload ({targetDept})
              </span>
              <span className="text-[10px] text-slate-400">
                {targetDept === 'LEGACY_01' ? 'Plain Pipe Stream' : 'Target Schema'}
              </span>
            </div>
            <div className="p-3 flex-1 overflow-x-auto text-[11px] font-mono text-slate-300 leading-relaxed bg-slate-950/60">
              <pre>
                {typeof trace.stage_3_transformed_target === 'string'
                  ? trace.stage_3_transformed_target
                  : JSON.stringify(trace.stage_3_transformed_target, null, 2)}
              </pre>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="bg-slate-900 px-6 py-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <span>
            💡 <strong>Why this matters:</strong> Department A uses <code className="text-sky-300 bg-slate-800 px-1 py-0.5 rounded">citizen_name</code> while Department B expects <code className="text-emerald-300 bg-slate-800 px-1 py-0.5 rounded">fullName</code>. The Hub standardizes in real-time.
          </span>
          <button
            onClick={() => setIsInspectorOpen(false)}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
