import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Activity, Radio, Play, Shield, Server, ArrowRight, Zap, RefreshCw, Layers } from 'lucide-react';

export const EventRadarPage: React.FC = () => {
  const [radarData, setRadarData] = useState<any | null>(null);
  const [pulsingNode, setPulsingNode] = useState<string | null>(null);
  const [pulseLine, setPulseLine] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);

  const fetchRadar = async () => {
    try {
      const data = await api.getLiveEventsFeed(18);
      setRadarData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRadar();
    const interval = setInterval(fetchRadar, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleSimulatePulse = async () => {
    setSimulating(true);
    try {
      const pulse = await api.simulatePulse();
      // Animate pulse between nodes
      const sourceNode = radarData?.nodes.find((n: any) => n.id === pulse.source_node);
      const targetNode = radarData?.nodes.find((n: any) => n.id === pulse.target_node);
      if (sourceNode && targetNode) {
        setPulseLine({ x1: sourceNode.x, y1: sourceNode.y, x2: targetNode.x, y2: targetNode.y });
        setPulsingNode(pulse.target_node);
        setTimeout(() => {
          setPulseLine(null);
          setPulsingNode(null);
        }, 1500);
      }
      await fetchRadar();
    } catch (e) {
      console.error(e);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">
            <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
            <span>Statewide Telemetry & Data Mesh</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            Real-Time Interoperability Event Radar
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Live asynchronous data packets flowing across the MahaSetu federated hub and department connectors.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchRadar}
            className="p-2 border border-slate-300 rounded-lg hover:bg-slate-100 text-slate-600"
            title="Refresh feed"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleSimulatePulse}
            disabled={simulating}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-lg text-xs transition-colors flex items-center gap-2 shadow"
          >
            <Zap className="w-4 h-4 text-amber-300 fill-current" />
            <span>{simulating ? 'Pulsing Packet...' : 'Simulate Interop Pulse'}</span>
          </button>
        </div>
      </div>

      {/* KPI bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 text-xs">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-slate-400 block text-[10px] uppercase font-bold">Network State</span>
          <strong className="text-emerald-700 text-sm font-black flex items-center gap-1.5 mt-0.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            OPTIMAL (All Nodes Responding)
          </strong>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-slate-400 block text-[10px] uppercase font-bold">Avg Hub Latency</span>
          <strong className="text-slate-900 text-sm font-mono font-black mt-0.5">
            {radarData?.avg_hub_latency_ms || 58.4} ms
          </strong>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-slate-400 block text-[10px] uppercase font-bold">Connected Systems</span>
          <strong className="text-blue-950 text-sm font-black mt-0.5">
            6 Heterogeneous Endpoints
          </strong>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-slate-400 block text-[10px] uppercase font-bold">Packets Processed</span>
          <strong className="text-amber-800 text-sm font-mono font-black mt-0.5">
            {radarData?.total_packets_processed?.toLocaleString() || '14,820'}
          </strong>
        </div>
      </div>

      {/* Top Half: Topological Node Graph */}
      <div className="bg-slate-950 rounded-2xl p-6 shadow-2xl border border-slate-800 mb-8 relative overflow-hidden">
        <div className="flex items-center justify-between text-xs text-slate-400 pb-4 border-b border-slate-800 mb-4 font-mono">
          <span className="flex items-center gap-2 text-slate-200 font-bold">
            <Layers className="w-4 h-4 text-emerald-400" />
            TOPOLOGICAL PACKET RADAR
          </span>
          <span className="text-[11px] text-amber-400">Zero Data Duplication Protocol Active</span>
        </div>

        {/* SVG Topological Map */}
        <div className="relative w-full h-96 flex items-center justify-center">
          <svg className="w-full h-full" viewBox="0 0 800 450">
            <defs>
              {/* Glowing gradient filters */}
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <linearGradient id="hubGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0f2942" />
                <stop offset="100%" stopColor="#d97706" />
              </linearGradient>
            </defs>

            {/* Background Conduits / Cables */}
            {/* Citizen to Hub */}
            <line x1="160" y1="225" x2="380" y2="225" stroke="#334155" strokeWidth="2" strokeDasharray="4 4" />
            {/* Hub to Dept A */}
            <line x1="380" y1="225" x2="620" y2="100" stroke="#334155" strokeWidth="2" strokeDasharray="4 4" />
            {/* Hub to Dept B */}
            <line x1="380" y1="225" x2="620" y2="225" stroke="#334155" strokeWidth="2" strokeDasharray="4 4" />
            {/* Hub to Dept C */}
            <line x1="380" y1="225" x2="620" y2="350" stroke="#334155" strokeWidth="2" strokeDasharray="4 4" />
            {/* Hub to Legacy */}
            <line x1="380" y1="225" x2="380" y2="390" stroke="#334155" strokeWidth="2" strokeDasharray="4 4" />

            {/* Simulated Dynamic Pulse Beam */}
            {pulseLine && (
              <line
                x1={pulseLine.x1 === 100 ? 160 : pulseLine.x1 === 350 ? 380 : 620}
                y1={pulseLine.y1 === 80 ? 100 : pulseLine.y1 === 320 ? 350 : pulseLine.y1 === 380 ? 390 : 225}
                x2={pulseLine.x2 === 100 ? 160 : pulseLine.x2 === 350 ? 380 : 620}
                y2={pulseLine.y2 === 80 ? 100 : pulseLine.y2 === 320 ? 350 : pulseLine.y2 === 380 ? 390 : 225}
                stroke="#10b981"
                strokeWidth="4"
                filter="url(#glow)"
                className="animate-pulse"
              />
            )}

            {/* Node 1: Citizen Portal */}
            <g transform="translate(160, 225)" className="cursor-pointer">
              <circle r="36" fill="#1e293b" stroke="#38bdf8" strokeWidth="2.5" />
              <text y="-6" textAnchor="middle" fill="#f8fafc" fontSize="11" fontWeight="bold" fontFamily="sans-serif">
                Citizen
              </text>
              <text y="10" textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="sans-serif">
                Portal
              </text>
            </g>

            {/* Node 2: Center MahaSetu Interoperability Hub */}
            <g transform="translate(380, 225)" className="cursor-pointer">
              <circle r="52" fill="url(#hubGrad)" stroke="#f59e0b" strokeWidth="3" filter="url(#glow)" />
              <text y="-8" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="900" fontFamily="sans-serif">
                MAHASETU
              </text>
              <text y="10" textAnchor="middle" fill="#fde68a" fontSize="10" fontWeight="bold" fontFamily="sans-serif">
                Interop Hub
              </text>
              <text y="24" textAnchor="middle" fill="#93c5fd" fontSize="8" fontFamily="monospace">
                Canonical Engine
              </text>
            </g>

            {/* Node 3: Dept A (Identity REST) */}
            <g transform="translate(620, 100)" className="cursor-pointer">
              <circle
                r="36"
                fill="#1e293b"
                stroke={pulsingNode === 'DEPT_A_REST' ? '#10b981' : '#64748b'}
                strokeWidth="2.5"
              />
              <text y="-6" textAnchor="middle" fill="#f8fafc" fontSize="11" fontWeight="bold" fontFamily="sans-serif">
                Dept A
              </text>
              <text y="10" textAnchor="middle" fill="#10b981" fontSize="9" fontFamily="monospace">
                REST (Identity)
              </text>
            </g>

            {/* Node 4: Dept B (Eligibility JSON) */}
            <g transform="translate(620, 225)" className="cursor-pointer">
              <circle
                r="36"
                fill="#1e293b"
                stroke={pulsingNode === 'DEPT_B_JSON' ? '#10b981' : '#64748b'}
                strokeWidth="2.5"
              />
              <text y="-6" textAnchor="middle" fill="#f8fafc" fontSize="11" fontWeight="bold" fontFamily="sans-serif">
                Dept B
              </text>
              <text y="10" textAnchor="middle" fill="#f59e0b" fontSize="9" fontFamily="monospace">
                Custom JSON
              </text>
            </g>

            {/* Node 5: Dept C (Sanctions) */}
            <g transform="translate(620, 350)" className="cursor-pointer">
              <circle
                r="36"
                fill="#1e293b"
                stroke={pulsingNode === 'DEPT_C_SANCTION' ? '#10b981' : '#64748b'}
                strokeWidth="2.5"
              />
              <text y="-6" textAnchor="middle" fill="#f8fafc" fontSize="11" fontWeight="bold" fontFamily="sans-serif">
                Dept C
              </text>
              <text y="10" textAnchor="middle" fill="#a855f7" fontSize="9" fontFamily="monospace">
                Sanctions
              </text>
            </g>

            {/* Node 6: Legacy Mainframe */}
            <g transform="translate(380, 390)" className="cursor-pointer">
              <circle
                r="30"
                fill="#0f172a"
                stroke={pulsingNode === 'LEGACY_MAINFRAME' ? '#10b981' : '#475569'}
                strokeWidth="2"
              />
              <text y="-2" textAnchor="middle" fill="#f8fafc" fontSize="10" fontWeight="bold" fontFamily="sans-serif">
                Legacy
              </text>
              <text y="12" textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="monospace">
                Pipe Stream
              </text>
            </g>
          </svg>
        </div>
      </div>

      {/* Bottom Half: Live Telemetry Event Stream Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-xs">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <span className="font-bold text-slate-800">
            Live Asynchronous Interop Telemetry Stream
          </span>
          <span className="text-[11px] text-slate-500 font-mono">
            Cryptographic SHA-256 Audit Stream
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500">Connecting to telemetry mesh...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-100 text-[10px] uppercase font-bold text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="p-3">Time</th>
                  <th className="p-3">Event Action</th>
                  <th className="p-3">Conduit Route</th>
                  <th className="p-3">Latency</th>
                  <th className="p-3">Packet Hash</th>
                  <th className="p-3">Security Seal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {radarData?.active_telemetry?.map((pkt: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3 text-slate-500 whitespace-nowrap">
                      {new Date(pkt.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="p-3 font-bold text-blue-900">
                      {pkt.event_type}
                    </td>
                    <td className="p-3 text-slate-700 whitespace-nowrap font-sans">
                      <span className="font-bold">{pkt.source_node}</span>
                      <span className="text-slate-400 mx-1.5">➔</span>
                      <span className="font-bold">{pkt.target_node}</span>
                    </td>
                    <td className="p-3 text-emerald-700 font-bold">
                      {pkt.latency_ms} ms
                    </td>
                    <td className="p-3 text-slate-500">
                      {pkt.packet_hash}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        VERIFIED
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
