import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, CitizenSummary } from '../../api/client';
import {
  Users, Search, Shield, FileText, CheckCircle2, AlertTriangle,
  RefreshCw, ChevronRight, X, Phone, Mail, MapPin, Award, Building, CreditCard
} from 'lucide-react';

export const CitizenManagementPage: React.FC = () => {
  const [citizens, setCitizens] = useState<CitizenSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCitizenProfile, setSelectedCitizenProfile] = useState<any | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const loadCitizens = async () => {
    try {
      const data = await api.listCitizens();
      setCitizens(data);
    } catch (e) {
      console.error('Failed to load citizens', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCitizens();
  }, []);

  const handleViewProfile = async (userId: string) => {
    setProfileLoading(true);
    try {
      const p = await api.getCitizenProfile(userId);
      setSelectedCitizenProfile(p);
    } catch (e: any) {
      alert(e.message || 'Failed to fetch citizen profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const filteredCitizens = citizens.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.mobile && c.mobile.includes(search)) ||
      (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-200 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold tracking-widest uppercase bg-blue-950 text-amber-400 px-2 py-0.5 rounded border border-amber-400/30">
              Admin Governance
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-600 font-semibold">Citizen Master Register</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-blue-950 tracking-tight">
            Citizen Management &amp; Profiles
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Comprehensive directory of registered citizens, verification status, and completion levels.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by name, mobile, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs w-64 focus:outline-none focus:ring-2 focus:ring-blue-900"
            />
          </div>
          <Link
            to="/admin/dashboard"
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg text-xs transition-colors border border-slate-300 shadow-sm"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>

      {/* Citizens Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-blue-900 mb-2" />
            Loading Citizen Directory...
          </div>
        ) : filteredCitizens.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No citizens found matching "{search}".
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/75 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3 pl-5">Citizen Name</th>
                  <th className="p-3">Mobile &amp; Email</th>
                  <th className="p-3">Account Status</th>
                  <th className="p-3">Profile Completion</th>
                  <th className="p-3">Passport Attached?</th>
                  <th className="p-3">Registered Date</th>
                  <th className="p-3 text-right pr-5">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCitizens.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50">
                    <td className="p-3 pl-5 font-bold text-slate-900">
                      {c.name}
                    </td>
                    <td className="p-3 font-mono text-slate-600">
                      <div>{c.mobile || 'N/A'}</div>
                      <div className="text-[11px] text-slate-400">{c.email || 'N/A'}</div>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          c.registration_status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : c.registration_status === 'PENDING'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {c.registration_status}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-slate-200 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              c.profile_completion_percentage >= 80
                                ? 'bg-emerald-600'
                                : c.profile_completion_percentage >= 50
                                ? 'bg-amber-500'
                                : 'bg-blue-600'
                            }`}
                            style={{ width: `${c.profile_completion_percentage}%` }}
                          />
                        </div>
                        <span className="font-mono text-[11px] font-bold text-slate-700">
                          {c.profile_completion_percentage}%
                        </span>
                      </div>
                    </td>
                    <td className="p-3">
                      {c.has_passport ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <Award className="w-3 h-3 text-amber-500" />
                          Attached
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">None</span>
                      )}
                    </td>
                    <td className="p-3 text-slate-500 text-[11px]">
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-3 text-right pr-5">
                      <button
                        onClick={() => handleViewProfile(c.id)}
                        className="px-3 py-1 bg-blue-950 hover:bg-blue-900 text-white font-bold rounded text-xs transition-colors shadow-sm"
                      >
                        View Full Profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Citizen Profile Detail Modal */}
      {selectedCitizenProfile && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
              <div>
                <h3 className="text-lg font-bold text-blue-950">
                  {selectedCitizenProfile.legal_name || 'Resident Profile'}
                </h3>
                <span className="text-xs text-slate-500 font-mono">User ID: {selectedCitizenProfile.user_id}</span>
              </div>
              <button
                onClick={() => setSelectedCitizenProfile(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Grid */}
            <div className="space-y-6 text-xs">
              {/* Personal Section */}
              <div>
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px] mb-2 text-blue-900">
                  Personal &amp; Demographics
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div>
                    <span className="text-slate-400 block text-[10px]">DOB</span>
                    <strong>{selectedCitizenProfile.date_of_birth || 'N/A'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Calculated Age</span>
                    <strong>{selectedCitizenProfile.age ? `${selectedCitizenProfile.age} yrs` : 'N/A'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Gender</span>
                    <strong>{selectedCitizenProfile.gender || 'N/A'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Marital Status</span>
                    <strong>{selectedCitizenProfile.marital_status || 'N/A'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Community / Caste</span>
                    <strong>{selectedCitizenProfile.community_caste || 'N/A'}</strong>
                  </div>
                </div>
              </div>

              {/* Address Section */}
              <div>
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px] mb-2 text-blue-900">
                  Address &amp; Geography
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div>
                    <span className="text-slate-400 block text-[10px]">State</span>
                    <strong>{selectedCitizenProfile.state || 'Maharashtra'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">District</span>
                    <strong>{selectedCitizenProfile.district || 'N/A'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Division / Taluk</span>
                    <strong>{selectedCitizenProfile.division || selectedCitizenProfile.taluk || 'N/A'}</strong>
                  </div>
                  <div className="col-span-2 sm:col-span-3">
                    <span className="text-slate-400 block text-[10px]">Full Registered Address</span>
                    <strong>{selectedCitizenProfile.full_address || 'N/A'}</strong>
                  </div>
                </div>
              </div>

              {/* Identity & Banking */}
              <div>
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px] mb-2 text-blue-900">
                  Identity &amp; Direct Benefit Banking
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Aadhaar Masked</span>
                    <strong className="font-mono">
                      {selectedCitizenProfile.aadhaar_last_four ? `•••• •••• ${selectedCitizenProfile.aadhaar_last_four}` : 'N/A'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">PAN Number</span>
                    <strong className="font-mono">{selectedCitizenProfile.pan_number || 'N/A'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Bank</span>
                    <strong>{selectedCitizenProfile.bank_name || 'N/A'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Account Masked</span>
                    <strong className="font-mono">{selectedCitizenProfile.account_number_masked || 'N/A'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">IFSC</span>
                    <strong className="font-mono">{selectedCitizenProfile.ifsc || 'N/A'}</strong>
                  </div>
                </div>
              </div>

              {/* Passport Document */}
              {selectedCitizenProfile.passport_download_url && (
                <div>
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px] mb-2 text-blue-900">
                    Attached Verifiable Document
                  </h4>
                  <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-amber-600" />
                      <span className="font-semibold text-blue-950">
                        {selectedCitizenProfile.passport_document_url}
                      </span>
                    </div>
                    <a
                      href={selectedCitizenProfile.passport_download_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 bg-blue-950 text-white rounded font-bold text-xs"
                    >
                      Download PDF
                    </a>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedCitizenProfile(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
