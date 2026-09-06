'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { useLanguage } from '@/lib/i18n/useLanguage';
import { useAppStore } from '@/lib/store';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Award,
  Building2,
  BadgeIndianRupee,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

const INDIAN_STATES_AND_UTS = [
  'Andaman and Nicobar Islands',
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chandigarh',
  'Chhattisgarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jammu and Kashmir',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Ladakh',
  'Lakshadweep',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Puducherry',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
];

export default function ProfilePage() {
  const { t, language, setLanguage } = useLanguage();
  const { user, business, setProfile } = useAppStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; isError: boolean } | null>(null);

  // Form state spanning all 5 profile dimensions
  const [form, setForm] = useState({
    // 1. Identity & Demographics
    name: '',
    email: '',
    phone: '',
    age: '',
    gender: '',
    socialCategory: '',
    isDifferentlyAbled: false,
    isExServiceman: false,
    language: 'en',

    // 2. Location
    state: '',
    district: '',
    lgdDistrictCode: '',
    isRural: null as boolean | null,

    // 3. Special Beneficiary Status
    isTraditionalArtisan: false,
    isStreetVendor: false,
    isStartup: false,

    // 4. Enterprise Profile
    sector: '',
    businessType: '',
    activity: '',
    stage: '',
    isNewBusiness: null as boolean | null,

    // 5. Financial Profile
    projectCost: '',
    requestedFinancing: '',
    promoterContribution: '',
    annualIncome: '',
    annualTurnover: '',
    monthlyIncome: '',
    monthlyExpenses: '',
    existingDebt: '',
    existingMonthlyEmi: '',
  });

  // Fetch saved canonical profile on mount
  useEffect(() => {
    fetch('/api/user/profile')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setProfile(data.user, data.business || null);
          setForm({
            name: data.user.name || '',
            email: data.user.email || '',
            phone: data.user.phone || '',
            age: data.user.age != null ? data.user.age.toString() : '',
            gender: data.user.gender || '',
            socialCategory: data.user.socialCategory || '',
            isDifferentlyAbled: Boolean(data.user.isDifferentlyAbled),
            isExServiceman: Boolean(data.user.isExServiceman),
            language: data.user.language || 'en',

            state: data.user.state || '',
            district: data.user.district || '',
            lgdDistrictCode: data.user.lgdDistrictCode || '',
            isRural: data.user.isRural != null ? data.user.isRural : null,

            isTraditionalArtisan: Boolean(data.user.isTraditionalArtisan),
            isStreetVendor: Boolean(data.user.isStreetVendor),
            isStartup: Boolean(data.user.isStartup),

            sector: data.business?.sector || '',
            businessType: data.business?.type || '',
            activity: data.business?.activity || '',
            stage: data.business?.stage || '',
            isNewBusiness: data.business?.isNewBusiness != null ? data.business.isNewBusiness : null,

            projectCost: data.business?.projectCost != null ? data.business.projectCost.toString() : (data.business?.estimatedCapital ? data.business.estimatedCapital.toString() : ''),
            requestedFinancing: data.business?.requestedFinancing != null ? data.business.requestedFinancing.toString() : '',
            promoterContribution: data.business?.promoterContribution != null ? data.business.promoterContribution.toString() : '',
            annualIncome: data.business?.annualIncome != null ? data.business.annualIncome.toString() : '',
            annualTurnover: data.business?.annualTurnover != null ? data.business.annualTurnover.toString() : '',
            monthlyIncome: data.business?.monthlyIncome != null ? data.business.monthlyIncome.toString() : '',
            monthlyExpenses: data.business?.monthlyExpenses != null ? data.business.monthlyExpenses.toString() : '',
            existingDebt: data.business?.existingDebt != null ? data.business.existingDebt.toString() : '',
            existingMonthlyEmi: data.business?.existingMonthlyEmi != null ? data.business.existingMonthlyEmi.toString() : '',
          });
        }
      })
      .catch((err) => console.warn('Could not load profile:', err))
      .finally(() => setLoading(false));
  }, [setProfile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);

    // Basic frontend input integrity checks
    if (form.age && (parseInt(form.age) < 14 || parseInt(form.age) > 120)) {
      setMsg({ text: 'Age must be between 14 and 120 years.', isError: true });
      setSaving(false);
      return;
    }

    try {
      const payload = {
        name: form.name.trim() || undefined,
        email: form.email.trim() || null,
        age: form.age ? parseInt(form.age) : null,
        language: form.language,
        state: form.state.trim() || undefined,
        district: form.district.trim() || undefined,
        lgdDistrictCode: form.lgdDistrictCode.trim() || null,
        isRural: form.isRural,
        gender: form.gender || null,
        socialCategory: form.socialCategory || null,
        isDifferentlyAbled: form.isDifferentlyAbled,
        isExServiceman: form.isExServiceman,
        isTraditionalArtisan: form.isTraditionalArtisan,
        isStreetVendor: form.isStreetVendor,
        isStartup: form.isStartup,

        // Enterprise attributes
        sector: form.sector || null,
        businessType: form.businessType.trim() || null,
        type: form.businessType.trim() || undefined,
        activity: form.activity.trim() || null,
        stage: form.stage || null,
        isNewBusiness: form.isNewBusiness,

        // Financial attributes (preserve null if empty string)
        projectCost: form.projectCost !== '' ? parseFloat(form.projectCost) : null,
        requestedFinancing: form.requestedFinancing !== '' ? parseFloat(form.requestedFinancing) : null,
        promoterContribution: form.promoterContribution !== '' ? parseFloat(form.promoterContribution) : null,
        annualIncome: form.annualIncome !== '' ? parseFloat(form.annualIncome) : null,
        annualTurnover: form.annualTurnover !== '' ? parseFloat(form.annualTurnover) : null,
        monthlyIncome: form.monthlyIncome !== '' ? parseFloat(form.monthlyIncome) : null,
        monthlyExpenses: form.monthlyExpenses !== '' ? parseFloat(form.monthlyExpenses) : null,
        existingDebt: form.existingDebt !== '' ? parseFloat(form.existingDebt) : null,
        existingMonthlyEmi: form.existingMonthlyEmi !== '' ? parseFloat(form.existingMonthlyEmi) : null,
      };

      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update profile');

      setProfile(data.user, data.business);
      if (data.user.language) setLanguage(data.user.language as any);
      setMsg({ text: 'Authoritative profile updated successfully! All engines will use these saved parameters.', isError: false });
    } catch (err: any) {
      setMsg({ text: `Error: ${err.message}`, isError: true });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-8">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <Navbar />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar />

        <main className="flex-1 p-6 space-y-6">
          
          {/* Header Banner */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-slate-900">Entrepreneur & Enterprise Profile</h1>
              <p className="text-xs text-slate-500 mt-1">
                Your single authoritative profile used across statutory eligibility evaluation, recommendation scoring, and financial structuring.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Language:</span>
              <button
                type="button"
                onClick={() => setForm({ ...form, language: 'en' })}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                  form.language === 'en' ? 'bg-emerald-700 text-white border-emerald-700' : 'bg-slate-50 text-slate-600 border-slate-200'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, language: 'hi' })}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                  form.language === 'hi' ? 'bg-emerald-700 text-white border-emerald-700' : 'bg-slate-50 text-slate-600 border-slate-200'
                }`}
              >
                हिन्दी
              </button>
            </div>
          </div>

          {msg && (
            <div
              className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2.5 ${
                msg.isError ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              }`}
            >
              {msg.isError ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
              <span>{msg.text}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-6">
            
            {/* 1. Identity & Demographics */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <User className="w-5 h-5 text-emerald-600" />
                <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">1. Identity & Demographics</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Legal Name</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Enter full legal name"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Phone (Registered)</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      disabled
                      value={form.phone}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium bg-slate-50 text-slate-500 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="Optional email"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Applicant Age (Years)</label>
                  <input
                    type="number"
                    min={14}
                    max={120}
                    value={form.age}
                    onChange={(e) => setForm({ ...form, age: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. 28"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Gender</label>
                  <select
                    value={form.gender}
                    onChange={(e) => setForm({ ...form, gender: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="">-- Select Gender --</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Transgender / Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Social Category</label>
                  <select
                    value={form.socialCategory}
                    onChange={(e) => setForm({ ...form, socialCategory: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="">-- Select Social Category --</option>
                    <option value="General">General</option>
                    <option value="OBC">OBC (Other Backward Class)</option>
                    <option value="SC">SC (Scheduled Caste)</option>
                    <option value="ST">ST (Scheduled Tribe)</option>
                    <option value="Minority">Minority Community</option>
                  </select>
                </div>
              </div>

              {/* Special Demographic Flags */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <label className="flex items-center gap-3 p-3 rounded-2xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={form.isDifferentlyAbled}
                    onChange={(e) => setForm({ ...form, isDifferentlyAbled: e.target.checked })}
                    className="w-4 h-4 accent-emerald-600 rounded"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Differently Abled (PwD)</span>
                    <span className="text-[11px] text-slate-500">Qualifies for specialized concessionary subsidies and quotas</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-2xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={form.isExServiceman}
                    onChange={(e) => setForm({ ...form, isExServiceman: e.target.checked })}
                    className="w-4 h-4 accent-emerald-600 rounded"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Ex-Serviceman</span>
                    <span className="text-[11px] text-slate-500">Qualifies for defense rehabilitation credit schemes</span>
                  </div>
                </label>
              </div>
            </div>

            {/* 2. Geographic Location */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <MapPin className="w-5 h-5 text-emerald-600" />
                <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">2. Geographic Location</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">State / Union Territory</label>
                  <select
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="">-- Select State / UT --</option>
                    {INDIAN_STATES_AND_UTS.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">District Name</label>
                  <input
                    type="text"
                    value={form.district}
                    onChange={(e) => setForm({ ...form, district: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Enter district (e.g. Pune, Varanasi)"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">LGD District Code (Optional)</label>
                  <input
                    type="text"
                    value={form.lgdDistrictCode}
                    onChange={(e) => setForm({ ...form, lgdDistrictCode: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. 194"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jurisdiction Area</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, isRural: form.isRural === true ? null : true })}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-colors ${
                        form.isRural === true ? 'bg-emerald-700 text-white border-emerald-700' : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      Rural
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, isRural: form.isRural === false ? null : false })}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-colors ${
                        form.isRural === false ? 'bg-emerald-700 text-white border-emerald-700' : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      Urban
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Special Beneficiary Status */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Award className="w-5 h-5 text-emerald-600" />
                <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">3. Statutory Beneficiary Classifications</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={form.isTraditionalArtisan}
                    onChange={(e) => setForm({ ...form, isTraditionalArtisan: e.target.checked })}
                    className="w-4 h-4 accent-emerald-600 rounded mt-0.5"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Traditional Artisan / Craftsperson</span>
                    <span className="text-[11px] text-slate-500">Carpenter, blacksmith, potter, weaver, tailor, etc. (PM Vishwakarma statutory gate)</span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={form.isStreetVendor}
                    onChange={(e) => setForm({ ...form, isStreetVendor: e.target.checked })}
                    className="w-4 h-4 accent-emerald-600 rounded mt-0.5"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Street Vendor / Informal Merchant</span>
                    <span className="text-[11px] text-slate-500">Engaged in vending goods, food, or petty services (PM SVANidhi statutory gate)</span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={form.isStartup}
                    onChange={(e) => setForm({ ...form, isStartup: e.target.checked })}
                    className="w-4 h-4 accent-emerald-600 rounded mt-0.5"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Recognized Tech / Innovation Startup</span>
                    <span className="text-[11px] text-slate-500">DPIIT recognized entity exploring venture capital and seed credit guarantees</span>
                  </div>
                </label>
              </div>
            </div>

            {/* 4. Enterprise Profile */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Building2 className="w-5 h-5 text-emerald-600" />
                <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">4. Enterprise & Business Profile</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Primary Sector</label>
                  <select
                    value={form.sector}
                    onChange={(e) => setForm({ ...form, sector: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="">-- Select Canonical Sector --</option>
                    <option value="Manufacturing">Manufacturing</option>
                    <option value="Services">Services</option>
                    <option value="Trading">Trading</option>
                    <option value="Agriculture">Agriculture & Allied</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Business Trade / Title</label>
                  <input
                    type="text"
                    value={form.businessType}
                    onChange={(e) => setForm({ ...form, businessType: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. Dairy Farming, Agro-Processing"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Specific Operational Activity</label>
                  <input
                    type="text"
                    value={form.activity}
                    onChange={(e) => setForm({ ...form, activity: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. Milk Chilling & Pasteurization"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Business Stage</label>
                  <select
                    value={form.stage}
                    onChange={(e) => setForm({ ...form, stage: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="">-- Select Stage --</option>
                    <option value="Idea / Pre-Venture">Idea / Pre-Venture</option>
                    <option value="Early Stage">Early Stage</option>
                    <option value="Operational">Operational / Established</option>
                    <option value="Expansion">Expansion / Scaling</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Enterprise Greenfield / Expansion Status</label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, isNewBusiness: form.isNewBusiness === true ? null : true })}
                      className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold border text-left transition-colors ${
                        form.isNewBusiness === true ? 'bg-emerald-700 text-white border-emerald-700' : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      New Business (Greenfield Venture)
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, isNewBusiness: form.isNewBusiness === false ? null : false })}
                      className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold border text-left transition-colors ${
                        form.isNewBusiness === false ? 'bg-emerald-700 text-white border-emerald-700' : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      Existing Enterprise (Expansion / Modernization)
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 5. Financial Profile */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <BadgeIndianRupee className="w-5 h-5 text-emerald-600" />
                <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">5. Financial & Capital Structuring Parameters</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Estimated Total Project Cost (₹)</label>
                  <input
                    type="number"
                    min={0}
                    step="1000"
                    value={form.projectCost}
                    onChange={(e) => setForm({ ...form, projectCost: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. 1000000"
                  />
                  <span className="text-[10px] text-slate-400">Total capex + initial opex needed</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Requested Loan / Financing (₹)</label>
                  <input
                    type="number"
                    min={0}
                    step="1000"
                    value={form.requestedFinancing}
                    onChange={(e) => setForm({ ...form, requestedFinancing: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. 750000"
                  />
                  <span className="text-[10px] text-slate-400">Desired bank loan or credit facility</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Promoter Own Contribution (₹)</label>
                  <input
                    type="number"
                    min={0}
                    step="1000"
                    value={form.promoterContribution}
                    onChange={(e) => setForm({ ...form, promoterContribution: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. 250000"
                  />
                  <span className="text-[10px] text-slate-400">Personal savings or family equity available</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Monthly Personal / Business Surplus (₹)</label>
                  <input
                    type="number"
                    min={0}
                    step="500"
                    value={form.monthlyIncome}
                    onChange={(e) => setForm({ ...form, monthlyIncome: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. 45000"
                  />
                  <span className="text-[10px] text-slate-400">Required for Debt-to-Income (DTI) assessment</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Monthly Operational Overhead (₹)</label>
                  <input
                    type="number"
                    min={0}
                    step="500"
                    value={form.monthlyExpenses}
                    onChange={(e) => setForm({ ...form, monthlyExpenses: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. 15000"
                  />
                  <span className="text-[10px] text-slate-400">Monthly household or recurring fixed costs</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Current Monthly Existing EMI (₹)</label>
                  <input
                    type="number"
                    min={0}
                    step="100"
                    value={form.existingMonthlyEmi}
                    onChange={(e) => setForm({ ...form, existingMonthlyEmi: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. 3500"
                  />
                  <span className="text-[10px] text-slate-400">Current loan repayments across all banks</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Annual Household Income (₹)</label>
                  <input
                    type="number"
                    min={0}
                    step="1000"
                    value={form.annualIncome}
                    onChange={(e) => setForm({ ...form, annualIncome: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. 360000"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Annual Business Turnover (₹)</label>
                  <input
                    type="number"
                    min={0}
                    step="1000"
                    value={form.annualTurnover}
                    onChange={(e) => setForm({ ...form, annualTurnover: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. 1500000"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Existing Outstanding Debt (₹)</label>
                  <input
                    type="number"
                    min={0}
                    step="1000"
                    value={form.existingDebt}
                    onChange={(e) => setForm({ ...form, existingDebt: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. 50000"
                  />
                </div>
              </div>
            </div>

            {/* Submit Bar */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="py-3 px-8 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition-all inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Save Canonical Profile</span>
              </button>
            </div>

          </form>
        </main>
      </div>
    </div>
  );
}
