'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { useLanguage } from '@/lib/i18n/useLanguage';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Building2,
  MapPin,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  ShieldCheck,
  FileText,
  Users,
  Briefcase,
  Layers,
  Calendar,
  CloudSun,
  IndianRupee,
  Cpu,
  Database,
  ExternalLink,
} from 'lucide-react';
import { DPRResponse, ComparableDistrictItem } from '@/lib/api-client';

const PROVENANCE_STYLES: Record<string, string> = {
  'USER PROVIDED': 'bg-blue-50 text-blue-700 border-blue-200',
  'GOVERNMENT / DATASET DERIVED': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'GOVERNMENT / PROGRAMME REQUIREMENT': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'MODELLED INDICATOR': 'bg-purple-50 text-purple-700 border-purple-200',
  'AI INTERPRETATION': 'bg-amber-50 text-amber-700 border-amber-200',
  'ILLUSTRATIVE ASSUMPTION': 'bg-orange-50 text-orange-700 border-orange-200',
  'BACKEND DETERMINISTIC CALCULATION': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'USER EDITED': 'bg-cyan-50 text-cyan-700 border-cyan-200',
};

function ProvenanceBadge({ tag }: { tag: string }) {
  const style = PROVENANCE_STYLES[tag] || 'bg-slate-100 text-slate-700 border-slate-200';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${style}`}>
      {tag}
    </span>
  );
}

const STEPS = [
  { id: 1, name: 'Overview', icon: Building2, desc: 'Enterprise & Promoter Profile' },
  { id: 2, name: 'Market', icon: Database, desc: 'District MSME & Nearest Neighbors' },
  { id: 3, name: 'Customers & Comp', icon: Users, desc: 'Segments & Competition Structure' },
  { id: 4, name: 'Business Model', icon: Briefcase, desc: 'Value Proposition & Revenue Streams' },
  { id: 5, name: 'Operations', icon: Layers, desc: 'Workflow & Machinery Plan' },
  { id: 6, name: 'Marketing', icon: TrendingUp, desc: 'Channels & Pricing Framework' },
  { id: 7, name: 'Govt Support', icon: ShieldCheck, desc: 'Statutory Schemes & Subsidies' },
  { id: 8, name: 'Financial Plan', icon: IndianRupee, desc: 'Capital Stack & Loan EMI' },
  { id: 9, name: 'Risk & Weather', icon: CloudSun, desc: 'Climate Impact & Mitigation' },
  { id: 10, name: 'Milestones', icon: Calendar, desc: 'Month 1-6 Implementation' },
  { id: 11, name: 'Review & DPR', icon: FileText, desc: 'Audit Trail & Full DPR Generation' },
];

function RebuiltDPRBuilderContent() {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [currentStep, setCurrentStep] = useState(1);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [generatingDPR, setGeneratingDPR] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Profile State
  const [form, setForm] = useState<{
    businessId: string;
    projectName: string;
    promoterName: string;
    businessType: string;
    subType: string;
    sector: string;
    activity: string;
    stage: string;
    experienceLevel: string;
    targetMarket: string;
    estimatedCapital: number | null;
    promoterContribution: string;
    currentIncome: number | null;
    existingDebt: number | null;
    districtName: string;
    stateName: string;
    locationType: string;
    category: string;
    gender: string;
    educationLevel: string;
    selectedProgramCode: string;
  }>({
    businessId: '',
    projectName: '',
    promoterName: '',
    businessType: '',
    subType: '',
    sector: '',
    activity: '',
    stage: '',
    experienceLevel: '5+ Years Experienced',
    targetMarket: 'Regional Wholesale & Direct Retail',
    estimatedCapital: null,
    promoterContribution: '',
    currentIncome: null,
    existingDebt: null,
    districtName: '',
    stateName: '',
    locationType: 'URBAN',
    category: 'GENERAL',
    gender: 'MALE',
    educationLevel: 'GRADUATE',
    selectedProgramCode: searchParams.get('programCode') || '',
  });

  const [hasSavedProfile, setHasSavedProfile] = useState<boolean | null>(null);

  // Generated DPR State
  const [dprResult, setDprResult] = useState<DPRResponse | null>(null);

  // User Qualitative Edits tracking
  const [qualitativeEdits, setQualitativeEdits] = useState<Record<string, string>>({});
  const [editedFields, setEditedFields] = useState<Set<string>>(new Set());

  // 1. Initial Load: Fetch saved user and business profile
  useEffect(() => {
    async function loadSavedProfile() {
      try {
        const res = await fetch('/api/user/profile');
        if (res.ok) {
          const data = await res.json();
          const u = data.user || {};
          const b = data.business || {};
          const hasBusinessData = Boolean(b && (b.id || b.type || b.sector || b.activity || b.projectCost));
          setHasSavedProfile(hasBusinessData);

          if (hasBusinessData) {
            setForm((prev) => {
              const bType = b.type || b.activity || b.sector || '';
              const sType = b.activity || b.description || '';
              const dName = u.district || b.district || '';
              const sName = u.state || b.state || '';
              const capital = b.projectCost != null ? Number(b.projectCost) : (b.estimatedCapital != null ? Number(b.estimatedCapital) : null);
              const income = b.monthlyIncome != null ? Number(b.monthlyIncome) * 12 : (b.annualTurnover != null ? Number(b.annualTurnover) : null);
              const debt = b.existingDebt != null ? Number(b.existingDebt) : null;
              return {
                ...prev,
                businessId: b.id || '',
                projectName: b.name || (bType ? `${bType} Enterprise` : prev.projectName),
                promoterName: u.name || prev.promoterName || 'Entrepreneur',
                businessType: bType || prev.businessType,
                subType: sType || prev.subType,
                sector: b.sector || prev.sector,
                activity: b.activity || prev.activity,
                stage: b.stage || (b.isNewBusiness === false ? 'Expansion' : 'Greenfield / New Venture'),
                districtName: dName || prev.districtName,
                stateName: sName || prev.stateName,
                locationType: b.isRural || u.isRural ? 'RURAL' : 'URBAN',
                category: u.socialCategory || u.category || prev.category,
                gender: u.gender || prev.gender,
                estimatedCapital: capital,
                promoterContribution: b.promoterContribution != null ? String(b.promoterContribution) : '',
                currentIncome: income,
                existingDebt: debt,
              };
            });
          }
        } else {
          setHasSavedProfile(false);
        }
      } catch (err) {
        console.warn('Could not load profile in DPR builder:', err);
        setHasSavedProfile(false);
      } finally {
        setLoadingProfile(false);
      }
    }
    loadSavedProfile();
  }, []);

  // Sync selectedProgramCode from URL searchParams if provided
  useEffect(() => {
    const code = searchParams.get('programCode');
    if (code) {
      setForm((prev) => ({ ...prev, selectedProgramCode: code }));
    }
  }, [searchParams]);

  // Fetch or trigger DPR synthesis
  const fetchDPR = async () => {
    setGeneratingDPR(true);
    setError(null);
    try {
      if (hasSavedProfile === false) {
        throw new Error('Complete Business Profile to generate a user-specific DPR.');
      }
      if (!form.districtName || !form.businessType) {
        throw new Error('Please ensure District and Business Type are configured in your Business Profile.');
      }
      if (form.estimatedCapital == null || form.estimatedCapital <= 0) {
        throw new Error('Please configure Total Project Cost / Estimated Capital in your Business Profile to generate a DPR.');
      }
      if (!form.selectedProgramCode) {
        throw new Error('Select a government programme to calculate programme-specific financing and generate the DPR.');
      }

      const payload = {
        project_name: form.projectName || `${form.businessType} Enterprise`,
        promoter_name: form.promoterName || 'Entrepreneur',
        business_type: form.businessType,
        sub_type: form.subType || form.activity,
        sector: form.sector || undefined,
        activity: form.activity || form.subType || undefined,
        stage: form.stage || undefined,
        target_market: form.targetMarket,
        experience_level: form.experienceLevel,
        estimated_capital: Number(form.estimatedCapital),
        user_promoter_contribution: form.promoterContribution ? Number(form.promoterContribution) : undefined,
        current_income: form.currentIncome != null ? Number(form.currentIncome) : undefined,
        existing_debt: form.existingDebt != null ? Number(form.existingDebt) : undefined,
        district_name: form.districtName,
        state_name: form.stateName,
        location_type: form.locationType,
        category: form.category,
        gender: form.gender,
        education_level: form.educationLevel,
        selected_program_code: form.selectedProgramCode,
        qualitative_overrides: qualitativeEdits,
      };

      const res = await fetch('/api/advisory/dpr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status} failed to generate DPR`);
      }

      const data: DPRResponse = await res.json();
      setDprResult(data);
    } catch (err: any) {
      console.error('DPR generation error:', err);
      setError(err.message || 'Error communicating with DPR engine');
    } finally {
      setGeneratingDPR(false);
    }
  };

  // Trigger initial DPR synthesis when entering review or clicking generate
  useEffect(() => {
    if (!dprResult && !generatingDPR && currentStep >= 2 && form.selectedProgramCode) {
      fetchDPR();
    }
  }, [currentStep, form.selectedProgramCode]);

  const handleQualitativeChange = (field: string, val: string) => {
    setQualitativeEdits((prev) => ({ ...prev, [field]: val }));
    setEditedFields((prev) => new Set(prev).add(field));
  };

  const getFieldProvenance = (field: string, defaultTag: string) => {
    return editedFields.has(field) ? 'USER EDITED' : defaultTag;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />

      <div className="flex-1 flex max-w-7xl w-full mx-auto p-4 md:p-6 gap-6">
        <Sidebar />

        <main className="flex-1 space-y-6">
          {/* Header Banner */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-600 text-white flex items-center justify-center shadow-md">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-slate-900">11-Step DPR & Market Advisory Builder</h1>
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                    Phase 8.1 Active
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Authoritative Consulting Workflow: Real Census + Nearest Neighbors + Statutory Structuring + Bank-Ready DPR.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={fetchDPR}
                disabled={generatingDPR}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow transition flex items-center gap-2"
              >
                {generatingDPR ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {dprResult ? 'Recalculate DPR' : 'Generate Intelligence'}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Stepper Navigation */}
          <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm overflow-x-auto">
            <div className="flex items-center justify-between min-w-[760px] gap-2">
              {STEPS.map((s) => {
                const Icon = s.icon;
                const active = currentStep === s.id;
                const completed = currentStep > s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setCurrentStep(s.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition text-left shrink-0 ${
                      active
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        : completed
                        ? 'text-slate-700 hover:bg-slate-100'
                        : 'text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                        active
                          ? 'bg-indigo-600 text-white'
                          : completed
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {completed ? '✓' : s.id}
                    </div>
                    <div>
                      <div className="leading-none">{s.name}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step Contents */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
            {/* ------------------------------------------------------------- */}
            {/* Step 1: Business Overview */}
            {/* ------------------------------------------------------------- */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Step 1: Business & Promoter Overview</h2>
                    <p className="text-xs text-slate-500">Authoritative parameters loaded directly from your verified Business Profile.</p>
                  </div>
                  <ProvenanceBadge tag="USER PROVIDED" />
                </div>

                {loadingProfile ? (
                  <div className="p-12 text-center bg-slate-50 rounded-2xl border border-slate-200">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-slate-600">Loading Business Profile...</p>
                  </div>
                ) : hasSavedProfile === false ? (
                  <div className="p-8 bg-amber-50 border border-amber-200 rounded-2xl text-center space-y-4">
                    <AlertCircle className="w-10 h-10 text-amber-600 mx-auto" />
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Complete Business Profile</h3>
                      <p className="text-sm text-slate-600 mt-1">
                        Complete Business Profile to generate a user-specific DPR.
                      </p>
                    </div>
                    <Link
                      href="/dashboard/profile"
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-xs"
                    >
                      <span>Set Up Business Profile</span>
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </div>
                ) : (
                  /* Single Source of Truth Summary Card */
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-indigo-600" />
                        <div>
                          <h3 className="text-xs font-bold text-slate-900">Using your saved Business Profile</h3>
                          <p className="text-[11px] text-slate-500">
                            Single source of truth. Downstream DPR generation uses these verified values without duplicate data entry.
                          </p>
                        </div>
                      </div>
                      <Link
                        href="/dashboard/profile"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-indigo-700 hover:bg-indigo-50 transition shadow-xs shrink-0"
                      >
                        <span>Edit Business Profile</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
                      <div className="p-3 bg-white rounded-xl border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">Business Domain</span>
                        <span className="text-sm font-black text-slate-900 mt-0.5 block truncate" title={form.businessType}>
                          {form.businessType || 'Not configured'}
                        </span>
                        <span className="text-[9px] text-indigo-600 font-semibold">USER PROVIDED</span>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">Activity / Sub-Type</span>
                        <span className="text-sm font-black text-slate-900 mt-0.5 block truncate" title={form.activity || form.subType}>
                          {form.activity || form.subType || 'General'}
                        </span>
                        <span className="text-[9px] text-indigo-600 font-semibold">USER PROVIDED</span>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">Sector</span>
                        <span className="text-sm font-black text-slate-900 mt-0.5 block truncate">
                          {form.sector || 'Manufacturing'}
                        </span>
                        <span className="text-[9px] text-indigo-600 font-semibold">USER PROVIDED</span>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">Enterprise Stage</span>
                        <span className="text-sm font-black text-slate-900 mt-0.5 block truncate">
                          {form.stage || 'Operational'}
                        </span>
                        <span className="text-[9px] text-indigo-600 font-semibold">USER PROVIDED</span>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">Total Project Cost</span>
                        <span className="text-sm font-black text-slate-900 mt-0.5 block">
                          {form.estimatedCapital != null ? `₹${Number(form.estimatedCapital).toLocaleString('en-IN')}` : 'Not specified in profile'}
                        </span>
                        <span className="text-[9px] text-indigo-600 font-semibold">USER PROVIDED</span>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">Promoter Contribution</span>
                        <span className="text-sm font-black text-slate-900 mt-0.5 block">
                          {form.promoterContribution ? `₹${Number(form.promoterContribution).toLocaleString('en-IN')}` : 'Not specified in profile'}
                        </span>
                        <span className="text-[9px] text-indigo-600 font-semibold">USER PROVIDED</span>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">Annual / Monthly Revenue</span>
                        <span className="text-sm font-black text-emerald-700 mt-0.5 block">
                          {form.currentIncome != null ? `₹${Number(form.currentIncome).toLocaleString('en-IN')}` : 'Not specified in profile'}
                        </span>
                        <span className="text-[9px] text-emerald-600 font-semibold">USER PROVIDED</span>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">Existing Debt</span>
                        <span className="text-sm font-black text-slate-800 mt-0.5 block">
                          {form.existingDebt != null ? `₹${Number(form.existingDebt).toLocaleString('en-IN')}` : 'None'}
                        </span>
                        <span className="text-[9px] text-indigo-600 font-semibold">USER PROVIDED</span>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-slate-200 col-span-2 sm:col-span-3 lg:col-span-4 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">Jurisdiction & Promoter</span>
                          <span className="text-xs font-bold text-slate-900 mt-0.5">
                            {form.promoterName} • {form.districtName}, {form.stateName}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                            {form.locationType}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                            {form.category} • {form.gender}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Page-Specific Formulation Decisions (Category B) */}
                <div className="space-y-4 pt-2">
                  {!form.selectedProgramCode && (
                    <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Please select a target government programme to structure your DPR.</span>
                      </div>
                      <Link
                        href="/advisory/financial"
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg transition shrink-0"
                      >
                        Select Programme
                      </Link>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-900 uppercase">Page-Specific Formulation Decisions</h3>
                    {form.selectedProgramCode && (
                      <Link
                        href="/advisory/financial"
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
                      >
                        Change Programme in Scheme Advisory &rarr;
                      </Link>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Target Government Assistance Programme</label>
                      <select
                        value={form.selectedProgramCode}
                        onChange={(e) => {
                          setForm({ ...form, selectedProgramCode: e.target.value });
                          setDprResult(null);
                        }}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-indigo-500 bg-white"
                      >
                        <option value="">-- Select a Government Programme --</option>
                        <option value="PMEGP_NEW">Prime Minister Employment Generation Programme (PMEGP)</option>
                        <option value="PMFME">PM Formalisation of Micro Food Processing Enterprises (PMFME)</option>
                        <option value="STANDUP_INDIA">Stand-Up India Scheme (SC/ST & Women)</option>
                        <option value="PM_MUDRA_KISHORE">Pradhan Mantri MUDRA Yojana (Kishore - ₹50k to ₹5L)</option>
                        <option value="PM_MUDRA_TARUN">Pradhan Mantri MUDRA Yojana (Tarun - ₹5L to ₹20L)</option>
                        <option value="CGTMSE">Credit Guarantee Fund Trust for Micro & Small Enterprises (CGTMSE)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Target Market Orientation</label>
                      <select
                        value={form.targetMarket}
                        onChange={(e) => setForm({ ...form, targetMarket: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-indigo-500 bg-white"
                      >
                        <option value="Regional Wholesale & Direct Retail">Regional Wholesale & Direct Retail</option>
                        <option value="Local Village / District Community">Local Village / District Community</option>
                        <option value="Statewide Commercial Distribution">Statewide Commercial Distribution</option>
                        <option value="National & Institutional Supply">National & Institutional Supply</option>
                        <option value="Export / International Trade">Export / International Trade</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Entrepreneur Experience Level</label>
                      <select
                        value={form.experienceLevel}
                        onChange={(e) => setForm({ ...form, experienceLevel: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-indigo-500 bg-white"
                      >
                        <option value="Beginner / Aspiring (< 1 Year)">Beginner / Aspiring (&lt; 1 Year)</option>
                        <option value="1-3 Years Developing Enterprise">1-3 Years Developing Enterprise</option>
                        <option value="5+ Years Experienced">5+ Years Experienced</option>
                        <option value="Master Craftsman / Industrialist">Master Craftsman / Industrialist</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Highest Education Qualification</label>
                      <select
                        value={form.educationLevel}
                        onChange={(e) => setForm({ ...form, educationLevel: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-indigo-500 bg-white"
                      >
                        <option value="UNDER_MATRIC">Under Matriculation</option>
                        <option value="10TH_PASS">10th Standard / Matriculate</option>
                        <option value="12TH_PASS">12th Standard / Higher Secondary</option>
                        <option value="GRADUATE">Graduate / Diploma</option>
                        <option value="POST_GRADUATE">Post-Graduate / Professional</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* Step 2: Market Intelligence & Nearest Neighbors */}
            {/* ------------------------------------------------------------- */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Step 2: District Market Intelligence & Nearest Neighbors</h2>
                    <p className="text-xs text-slate-500">Official PostgreSQL Udyam census & scikit-learn NearestNeighbors.</p>
                  </div>
                  <div className="flex gap-2">
                    <ProvenanceBadge tag="GOVERNMENT / DATASET DERIVED" />
                    <ProvenanceBadge tag="MODELLED INDICATOR" />
                  </div>
                </div>

                {dprResult?.market_analysis ? (
                  <div className="space-y-4">
                    {/* District Census Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="p-3 bg-slate-50 border rounded-xl">
                        <div className="text-[10px] text-slate-500 uppercase font-semibold">Total Registered MSMEs</div>
                        <div className="text-lg font-bold text-slate-900 mt-1">
                          {dprResult.market_analysis.total_msmes_in_district.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">PostgreSQL Udyam Census</div>
                      </div>

                      <div className="p-3 bg-slate-50 border rounded-xl">
                        <div className="text-[10px] text-slate-500 uppercase font-semibold">Micro Share %</div>
                        <div className="text-lg font-bold text-slate-900 mt-1">
                          {dprResult.market_analysis.micro_enterprise_share.toFixed(1)}%
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">Micro enterprise density</div>
                      </div>

                      <div className="p-3 bg-slate-50 border rounded-xl">
                        <div className="text-[10px] text-slate-500 uppercase font-semibold">KMeans Archetype</div>
                        <div className="text-xs font-bold text-indigo-700 mt-1 line-clamp-2">
                          {dprResult.market_analysis.cluster_archetype_label}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">scikit-learn (K=4)</div>
                      </div>

                      <div className="p-3 bg-slate-50 border rounded-xl">
                        <div className="text-[10px] text-slate-500 uppercase font-semibold">Market Indicator (MRI)</div>
                        <div className="text-lg font-bold text-emerald-700 mt-1">
                          {dprResult.market_analysis.market_research_indicator.toFixed(1)}/100
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">Multi-factor score</div>
                      </div>
                    </div>

                    {/* Nearest Neighbors Comparable Districts */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-bold text-slate-900 uppercase">
                          Nearest Neighbor Comparable Markets (scikit-learn NearestNeighbors)
                        </h3>
                        <span className="text-[10px] text-slate-500">Euclidean distance in 6-dimensional feature space</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {dprResult.market_analysis.comparable_districts?.map((d, i) => (
                          <div key={i} className="p-3 border border-slate-200 rounded-xl bg-white shadow-xs space-y-1 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900">
                                #{d.similarity_rank} {d.district_name}, {d.state_name}
                              </span>
                              <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                                Distance: {d.similarity_distance.toFixed(3)}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-600">
                              {d.total_msmes.toLocaleString()} MSMEs ({d.micro_share.toFixed(1)}% Micro, {d.small_medium_share.toFixed(1)}% SME)
                            </div>
                            <p className="text-[11px] text-slate-500 italic mt-1">{d.qualitative_observation}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    {generatingDPR ? 'Loading authoritative market intelligence...' : 'Click "Generate Intelligence" to compute.'}
                  </div>
                )}
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* Step 3: Customers & Competition */}
            {/* ------------------------------------------------------------- */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Step 3: Target Customers & Competitive Structure</h2>
                    <p className="text-xs text-slate-500">AI market synthesis grounded strictly in local census metrics.</p>
                  </div>
                  <ProvenanceBadge tag={getFieldProvenance('buying_behaviour_summary', 'AI INTERPRETATION')} />
                </div>

                {dprResult ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 border rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">Local Buying Behavior</span>
                        <ProvenanceBadge tag="AI INTERPRETATION" />
                      </div>
                      <textarea
                        rows={2}
                        value={qualitativeEdits.buying_behaviour_summary ?? dprResult.customer_segments.buying_behaviour_summary}
                        onChange={(e) => handleQualitativeChange('buying_behaviour_summary', e.target.value)}
                        className="w-full text-xs p-2 border rounded bg-white"
                      />
                    </div>

                    <div>
                      <h3 className="text-xs font-bold text-slate-900 uppercase mb-2">Customer Persona Segments</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {dprResult.customer_segments.customer_segments.map((seg, idx) => (
                          <div key={idx} className="p-3 border rounded-xl text-xs space-y-1 bg-white">
                            <div className="font-bold text-slate-900">{seg.segment}</div>
                            <div className="text-slate-600"><span className="font-medium">Need:</span> {seg.need}</div>
                            <div className="text-slate-600"><span className="font-medium">Buying Factor:</span> {seg.buying_consideration}</div>
                            <div className="text-slate-500 text-[11px]"><span className="font-medium">Channel:</span> {seg.recommended_channel}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 border rounded-xl bg-slate-50 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">
                          Competition Intensity: <span className="text-indigo-700">{dprResult.competition.competition_intensity}</span>
                        </span>
                        <ProvenanceBadge tag="MODELLED INDICATOR" />
                      </div>
                      <p className="text-xs text-slate-600">{dprResult.competition.competition_rationale}</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-500 text-xs">Computing customer segments...</div>
                )}
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* Step 4: Business Model */}
            {/* ------------------------------------------------------------- */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Step 4: Business Model & Value Proposition</h2>
                    <p className="text-xs text-slate-500">Value delivery, core revenue streams, and key commercial partners.</p>
                  </div>
                  <ProvenanceBadge tag={getFieldProvenance('value_proposition', 'AI INTERPRETATION')} />
                </div>

                {dprResult ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Core Value Proposition</label>
                      <textarea
                        rows={2}
                        value={qualitativeEdits.value_proposition ?? dprResult.business_model.value_proposition}
                        onChange={(e) => handleQualitativeChange('value_proposition', e.target.value)}
                        className="w-full text-xs p-2 border rounded bg-white"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3 border rounded-xl space-y-2">
                        <span className="text-xs font-bold text-slate-900">Primary Revenue Streams</span>
                        <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                          {dprResult.business_model.revenue_streams.map((r, i) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-3 border rounded-xl space-y-2">
                        <span className="text-xs font-bold text-slate-900">Key Commercial Partners</span>
                        <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                          {dprResult.business_model.key_partners.map((p, i) => (
                            <li key={i}>{p}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-500 text-xs">Computing business model...</div>
                )}
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* Step 5: Operations Plan */}
            {/* ------------------------------------------------------------- */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Step 5: Operations & Production Plan</h2>
                    <p className="text-xs text-slate-500">Domain-tailored workflow, equipment requirements, and workforce plan.</p>
                  </div>
                  <ProvenanceBadge tag="AI INTERPRETATION" />
                </div>

                {dprResult ? (
                  <div className="space-y-4">
                    <div className="p-4 border rounded-xl bg-slate-50">
                      <h3 className="text-xs font-bold text-slate-900 mb-2">5-Stage Operational Workflow</h3>
                      <div className="space-y-2">
                        {dprResult.operations_plan.workflow_steps.map((w, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs text-slate-700">
                            <span className="font-bold text-indigo-600">Stage {i + 1}:</span>
                            <span>{w}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3 border rounded-xl space-y-2">
                        <span className="text-xs font-bold text-slate-900">Machinery & Equipment</span>
                        <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                          {dprResult.operations_plan.key_machinery_equipment.map((m, i) => (
                            <li key={i}>{m}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-3 border rounded-xl space-y-2">
                        <span className="text-xs font-bold text-slate-900">Workforce Organization</span>
                        <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                          {dprResult.operations_plan.workforce_roles.map((r, i) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-500 text-xs">Computing operations plan...</div>
                )}
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* Step 6: Marketing & Distribution */}
            {/* ------------------------------------------------------------- */}
            {currentStep === 6 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Step 6: Marketing, Distribution & Sales Strategy</h2>
                    <p className="text-xs text-slate-500">Positioning, structured channels, and defensible pricing model.</p>
                  </div>
                  <ProvenanceBadge tag="AI INTERPRETATION" />
                </div>

                {dprResult ? (
                  <div className="space-y-4">
                    <div className="p-4 border rounded-xl bg-slate-50 space-y-2">
                      <span className="text-xs font-bold text-slate-900">Strategic Positioning</span>
                      <textarea
                        rows={2}
                        value={qualitativeEdits.positioning_statement ?? dprResult.marketing_strategy.positioning_statement}
                        onChange={(e) => handleQualitativeChange('positioning_statement', e.target.value)}
                        className="w-full text-xs p-2 border rounded bg-white"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3 border rounded-xl space-y-2">
                        <span className="text-xs font-bold text-slate-900">Sales Channels</span>
                        <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                          {dprResult.marketing_strategy.sales_channels.map((c, i) => (
                            <li key={i}>{c}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-3 border rounded-xl space-y-2">
                        <span className="text-xs font-bold text-slate-900">Pricing Framework</span>
                        <p className="text-xs text-slate-600">{dprResult.marketing_strategy.pricing_framework}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-500 text-xs">Computing marketing strategy...</div>
                )}
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* Step 7: Government Support */}
            {/* ------------------------------------------------------------- */}
            {currentStep === 7 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Step 7: Government Scheme Support & Subsidy</h2>
                    <p className="text-xs text-slate-500">Statutory scheme rules from PostgreSQL and recommendation engine.</p>
                  </div>
                  <ProvenanceBadge tag="GOVERNMENT / DATASET DERIVED" />
                </div>

                <div className="p-4 border border-indigo-200 bg-indigo-50/50 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-indigo-950">
                        {dprResult?.government_support.program_name || form.selectedProgramCode}
                      </div>
                      <div className="text-xs text-indigo-700 font-mono">
                        Code: {dprResult?.government_support.program_code || form.selectedProgramCode}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-500">Eligible Subsidy</div>
                      <div className="text-lg font-extrabold text-emerald-700">
                        ₹{(dprResult?.government_support.eligible_subsidy_amount || 0).toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Rate: {dprResult?.government_support.eligible_subsidy_rate_pct || 0}%
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-slate-600">
                    <span className="font-semibold">Nodal Agency:</span> {dprResult?.government_support.nodal_agency || 'KVIC / DIC'}
                  </div>
                </div>

                {dprResult?.government_support.mandatory_statutory_conditions && (
                  <div className="p-3 border rounded-xl bg-slate-50 space-y-1 text-xs">
                    <span className="font-bold text-slate-900">Mandatory Statutory Conditions:</span>
                    <ul className="list-disc list-inside text-slate-600 space-y-1">
                      {dprResult.government_support.mandatory_statutory_conditions.map((cond, i) => (
                        <li key={i}>{cond}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* Step 8: Financial Plan */}
            {/* ------------------------------------------------------------- */}
            {currentStep === 8 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Step 8: Deterministic Capital Structure & Loan EMI</h2>
                    <p className="text-xs text-slate-500">Calculated directly by backend financial structuring engine.</p>
                  </div>
                  <ProvenanceBadge tag="BACKEND DETERMINISTIC CALCULATION" />
                </div>

                {dprResult ? (
                  <div className="space-y-4">
                    {/* Capital Breakdown Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                      <div className="p-3 bg-slate-50 border rounded-xl">
                        <div className="text-[10px] text-slate-500 uppercase font-semibold">Total Project Cost</div>
                        <div className="text-lg font-bold text-slate-900 mt-1">
                          ₹{dprResult.capital_structure.total_project_cost.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Total capital outlay</div>
                      </div>

                      <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl">
                        <div className="text-[10px] text-amber-800 uppercase font-semibold">User Promoter Equity</div>
                        {dprResult.capital_structure.user_promoter_contribution_amount != null ? (
                          <>
                            <div className="text-lg font-bold text-amber-900 mt-1">
                              ₹{dprResult.capital_structure.user_promoter_contribution_amount.toLocaleString()}
                            </div>
                            <div className="text-[10px] text-amber-700 font-medium mt-0.5">
                              {dprResult.capital_structure.user_promoter_contribution_pct != null
                                ? `${dprResult.capital_structure.user_promoter_contribution_pct}% profile equity`
                                : 'USER PROVIDED'}
                            </div>
                          </>
                        ) : (
                          <div className="text-[11px] text-amber-800 font-medium mt-1 leading-snug">
                            Not specified in Business Profile
                          </div>
                        )}
                        <div className="text-[9px] text-amber-700 font-semibold mt-0.5">USER PROVIDED</div>
                      </div>

                      <div className="p-3 bg-slate-50 border rounded-xl">
                        <div className="text-[10px] text-slate-500 uppercase font-semibold">Programme Margin Mandate</div>
                        {dprResult.capital_structure.promoter_equity_amount != null ? (
                          <>
                            <div className="text-lg font-bold text-blue-700 mt-1">
                              ₹{dprResult.capital_structure.promoter_equity_amount.toLocaleString()}
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              {dprResult.capital_structure.promoter_equity_pct != null
                                ? `${dprResult.capital_structure.promoter_equity_pct}% statutory margin`
                                : 'Mandatory margin'}
                            </div>
                          </>
                        ) : (
                          <div className="text-[10px] text-slate-600 font-medium mt-1 leading-snug">
                            Not specified by authoritative programme data
                          </div>
                        )}
                        <div className="text-[9px] text-slate-500 font-semibold mt-0.5">GOVERNMENT / DATASET DERIVED</div>
                      </div>

                      <div className="p-3 bg-slate-50 border rounded-xl">
                        <div className="text-[10px] text-slate-500 uppercase font-semibold">Net Bank Loan Exposure</div>
                        <div className="text-lg font-bold text-indigo-700 mt-1">
                          {dprResult.capital_structure.net_bank_loan_exposure != null
                            ? `₹${dprResult.capital_structure.net_bank_loan_exposure.toLocaleString()}`
                            : 'Not applicable'}
                        </div>
                        {dprResult.capital_structure.initial_bank_loan != null &&
                         dprResult.capital_structure.net_bank_loan_exposure != null &&
                         dprResult.capital_structure.initial_bank_loan !== dprResult.capital_structure.net_bank_loan_exposure && (
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            Gross loan: ₹{dprResult.capital_structure.initial_bank_loan.toLocaleString()}
                          </div>
                        )}
                        <div className="text-[9px] text-indigo-600 font-semibold mt-0.5">SCHEDULED BANK LOAN</div>
                      </div>

                      <div className="p-3 bg-slate-50 border rounded-xl col-span-2 sm:col-span-1">
                        <div className="text-[10px] text-slate-500 uppercase font-semibold">Monthly EMI (P+I)</div>
                        {dprResult.government_support.is_credit_linked && dprResult.financial_assumptions.annual_interest_rate_pct != null ? (
                          <>
                            <div className="text-lg font-bold text-emerald-700 mt-1">
                              ₹{dprResult.financial_assumptions.monthly_emi.toLocaleString()}
                            </div>
                            <div className="text-[10px] text-slate-600 mt-0.5">
                              {dprResult.financial_assumptions.loan_tenure_months} mos @ {dprResult.financial_assumptions.annual_interest_rate_pct}%
                              {dprResult.financial_assumptions.is_benchmark_assumption ? ' benchmark' : ''}
                            </div>
                            <div className="text-[9px] text-indigo-600 font-semibold mt-0.5 truncate">
                              {dprResult.financial_assumptions.rate_display_text || 'Market-linked'}
                            </div>
                          </>
                        ) : (
                          <div className="text-[11px] text-slate-500 font-medium mt-1 leading-snug">
                            Not applicable — programme is not credit-linked.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Component Allocation Note */}
                    <div className="p-2.5 bg-slate-50 border border-dashed rounded-xl text-xs flex items-center justify-between text-slate-600">
                      <span className="font-semibold text-[11px]">Term Loan / Working Capital Split:</span>
                      <span className="text-[11px] font-medium text-slate-700">
                        {dprResult.capital_structure.term_loan_amount != null && dprResult.capital_structure.working_capital_amount != null
                          ? `Term: ₹${dprResult.capital_structure.term_loan_amount.toLocaleString()} | WC: ₹${dprResult.capital_structure.working_capital_amount.toLocaleString()}`
                          : 'Not specified (component allocation determined upon bank sanction)'}
                      </span>
                    </div>

                    {/* Amortization Table */}
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 uppercase mb-2">Annual Debt Service Schedule</h3>
                      <div className="overflow-x-auto border rounded-xl">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-slate-100 text-slate-700 font-semibold border-b">
                            <tr>
                              <th className="p-2">Year</th>
                              <th className="p-2">Opening (₹)</th>
                              <th className="p-2">Principal Paid (₹)</th>
                              <th className="p-2">Interest Paid (₹)</th>
                              <th className="p-2">Annual Outflow (₹)</th>
                              <th className="p-2">Closing (₹)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {dprResult.financial_assumptions.amortization_schedule.map((row) => (
                              <tr key={row.year} className="hover:bg-slate-50">
                                <td className="p-2 font-bold text-slate-800">Year {row.year}</td>
                                <td className="p-2 font-mono">₹{row.opening_balance.toLocaleString()}</td>
                                <td className="p-2 font-mono text-indigo-600">₹{row.annual_principal.toLocaleString()}</td>
                                <td className="p-2 font-mono text-orange-600">₹{row.annual_interest.toLocaleString()}</td>
                                <td className="p-2 font-mono font-bold">₹{row.total_annual_payment.toLocaleString()}</td>
                                <td className="p-2 font-mono text-slate-600">₹{row.closing_balance.toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-500 text-xs">Computing financial assumptions...</div>
                )}
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* Step 9: Risk Analysis & Weather Signals */}
            {/* ------------------------------------------------------------- */}
            {currentStep === 9 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Step 9: Weather Activity Signals & Risk Analysis</h2>
                    <p className="text-xs text-slate-500">Transparent weather heuristics and operational contingency planning.</p>
                  </div>
                  <ProvenanceBadge tag="MODELLED INDICATOR" />
                </div>

                {dprResult ? (
                  <div className="space-y-4">
                    {/* Weather Activity Strip */}
                    <div className="p-4 bg-slate-50 border rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CloudSun className="w-8 h-8 text-indigo-600" />
                        <div>
                          <div className="text-xs font-bold text-slate-900">Indicative Weather Activity Impact</div>
                          <div className="text-[11px] text-slate-500">
                            Score: {dprResult.risk_analysis.weather_activity_impact_score ?? 'N/A'}/100 ({dprResult.risk_analysis.weather_activity_impact_label ?? 'Neutral'})
                          </div>
                        </div>
                      </div>
                      <div className="text-right text-[11px] text-slate-500">
                        <div>Heat Stress: <span className="font-semibold text-slate-800">{dprResult.risk_analysis.heat_stress_level ?? 'Low'}</span></div>
                        <div>Rain Disruption: <span className="font-semibold text-slate-800">{dprResult.risk_analysis.rain_disruption_level ?? 'None'}</span></div>
                      </div>
                    </div>

                    {/* Identified Risks Table */}
                    <div className="space-y-2">
                      <h3 className="text-xs font-bold text-slate-900 uppercase">Operational Risk Matrix</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {dprResult.risk_analysis.identified_risks.map((r, i) => (
                          <div key={i} className="p-3 border rounded-xl text-xs space-y-1 bg-white">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900">{r.risk}</span>
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${r.severity === 'High' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                {r.severity}
                              </span>
                            </div>
                            <p className="text-slate-600 text-[11px]">{r.mitigation}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-500 text-xs">Computing risk analysis...</div>
                )}
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* Step 10: Implementation Milestones */}
            {/* ------------------------------------------------------------- */}
            {currentStep === 10 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Step 10: Month 1-6 Implementation Schedule</h2>
                    <p className="text-xs text-slate-500">Practical commercial and operational rollout roadmap.</p>
                  </div>
                  <ProvenanceBadge tag="AI INTERPRETATION" />
                </div>

                {dprResult ? (
                  <div className="space-y-3">
                    {dprResult.implementation_plan.milestones.map((m) => (
                      <div key={m.phase_number} className="p-3 border rounded-xl flex items-start gap-3 bg-white">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                          M{m.phase_number}
                        </div>
                        <div className="flex-1 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">{m.month_range}: {m.activity}</span>
                            {m.provenance && <ProvenanceBadge tag={m.provenance} />}
                          </div>
                          <p className="text-slate-500 text-[11px] mt-0.5"><span className="font-semibold text-slate-700">Deliverable:</span> {m.critical_deliverable}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-500 text-xs">Computing milestones...</div>
                )}
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* Step 11: Review & Generate DPR */}
            {/* ------------------------------------------------------------- */}
            {currentStep === 11 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Step 11: Review & Complete Detailed Project Report</h2>
                    <p className="text-xs text-slate-500">Audit trail, provenance verification, and final document generation.</p>
                  </div>
                  <ProvenanceBadge tag="BACKEND DETERMINISTIC CALCULATION + AI INTERPRETATION" />
                </div>

                {dprResult ? (
                  <div className="space-y-6">
                    {/* Executive Summary Box */}
                    <div className="p-4 border rounded-xl bg-slate-50 space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold text-slate-900 uppercase">Executive Summary Narrative</h3>
                        <ProvenanceBadge tag={getFieldProvenance('executive_narrative', 'AI INTERPRETATION')} />
                      </div>
                      <textarea
                        rows={5}
                        value={qualitativeEdits.executive_narrative ?? dprResult.executive_summary.executive_narrative}
                        onChange={(e) => handleQualitativeChange('executive_narrative', e.target.value)}
                        className="w-full text-xs p-3 border rounded-lg bg-white leading-relaxed"
                      />
                    </div>

                    {/* Illustrative Operating Assumptions Disclaimer */}
                    <div className="p-4 border border-orange-200 bg-orange-50/60 rounded-xl text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-orange-950">Illustrative Operating Assumptions</span>
                        <ProvenanceBadge tag="ILLUSTRATIVE ASSUMPTION" />
                      </div>
                      <p className="text-orange-900 text-[11px] italic font-semibold">
                        "{dprResult.illustrative_assumptions.disclaimer}"
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-slate-700 text-[11px] pt-1">
                        <div>
                          <span className="font-semibold">Working Capital Cycle:</span>{' '}
                          {dprResult.illustrative_assumptions.working_capital_cycle_days != null
                            ? `${dprResult.illustrative_assumptions.working_capital_cycle_days} Days`
                            : 'Not calculated from available verified data.'}
                        </div>
                        <div><span className="font-semibold">Break-Even Point:</span> {dprResult.illustrative_assumptions.break_even_commentary}</div>
                      </div>
                    </div>

                    {/* Provenance Audit Legend */}
                    <div className="p-4 border rounded-xl bg-white space-y-3">
                      <h3 className="text-xs font-bold text-slate-900 uppercase">Provenance Audit Trail (6 Data Categories)</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {Object.entries(dprResult.provenance_legend).map(([key, desc]) => (
                          <div key={key} className="flex items-start gap-2 text-xs">
                            <ProvenanceBadge tag={key} />
                            <span className="text-[11px] text-slate-600">{desc}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Final Action Buttons */}
                    <div className="pt-4 border-t flex flex-col md:flex-row items-center justify-between gap-4">
                      <div className="text-xs text-slate-500">
                        Report ID: <span className="font-mono font-semibold text-slate-800">{dprResult.report_id}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => router.push(`/advisory/business-plan/${dprResult.report_id}`)}
                        className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-2"
                      >
                        <FileText className="w-4 h-4" />
                        Open Official Bank-Ready DPR View
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    <button
                      type="button"
                      onClick={fetchDPR}
                      disabled={generatingDPR}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold"
                    >
                      {generatingDPR ? 'Generating DPR...' : 'Generate Full DPR'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Stepper Footer Buttons */}
            <div className="flex items-center justify-between pt-4 border-t">
              <button
                type="button"
                disabled={currentStep === 1}
                onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
                className="px-4 py-2 border rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" /> Previous
              </button>

              {currentStep < 11 ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep((prev) => Math.min(11, prev + 1))}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow transition flex items-center gap-1"
                >
                  Next Step <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={fetchDPR}
                  disabled={generatingDPR}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow transition flex items-center gap-1"
                >
                  {generatingDPR ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Refresh Analysis
                </button>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function RebuiltDPRBuilderPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
            <span>Loading DPR Builder...</span>
          </div>
        </div>
      }
    >
      <RebuiltDPRBuilderContent />
    </Suspense>
  );
}
