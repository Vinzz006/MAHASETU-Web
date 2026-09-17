import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

interface DemoContextType {
  isFailureSimulated: boolean;
  toggleFailure: (force?: boolean) => Promise<void>;
  isInspectorOpen: boolean;
  setIsInspectorOpen: (open: boolean) => void;
  inspectorTrace: any | null;
  inspectTransformation: (src: string, tgt: string, payload?: any) => Promise<void>;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export const DemoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isFailureSimulated, setIsFailureSimulated] = useState(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [inspectorTrace, setInspectorTrace] = useState<any | null>(null);

  const refreshStatus = async () => {
    try {
      const res = await api.getDemoStatus();
      setIsFailureSimulated(res.department_b_failure_simulated);
    } catch (e) {
      console.error('Failed to get demo status', e);
    }
  };

  useEffect(() => {
    refreshStatus();
  }, []);

  const toggleFailure = async (force?: boolean) => {
    try {
      const res = await api.toggleFailure(force);
      setIsFailureSimulated(res.department_b_failure_simulated);
    } catch (e) {
      console.error('Failed to toggle failure', e);
    }
  };

  const inspectTransformation = async (src: string, tgt: string, payload?: any) => {
    try {
      const trace = await api.traceTransformation(src, tgt, payload);
      setInspectorTrace(trace);
      setIsInspectorOpen(true);
    } catch (e) {
      console.error('Failed to inspect transformation', e);
    }
  };

  return (
    <DemoContext.Provider
      value={{
        isFailureSimulated,
        toggleFailure,
        isInspectorOpen,
        setIsInspectorOpen,
        inspectorTrace,
        inspectTransformation
      }}
    >
      {children}
    </DemoContext.Provider>
  );
};

export const useDemo = () => {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error('useDemo must be used within DemoProvider');
  return ctx;
};
