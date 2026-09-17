import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Layers, Play, CheckCircle2, Code2, Plus, Terminal } from 'lucide-react';

export const ConnectorStudioPage: React.FC = () => {
  const [connectors, setConnectors] = useState<any | null>(null);
  const [connectorId, setConnectorId] = useState('DEPT_LAND_RECORDS');
  const [protocol, setProtocol] = useState('REST_JSON');
  const [payloadText, setPayloadText] = useState(
    JSON.stringify(
      {
        khata_no: 'KHATA-4821',
        owner_name: 'Demo Citizen',
        taluka: 'Haveli',
        district: 'Pune',
        land_area_hectares: 2.4
      },
      null,
      2
    )
  );
  const [testResult, setTestResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const c = await api.getStudioConnectors();
        setConnectors(c);
      } catch (e) {
        console.error(e);
      }
    }
    load();
  }, []);

  const handleTest = async () => {
    setLoading(true);
    try {
      const parsed = JSON.parse(payloadText);
      const res = await api.testCustomTransformation({
        connector_id: connectorId,
        connector_name: connectorId.replace(/_/g, ' '),
        protocol,
        sample_payload: parsed
      });
      setTestResult(res);
    } catch (e: any) {
      alert('Invalid JSON: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs font-bold text-sky-700 uppercase tracking-wider mb-1">
          <Code2 className="w-4 h-4" />
          <span>MahaSetu Connector Studio & Sandbox</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
          Federated Adapter Onboarding Studio
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Test and configure new departmental endpoints and evaluate Canonical Model schema transformation in real time.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Left Col: Connector Config Form */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 text-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center justify-between">
            <span>Adapter Configuration</span>
            <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-600">
              Interactive Testbed
            </span>
          </h3>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Connector Identifier</label>
            <input
              type="text"
              value={connectorId}
              onChange={(e) => setConnectorId(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Integration Protocol</label>
            <select
              value={protocol}
              onChange={(e) => setProtocol(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white"
            >
              <option value="REST_JSON">Modern REST API (JSON Schema)</option>
              <option value="SOAP_XML_WRAPPED">Legacy SOAP / XML Envelope</option>
              <option value="PIPE_DELIMITED">Legacy Mainframe Pipe-Delimited</option>
              <option value="CSV_STREAM">Batch CSV Registry Stream</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Sample Departmental Payload (JSON)</label>
            <textarea
              value={payloadText}
              onChange={(e) => setPayloadText(e.target.value)}
              rows={8}
              className="w-full p-2.5 font-mono text-[11px] bg-slate-950 text-slate-200 border border-slate-700 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          <button
            onClick={handleTest}
            disabled={loading}
            className="w-full py-2.5 bg-[#0f2942] hover:bg-[#163352] text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 text-xs shadow"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{loading ? 'Evaluating Protocol...' : 'Test Transformation via Hub'}</span>
          </button>
        </div>

        {/* Right Col: Live Transformation Result */}
        <div className="bg-slate-900 rounded-xl border border-slate-700 shadow-sm p-6 text-xs font-mono text-white flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
              <span className="font-bold text-amber-400 flex items-center gap-1.5">
                <Terminal className="w-4 h-4" />
                Live Transformation Inspector
              </span>
              {testResult && (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                  Latency: {testResult.latency_simulated_ms}ms
                </span>
              )}
            </div>

            {testResult ? (
              <div className="space-y-4">
                <div>
                  <span className="text-slate-400 text-[10px] block mb-1">
                    1. Canonical Model Mapped:
                  </span>
                  <pre className="p-2.5 bg-slate-950 rounded border border-slate-800 text-[10px] text-amber-200 overflow-x-auto max-h-48">
                    {JSON.stringify(testResult.stage_2_canonical_model, null, 2)}
                  </pre>
                </div>

                <div>
                  <span className="text-slate-400 text-[10px] block mb-1">
                    2. Dispatched to Department B Schema:
                  </span>
                  <pre className="p-2.5 bg-slate-950 rounded border border-slate-800 text-[10px] text-emerald-200 overflow-x-auto max-h-48">
                    {JSON.stringify(testResult.stage_3_target_dept_b, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="py-24 text-center text-slate-500 font-sans">
                Click 'Test Transformation via Hub' to preview live adapter normalization.
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-800 text-[10px] text-slate-400 font-sans">
            MahaSetu Adapter Contract ensures all new connectors conform to standardized Canonical representations.
          </div>
        </div>
      </div>
    </div>
  );
};
