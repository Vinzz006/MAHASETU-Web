import React, { useState } from 'react';
import { api } from '../api/client';
import { X, MessageSquare, AlertCircle, CheckCircle2 } from 'lucide-react';

interface GrievanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId: string;
  applicationNumber: string;
  onGrievanceSubmitted?: () => void;
}

export const GrievanceModal: React.FC<GrievanceModalProps> = ({
  isOpen,
  onClose,
  applicationId,
  applicationNumber,
  onGrievanceSubmitted
}) => {
  const [departmentId, setDepartmentId] = useState('DEPT_B');
  const [category, setCategory] = useState('ELIGIBILITY_DISCREPANCY');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await api.createGrievance({
        application_id: applicationId,
        department_id: departmentId,
        category,
        description
      });
      setSuccess(true);
      setTimeout(() => {
        if (onGrievanceSubmitted) onGrievanceSubmitted();
        onClose();
      }, 1800);
    } catch (err: any) {
      setError(err.message || 'Failed to submit grievance');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-[#0f2942] p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold">Lodge Inter-Department Grievance</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h4 className="text-base font-bold text-slate-900">Grievance Ticket Registered</h4>
            <p className="text-xs text-slate-600">
              Your ticket has been dispatched to the designated officer queue. 
              Status updates will correlate with Universal Application ID <strong>{applicationNumber}</strong>.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 text-blue-900">
              Linked Application: <strong className="font-mono text-blue-950">{applicationNumber}</strong>
            </div>

            {error && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Target Department</label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                <option value="DEPT_A">Department A (Identity Verification)</option>
                <option value="DEPT_B">Department B (Eligibility Evaluation)</option>
                <option value="DEPT_C">Department C (Employment & Sanction)</option>
                <option value="HUB">MahaSetu Interoperability Hub Central</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Discrepancy Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                <option value="ELIGIBILITY_DISCREPANCY">Eligibility / Income Discrepancy</option>
                <option value="IDENTITY_MISMATCH">Demographic / Name Mismatch</option>
                <option value="SANCTION_DELAY">Sanction Disbursement Delay</option>
                <option value="TECHNICAL_EXCEPTION">Technical Connector Exception</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Detailed Explanation</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={4}
                placeholder="Explain the discrepancy or query regarding your multi-department service progress..."
                className="w-full p-2.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-[#0f2942] hover:bg-[#163352] text-white rounded-lg text-xs font-bold shadow"
              >
                {loading ? 'Submitting...' : 'Register Grievance'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
