import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import {
  User, MapPin, Shield, Users, Phone, GraduationCap,
  CreditCard, FileText, Upload, CheckCircle2, AlertCircle, Loader2, Save
} from 'lucide-react';

export const ResidentProfilePage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [activeSection, setActiveSection] = useState<'personal' | 'address' | 'identity' | 'family' | 'contact' | 'education' | 'banking' | 'documents'>('personal');

  // Form states
  const [profile, setProfile] = useState({
    legal_name: '',
    date_of_birth: '',
    age: null as number | null,
    gender: 'MALE',
    marital_status: 'SINGLE',
    community_caste: 'GENERAL',

    state: 'Maharashtra',
    district: '',
    city: '',
    division: '',
    taluk: '',
    zone: '',
    full_address: '',
    country: 'India',

    aadhaar_number: '',
    aadhaar_last_four: '',
    pan_number: '',
    passport_status: 'NOT_ISSUED',

    father_name: '',
    mother_name: '',
    spouse_name: '',
    guardian_name: '',

    phone: '',
    telephone: '',
    email: '',

    educational_qualification: 'GRADUATE',

    bank_name: '',
    account_number: '',
    account_number_masked: '',
    ifsc: '',

    passport_document_url: '',
    passport_download_url: ''
  });

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await api.getMyResidentProfile();
      setProfile(prev => ({
        ...prev,
        legal_name: data.legal_name || '',
        date_of_birth: data.date_of_birth || '',
        age: data.age,
        gender: data.gender || 'MALE',
        marital_status: data.marital_status || 'SINGLE',
        community_caste: data.community_caste || 'GENERAL',

        state: data.state || 'Maharashtra',
        district: data.district || '',
        city: data.city || '',
        division: data.division || '',
        taluk: data.taluk || '',
        zone: data.zone || '',
        full_address: data.full_address || '',
        country: data.country || 'India',

        aadhaar_last_four: data.aadhaar_last_four || '',
        pan_number: data.pan_number || '',
        passport_status: data.passport_status || 'NOT_ISSUED',

        father_name: data.father_name || '',
        mother_name: data.mother_name || '',
        spouse_name: data.spouse_name || '',
        guardian_name: data.guardian_name || '',

        phone: data.phone || '',
        telephone: data.telephone || '',
        email: data.email || '',

        educational_qualification: data.educational_qualification || 'GRADUATE',

        bank_name: data.bank_name || '',
        account_number_masked: data.account_number_masked || '',
        ifsc: data.ifsc || '',

        passport_document_url: data.passport_document_url || '',
        passport_download_url: data.passport_download_url || ''
      }));
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      const payload: any = { ...profile };
      if (!payload.aadhaar_number) delete payload.aadhaar_number;
      if (!payload.account_number) delete payload.account_number;

      const updated = await api.updateMyResidentProfile(payload);
      setProfile(prev => ({
        ...prev,
        ...updated,
        aadhaar_number: '',
        account_number: ''
      }));
      setSuccessMsg('Resident profile saved and encrypted successfully.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save profile changes');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);

    // 1. Client-side PDF check (Defense in depth)
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setUploadError('Invalid document format. Only PDF documents are allowed.');
      return;
    }

    // 2. Client-side 10 MB limit check
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setUploadError(`File exceeds the maximum permissible size of 10 MB (Selected: ${(file.size / (1024 * 1024)).toFixed(2)} MB).`);
      return;
    }

    setUploading(true);
    try {
      const res = await api.uploadPassportDocument(file);
      setProfile(prev => ({
        ...prev,
        passport_document_url: res.storage_path,
        passport_download_url: res.signed_url,
        passport_status: 'ACTIVE'
      }));
      setSuccessMsg('Passport document uploaded securely to private Firebase Storage.');
    } catch (err: any) {
      setUploadError(err.message || 'Upload rejected by server.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] text-slate-500 gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
        <p className="text-xs">Loading encrypted resident profile...</p>
      </div>
    );
  }

  const sections = [
    { id: 'personal', label: 'Personal', icon: User },
    { id: 'address', label: 'Address', icon: MapPin },
    { id: 'identity', label: 'Identity', icon: Shield },
    { id: 'family', label: 'Family', icon: Users },
    { id: 'contact', label: 'Contact', icon: Phone },
    { id: 'education', label: 'Education', icon: GraduationCap },
    { id: 'banking', label: 'Banking', icon: CreditCard },
    { id: 'documents', label: 'Passport PDF', icon: FileText },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#0f2942] to-[#1a446c] text-white rounded-2xl p-6 mb-6 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Citizen Master Profile
              </span>
              <span className="text-xs text-slate-300">| DPDP & Interoperability Compliant</span>
            </div>
            <h1 className="text-2xl font-bold">{profile.legal_name || 'Resident Profile'}</h1>
            <p className="text-xs text-slate-300 mt-1">
              Centralized demographic, identity, and socio-economic baseline for all Maharashtra schemes.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {profile.age !== null && (
              <div className="bg-white/10 px-3 py-1.5 rounded-xl text-center border border-white/10">
                <span className="block text-[10px] text-slate-300">Computed Age</span>
                <span className="text-sm font-bold text-amber-300">{profile.age} Years</span>
              </div>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-colors flex items-center gap-2 shadow"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>{saving ? 'Saving...' : 'Save Profile'}</span>
            </button>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-2 pb-2 mb-6 border-b border-slate-200 text-xs font-semibold scrollbar-none">
        {sections.map(s => {
          const Icon = s.icon;
          const isActive = activeSection === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id as any)}
              className={`px-3.5 py-2 rounded-xl flex items-center gap-1.5 shrink-0 transition-all ${
                isActive
                  ? 'bg-[#0f2942] text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{s.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content Form Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <form onSubmit={handleSave} className="space-y-6 text-xs">
          {/* Section 1: Personal */}
          {activeSection === 'personal' && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">Personal Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Full Legal Name</label>
                  <input
                    type="text"
                    value={profile.legal_name}
                    onChange={e => setProfile({ ...profile, legal_name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Date of Birth (YYYY-MM-DD)</label>
                  <input
                    type="date"
                    value={profile.date_of_birth}
                    onChange={e => setProfile({ ...profile, date_of_birth: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Gender</label>
                  <select
                    value={profile.gender}
                    onChange={e => setProfile({ ...profile, gender: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="TRANSGENDER">Transgender</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Marital Status</label>
                  <select
                    value={profile.marital_status}
                    onChange={e => setProfile({ ...profile, marital_status: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
                  >
                    <option value="SINGLE">Single</option>
                    <option value="MARRIED">Married</option>
                    <option value="DIVORCED">Divorced</option>
                    <option value="WIDOWED">Widowed</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Community / Caste Category</label>
                  <select
                    value={profile.community_caste}
                    onChange={e => setProfile({ ...profile, community_caste: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
                  >
                    <option value="GENERAL">General</option>
                    <option value="OBC">OBC (Other Backward Class)</option>
                    <option value="SC">SC (Scheduled Caste)</option>
                    <option value="ST">ST (Scheduled Tribe)</option>
                    <option value="EWS">EWS (Economically Weaker Section)</option>
                    <option value="VJNT">VJNT</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Section 2: Address */}
          {activeSection === 'address' && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">Residential Address</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">State</label>
                  <input
                    type="text"
                    value={profile.state}
                    onChange={e => setProfile({ ...profile, state: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">District</label>
                  <input
                    type="text"
                    placeholder="e.g. Pune, Nagpur, Nashik"
                    value={profile.district}
                    onChange={e => setProfile({ ...profile, district: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">City / Village</label>
                  <input
                    type="text"
                    value={profile.city}
                    onChange={e => setProfile({ ...profile, city: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Administrative Division</label>
                  <input
                    type="text"
                    placeholder="e.g. Pune Division, Konkan"
                    value={profile.division}
                    onChange={e => setProfile({ ...profile, division: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Taluk / Tehsil</label>
                  <input
                    type="text"
                    placeholder="e.g. Haveli, Baramati"
                    value={profile.taluk}
                    onChange={e => setProfile({ ...profile, taluk: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Zone / Ward</label>
                  <input
                    type="text"
                    placeholder="e.g. Zone 4"
                    value={profile.zone}
                    onChange={e => setProfile({ ...profile, zone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="block font-medium text-slate-700 mb-1">Full Postal Address</label>
                  <textarea
                    rows={2}
                    placeholder="House/Flat No., Street, Landmark, Pincode"
                    value={profile.full_address}
                    onChange={e => setProfile({ ...profile, full_address: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Section 3: Identity */}
          {activeSection === 'identity' && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">National Identity & Security</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Aadhaar Number (Masked at Rest)
                  </label>
                  <input
                    type="text"
                    placeholder={profile.aadhaar_last_four ? `XXXX-XXXX-${profile.aadhaar_last_four}` : "Enter 12-digit Aadhaar"}
                    value={profile.aadhaar_number}
                    onChange={e => setProfile({ ...profile, aadhaar_number: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Raw Aadhaar is hashed with SHA-256; only last 4 digits are retained for verification.
                  </p>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">PAN Number</label>
                  <input
                    type="text"
                    placeholder="ABCDE1234F"
                    value={profile.pan_number}
                    onChange={e => setProfile({ ...profile, pan_number: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Passport Status</label>
                  <select
                    value={profile.passport_status}
                    onChange={e => setProfile({ ...profile, passport_status: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
                  >
                    <option value="NOT_ISSUED">Not Issued</option>
                    <option value="APPLIED">Applied / In Verification</option>
                    <option value="ACTIVE">Active & Verified</option>
                    <option value="EXPIRED">Expired</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Section 4: Family */}
          {activeSection === 'family' && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">Family & Lineage</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Father's Name</label>
                  <input
                    type="text"
                    value={profile.father_name}
                    onChange={e => setProfile({ ...profile, father_name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Mother's Name</label>
                  <input
                    type="text"
                    value={profile.mother_name}
                    onChange={e => setProfile({ ...profile, mother_name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Spouse's Name (if married)</label>
                  <input
                    type="text"
                    value={profile.spouse_name}
                    onChange={e => setProfile({ ...profile, spouse_name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Legal Guardian Name (if applicable)</label>
                  <input
                    type="text"
                    value={profile.guardian_name}
                    onChange={e => setProfile({ ...profile, guardian_name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Section 5: Contact */}
          {activeSection === 'contact' && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">Contact Channels</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Primary Mobile Phone</label>
                  <input
                    type="text"
                    value={profile.phone}
                    onChange={e => setProfile({ ...profile, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Landline / Telephone</label>
                  <input
                    type="text"
                    placeholder="020-XXXXXXXX"
                    value={profile.telephone}
                    onChange={e => setProfile({ ...profile, telephone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={e => setProfile({ ...profile, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Section 6: Education */}
          {activeSection === 'education' && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">Educational Qualification</h2>
              <div className="max-w-md">
                <label className="block font-medium text-slate-700 mb-1">Highest Completed Qualification</label>
                <select
                  value={profile.educational_qualification}
                  onChange={e => setProfile({ ...profile, educational_qualification: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
                >
                  <option value="PRIMARY">Primary School (Class 1-5)</option>
                  <option value="MIDDLE">Middle School (Class 6-8)</option>
                  <option value="SSC">Secondary School Certificate (SSC - 10th)</option>
                  <option value="HSC">Higher Secondary Certificate (HSC - 12th)</option>
                  <option value="DIPLOMA">Polytechnic / Vocational Diploma</option>
                  <option value="GRADUATE">Undergraduate / Bachelor's Degree</option>
                  <option value="POST_GRADUATE">Postgraduate / Master's Degree</option>
                  <option value="DOCTORATE">Doctorate / Ph.D.</option>
                </select>
              </div>
            </div>
          )}

          {/* Section 7: Banking */}
          {activeSection === 'banking' && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">Direct Benefit Transfer (DBT) Banking Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Bank Name</label>
                  <input
                    type="text"
                    placeholder="e.g. State Bank of India, Bank of Maharashtra"
                    value={profile.bank_name}
                    onChange={e => setProfile({ ...profile, bank_name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Account Number (Masked)</label>
                  <input
                    type="text"
                    placeholder={profile.account_number_masked || "Enter Account Number"}
                    value={profile.account_number}
                    onChange={e => setProfile({ ...profile, account_number: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Stored securely masked (XXXX-XXXX-XXXX).
                  </p>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">IFSC Code</label>
                  <input
                    type="text"
                    placeholder="SBIN0001234"
                    value={profile.ifsc}
                    onChange={e => setProfile({ ...profile, ifsc: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Section 8: Documents / PDF Upload */}
          {activeSection === 'documents' && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">Private Document Vault (Firebase Storage)</h2>
              
              <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center bg-slate-50 hover:bg-slate-100/60 transition-colors">
                <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-800 text-sm">Upload Official Passport / Identity PDF</h3>
                <p className="text-slate-500 text-xs mt-1 max-w-sm mx-auto">
                  Only <strong>.pdf</strong> format is accepted. Maximum permissible file size is <strong>10 MB</strong>.
                  Files stream securely into your private Firebase Storage vault.
                </p>

                {uploadError && (
                  <div className="mt-3 p-2 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs max-w-md mx-auto">
                    {uploadError}
                  </div>
                )}

                <div className="mt-4">
                  <label className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs cursor-pointer shadow">
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4 text-amber-400" />}
                    <span>{uploading ? 'Validating & Uploading...' : 'Select PDF File'}</span>
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={handleFileUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {profile.passport_document_url && (
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 block text-xs">Passport Document Active in Vault</span>
                      <span className="text-[11px] font-mono text-slate-500">{profile.passport_document_url}</span>
                    </div>
                  </div>

                  {profile.passport_download_url && (
                    <a
                      href={profile.passport_download_url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-lg text-xs transition-colors"
                    >
                      View Signed Document
                    </a>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Bottom Save Bar */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-[#0f2942] hover:bg-[#163352] text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-2 shadow"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>{saving ? 'Saving Profile Changes...' : 'Save & Encrypt Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
