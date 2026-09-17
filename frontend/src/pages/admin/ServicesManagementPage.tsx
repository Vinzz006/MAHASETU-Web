import React, { useState, useEffect } from 'react';
import {
  Building2, Plus, Edit2, Trash2, CheckCircle2, XCircle,
  Clock, Shield, Search, Sparkles, Layers, AlertCircle, RefreshCw
} from 'lucide-react';
import { api, GovService } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export const ServicesManagementPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [services, setServices] = useState<GovService[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<GovService | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState<{
    id: string;
    name: string;
    name_mr: string;
    department: string;
    description: string;
    description_mr: string;
    participating_departments: string;
    sla_days: number;
    is_active: boolean;
  }>({
    id: '',
    name: '',
    name_mr: '',
    department: '',
    description: '',
    description_mr: '',
    participating_departments: 'DEPT_A, DEPT_B, DEPT_C',
    sla_days: 7,
    is_active: true
  });

  const loadServices = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getAllServices(true);
      setServices(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load services catalogue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  const openCreateModal = () => {
    setEditingService(null);
    setFormData({
      id: '',
      name: '',
      name_mr: '',
      department: '',
      description: '',
      description_mr: '',
      participating_departments: 'DEPT_A (Identity), DEPT_B (Eligibility), DEPT_C (Sanction)',
      sla_days: 7,
      is_active: true
    });
    setModalOpen(true);
  };

  const openEditModal = (svc: GovService) => {
    setEditingService(svc);
    setFormData({
      id: svc.id,
      name: svc.name,
      name_mr: svc.name_mr || '',
      department: svc.department,
      description: svc.description,
      description_mr: svc.description_mr || '',
      participating_departments: svc.participating_departments ? svc.participating_departments.join(', ') : '',
      sla_days: svc.sla_days,
      is_active: svc.is_active
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);

    const deptsArray = formData.participating_departments
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    try {
      if (editingService) {
        // Update
        await api.updateService(editingService.id, {
          name: formData.name,
          name_mr: formData.name_mr || undefined,
          department: formData.department,
          description: formData.description,
          description_mr: formData.description_mr || undefined,
          participating_departments: deptsArray,
          sla_days: Number(formData.sla_days),
          is_active: formData.is_active
        });
      } else {
        // Create
        await api.createService({
          id: formData.id.trim(),
          name: formData.name.trim(),
          name_mr: formData.name_mr.trim() || undefined,
          department: formData.department.trim(),
          description: formData.description.trim(),
          description_mr: formData.description_mr.trim() || undefined,
          participating_departments: deptsArray,
          sla_days: Number(formData.sla_days),
          is_active: formData.is_active
        });
      }
      setModalOpen(false);
      await loadServices();
    } catch (err: any) {
      setError(err.message || 'Failed to save service');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete scheme "${name}" (${id})?`)) {
      return;
    }
    setActionLoading(true);
    try {
      await api.deleteService(id);
      await loadServices();
    } catch (err: any) {
      alert(err.message || 'Failed to delete service');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredServices = services.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.department.toLowerCase().includes(search.toLowerCase()) ||
    s.id.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = services.filter(s => s.is_active).length;
  const avgSla = services.length > 0 ? (services.reduce((acc, s) => acc + s.sla_days, 0) / services.length).toFixed(1) : '0';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 uppercase tracking-wider mb-1">
            <Building2 className="w-4 h-4" />
            <span>State Administration Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Government Services Catalogue Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Define scheme SLAs, participating verification departments, and active onboarding pipelines.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Scheme</span>
        </button>
      </div>

      {/* Quick Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">{services.length}</div>
            <div className="text-xs text-slate-500">Total Configured Schemes</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-emerald-600">{activeCount}</div>
            <div className="text-xs text-slate-500">Active in Citizen Portal</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-blue-600">{avgSla} days</div>
            <div className="text-xs text-slate-500">Average Processing SLA</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex items-center justify-between gap-4 mb-4 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by scheme name, department, or slug..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>
        <button
          onClick={loadServices}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50"
          title="Refresh"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Services Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left divide-y divide-slate-200">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Scheme / Service</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Participating Depts</th>
                <th className="py-3 px-4">SLA</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    Loading government schemes...
                  </td>
                </tr>
              ) : filteredServices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    No schemes match your query.
                  </td>
                </tr>
              ) : (
                filteredServices.map(svc => (
                  <tr key={svc.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{svc.name}</div>
                      {svc.name_mr && <div className="text-slate-500 text-[11px] font-medium">{svc.name_mr}</div>}
                      <div className="text-[10px] font-mono text-slate-400 mt-0.5">{svc.id}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium">
                      {svc.department}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1">
                        {svc.participating_departments && svc.participating_departments.map((dept, i) => (
                          <span key={i} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] border border-slate-200">
                            {dept}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800 whitespace-nowrap">
                      {svc.sla_days} days
                    </td>
                    <td className="py-3.5 px-4">
                      {svc.is_active ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-300">
                          <XCircle className="w-3 h-3" />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(svc)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 transition-colors"
                          title="Edit scheme"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(svc.id, svc.name)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors"
                          title="Delete scheme"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden text-xs animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-[#0b1f33] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-sm">
                  {editingService ? `Edit Scheme: ${editingService.name}` : 'Add New Government Scheme'}
                </h3>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Scheme ID (Slug) *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingService}
                    placeholder="e.g. solar-pump-subsidy"
                    value={formData.id}
                    onChange={e => setFormData({ ...formData, id: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg disabled:bg-slate-100 font-mono text-xs"
                  />
                  <span className="text-[10px] text-slate-400">Unique alphanumeric key</span>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    SLA (Days) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={60}
                    value={formData.sla_days}
                    onChange={e => setFormData({ ...formData, sla_days: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Scheme Name (English) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maharashtra Solar Agriculture Scheme"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Scheme Name (Marathi)
                </label>
                <input
                  type="text"
                  placeholder="e.g. महाराष्ट्र सौर कृषी पंप योजना"
                  value={formData.name_mr}
                  onChange={e => setFormData({ ...formData, name_mr: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Managing Department *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Energy & Renewable Resources Department"
                  value={formData.department}
                  onChange={e => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Participating Departments (Comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="DEPT_A (Identity), DEPT_B (Eligibility), DEPT_C (Sanction)"
                  value={formData.participating_departments}
                  onChange={e => setFormData({ ...formData, participating_departments: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Description (English) *
                </label>
                <textarea
                  required
                  rows={2}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Description (Marathi)
                </label>
                <textarea
                  rows={2}
                  value={formData.description_mr}
                  onChange={e => setFormData({ ...formData, description_mr: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 w-4 h-4"
                />
                <label htmlFor="is_active" className="text-slate-700 font-medium">
                  Active in Citizen Services Catalog
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg shadow transition-colors disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : editingService ? 'Update Scheme' : 'Create Scheme'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
