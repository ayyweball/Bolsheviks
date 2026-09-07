'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { useLanguage } from '@/lib/i18n/useLanguage';
import {
  BadgeIndianRupee,
  Building2,
  AlertCircle,
  AlertTriangle,
  ExternalLink,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Briefcase,
  MapPin,
  CheckCircle2,
  Check,
  UserCheck,
  Award,
  Sparkles,
  HelpCircle,
} from 'lucide-react';

function FinancialAdvisorForm() {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialProgramId = searchParams.get('programId');
  const initialProgramCode = searchParams.get('programCode');

  const [recommendedSchemes, setRecommendedSchemes] = useState<any[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [availablePrograms, setAvailablePrograms] = useState<any[]>([]);
  const [loadingPrograms, setLoadingPrograms] = useState(false);
  const [profileData, setProfileData] = useState<{ user: any; business: any } | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Page-specific decisions only (not stored in Business Profile)
  // NEVER AUTO-SELECT: initial selection comes ONLY from explicit URL param
  const [pageDecisions, setPageDecisions] = useState({
    programId: initialProgramId ? parseInt(initialProgramId) : (undefined as number | undefined),
    programCode: initialProgramCode || '',
    purpose: 'Equipment & Machinery Purchase',
    preferredTenure: 60,
    creditHistory: 'Good Track Record',
    collateralAvailable: ['None (Collateral-Free MUDRA Coverage)'],
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // 1. Fetch current saved Business Profile as single source of truth
  useEffect(() => {
    fetch('/api/user/profile')
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          setProfileData({ user: data.user || null, business: data.business || null });
        }
      })
      .catch((e) => console.warn('Could not load profile for financial advisor:', e))
      .finally(() => setLoadingProfile(false));
  }, []);

  // 2. Fetch authoritative recommendation output (FROZEN engine) to display recommended/eligible schemes
  useEffect(() => {
    setLoadingRecommendations(true);
    fetch('/api/advisory/schemes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.schemes && Array.isArray(data.schemes)) {
          setRecommendedSchemes(data.schemes);
        }
      })
      .catch((e) => console.warn('Could not load recommendations for financial selector:', e))
      .finally(() => setLoadingRecommendations(false));
  }, []);

  // 3. Fetch all 60 central programmes for comprehensive lookup / manual selection
  useEffect(() => {
    setLoadingPrograms(true);
    fetch('/api/schemes?limit=60')
      .then((res) => res.json())
      .then((data) => {
        if (data.programs) {
          setAvailablePrograms(data.programs);
          // INVARIANT: NEVER AUTO-SELECT data.programs[0]! User must explicitly select.
        }
      })
      .catch((e) => console.warn('Could not load programmes for selector:', e))
      .finally(() => setLoadingPrograms(false));
  }, []);

  const b = profileData?.business || {};
  const u = profileData?.user || {};

  const projectCost = b.projectCost || b.estimatedCapital || 0;
  const promoterContrib = b.promoterContribution != null ? Number(b.promoterContribution) : null;
  const promoterContribPct = (promoterContrib != null && projectCost > 0)
    ? Number(((promoterContrib / projectCost) * 100).toFixed(1))
    : null;
  const requestedFinancing = b.requestedFinancing || (projectCost > 0 && promoterContrib != null ? Math.max(0, projectCost - promoterContrib) : projectCost);
  const monthlyIncome = b.monthlyIncome || (b.annualIncome ? Math.round(b.annualIncome / 12) : 0);
  const monthlyExpenses = b.monthlyExpenses || 0;
  const existingDebt = b.existingDebt || 0;
  const existingMonthlyEmi = b.existingMonthlyEmi || 0;
  const businessType = b.type || 'Enterprise';
  const sector = b.sector || 'General';
  const district = u.district || '';
  const state = u.state || '';

  const isProfileComplete = projectCost > 0 && monthlyIncome > 0 && !!district;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    if (!pageDecisions.programId && !pageDecisions.programCode) {
      setError('Select a government programme to calculate programme-specific financing and generate the DPR.');
      setSubmitting(false);
      return;
    }

    if (projectCost <= 0) {
      setError('Total project cost greater than 0 is required. Please update your Business Profile.');
      setSubmitting(false);
      return;
    }

    if (monthlyIncome <= 0) {
      setError('A valid monthly disposable income greater than 0 is required for statutory debt serviceability evaluation. Please update your Business Profile.');
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/advisory/financial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: b.id || undefined,
          programId: pageDecisions.programId,
          programCode: pageDecisions.programCode || undefined,
          purpose: pageDecisions.purpose,
          preferredTenure: pageDecisions.preferredTenure,
          creditHistory: pageDecisions.creditHistory,
          collateralAvailable: pageDecisions.collateralAvailable,
          // Forward authoritative profile facts (no duplicate frontend calculations)
          projectCost,
          loanNeeded: requestedFinancing,
          promoterContribution: promoterContrib,
          monthlyIncome,
          monthlyExpenses,
          existingDebt,
          existingMonthlyEmi,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate financial advice');

      router.push(`/advisory/financial/${data.advisoryId}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedProgramObj = availablePrograms.find(
    (p) => (pageDecisions.programId && p.id === pageDecisions.programId) || (pageDecisions.programCode && p.program_code === pageDecisions.programCode)
  );

  const selectedSchemeMatch = recommendedSchemes.find(
    (item) => (pageDecisions.programId && item.scheme?.id === pageDecisions.programId) || (pageDecisions.programCode && item.scheme?.code === pageDecisions.programCode)
  );

  const selectedDisplayName = selectedProgramObj?.program_name || selectedSchemeMatch?.scheme?.name || pageDecisions.programCode;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <Navbar />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar />

        <main className="flex-1 p-6 space-y-6">
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            
            {/* Header */}
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 text-[11px] font-extrabold uppercase tracking-wider">
                  Step 2 • Financial Structuring & Debt Advisory
                </span>
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                  Zero Fabrication Engine
                </span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 mt-2">Structure Enterprise Financing</h1>
              <p className="text-xs text-slate-500 mt-1">
                Select an eligible government assistance programme. The authoritative financial engine evaluates the capital stack, margin requirement, subsidy, guarantee, DTI, and debt amortization.
              </p>
            </div>

            {error && (
              <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Business Profile Inputs (Single Source of Truth) */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-50/60 to-slate-50 border border-amber-200/80 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/60 pb-2">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-amber-700" />
                  <h3 className="text-xs font-extrabold text-slate-900">
                    Business Profile Inputs (Single Source of Truth)
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-black uppercase tracking-wider">
                    USER PROVIDED
                  </span>
                </div>
                <Link
                  href="/dashboard/profile"
                  className="text-xs font-bold text-amber-800 hover:text-amber-950 flex items-center gap-1 underline"
                >
                  <span>Edit these values in Business Profile</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {loadingProfile ? (
                <div className="flex items-center gap-2 text-xs text-slate-500 py-2">
                  <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                  <span>Loading authoritative Business Profile...</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
                  <div className="p-2.5 bg-white rounded-xl border border-amber-100">
                    <span className="text-[10px] text-slate-400 font-semibold block">Enterprise</span>
                    <strong className="text-slate-900 truncate block">{businessType}</strong>
                    <span className="text-[10px] text-slate-500">{sector}</span>
                  </div>

                  <div className="p-2.5 bg-white rounded-xl border border-amber-100">
                    <span className="text-[10px] text-slate-400 font-semibold block">Location</span>
                    <strong className="text-slate-900 truncate block">{district || 'Not specified'}</strong>
                    <span className="text-[10px] text-slate-500">{state || 'India'}</span>
                  </div>

                  <div className="p-2.5 bg-white rounded-xl border border-amber-100">
                    <span className="text-[10px] text-slate-400 font-semibold block">Project Cost</span>
                    <strong className="text-slate-900 block">
                      {projectCost > 0 ? `₹${projectCost.toLocaleString('en-IN')}` : 'Not set'}
                    </strong>
                    <span className="text-[10px] text-slate-500">Total Capital Outlay</span>
                  </div>

                  <div className="p-2.5 bg-white rounded-xl border border-amber-100">
                    <span className="text-[10px] text-slate-400 font-semibold block">User Promoter Equity</span>
                    <strong className="text-amber-900 block">
                      {promoterContrib != null ? `₹${promoterContrib.toLocaleString('en-IN')}` : 'Not specified'}
                    </strong>
                    <span className="text-[10px] text-amber-700">
                      {promoterContribPct != null ? `${promoterContribPct}% of Project Cost` : 'Stated in profile'}
                    </span>
                  </div>

                  <div className="p-2.5 bg-white rounded-xl border border-amber-100">
                    <span className="text-[10px] text-slate-400 font-semibold block">Monthly Cashflow</span>
                    <strong className="text-slate-900 block">
                      {monthlyIncome > 0 ? `₹${monthlyIncome.toLocaleString('en-IN')}` : 'Not set'}
                    </strong>
                    <span className="text-[10px] text-slate-500">
                      Expenses: ₹{monthlyExpenses.toLocaleString('en-IN')}/mo
                    </span>
                  </div>

                  <div className="p-2.5 bg-white rounded-xl border border-amber-100">
                    <span className="text-[10px] text-slate-400 font-semibold block">Existing Liabilities</span>
                    <strong className="text-slate-900 block">
                      {existingDebt > 0 ? `₹${existingDebt.toLocaleString('en-IN')}` : '₹0 (Debt-Free)'}
                    </strong>
                    <span className="text-[10px] text-slate-500">
                      EMI: ₹{existingMonthlyEmi.toLocaleString('en-IN')}/mo
                    </span>
                  </div>
                </div>
              )}
            </div>

            {!isProfileComplete && !loadingProfile && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2">
                <div className="font-bold flex items-center gap-1.5 text-amber-800">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  Action Required: Complete Business Profile Parameters
                </div>
                <p>
                  Statutory debt serviceability evaluation (FOIR / DSCR) and capital structuring require a verified Project Cost, Monthly Income, and District in your Business Profile.
                </p>
                <Link
                  href="/dashboard/profile"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition"
                >
                  <span>Open Business Profile</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}

            {/* PROGRAMME SELECTION SECTION */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-blue-600" />
                    <span>Target Government Assistance Programme</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Choose one statutory programme. The financial structure and DPR will be formulated strictly for your selected programme.
                  </p>
                </div>

                {/* Current Selection Status Banner */}
                {pageDecisions.programCode ? (
                  <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-extrabold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Selected: {pageDecisions.programCode}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>No Programme Selected</span>
                  </div>
                )}
              </div>

              {/* Status Notice if nothing selected */}
              {!pageDecisions.programCode && (
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2 font-semibold">
                    <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Select a government programme to calculate programme-specific financing and generate the DPR.</span>
                  </div>
                  <Link href="/advisory/schemes" className="underline font-bold hover:text-blue-950 shrink-0">
                    Compare All Schemes
                  </Link>
                </div>
              )}

              {/* Selected Programme Summary Card */}
              {pageDecisions.programCode && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-200">
                      Active Programme Selection
                    </span>
                    <h3 className="text-lg font-black text-white mt-0.5">
                      {selectedDisplayName} ({pageDecisions.programCode})
                    </h3>
                    <p className="text-xs text-blue-100 mt-0.5">
                      {selectedProgramObj?.benefit_summary || selectedSchemeMatch?.scheme?.description || 'Statutory credit and financial assistance structure.'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setPageDecisions((prev) => ({ ...prev, programId: undefined, programCode: '' }))}
                    className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 shrink-0 transition"
                  >
                    Change Selection
                  </button>
                </div>
              )}

              {/* Eligible & Recommended Programmes Cards */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    Recommended Programmes (from Statutory Evaluation)
                  </h3>
                  {loadingRecommendations && (
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Evaluating recommendations...
                    </span>
                  )}
                </div>

                {recommendedSchemes.length === 0 && !loadingRecommendations ? (
                  <div className="p-4 rounded-2xl bg-slate-50 border text-center text-xs text-slate-500">
                    No scored recommendations available yet. You can pick from the complete list of Central Government Programmes below.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {recommendedSchemes.slice(0, 4).map((item, idx) => {
                      const s = item.scheme;
                      const isSelected = pageDecisions.programCode === s.code;
                      const fitScore = Math.round(item.recommendationScore ?? item.approvalProbability ?? 80);
                      const fitCategory = (item.fitCategory || 'STRONG_FIT').replace(/_/g, ' ');

                      return (
                        <div
                          key={s.id || idx}
                          className={`p-4 rounded-2xl border-2 transition-all flex flex-col justify-between gap-3 ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50/40 shadow-sm'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-black uppercase font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                                {s.code}
                              </span>
                              <div className="flex items-center gap-1.5">
                                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold flex items-center gap-0.5">
                                  <Award className="w-3 h-3 text-emerald-700" />
                                  {fitCategory}: {fitScore}/100
                                </span>
                                {item.eligibilityStatus && (
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    item.eligibilityStatus === 'Eligible'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}>
                                    {item.eligibilityStatus}
                                  </span>
                                )}
                              </div>
                            </div>

                            <h4 className="text-sm font-black text-slate-900 leading-snug">{s.name}</h4>
                            <p className="text-[11px] text-slate-500 line-clamp-2">{s.description}</p>

                            <div className="flex items-center gap-2 pt-1 text-[10px] text-slate-600">
                              <span className="font-semibold bg-slate-100 px-2 py-0.5 rounded">
                                {s.primaryType || 'Credit Support'}
                              </span>
                              {item.recommendedAmount && (
                                <span className="text-emerald-700 font-bold">
                                  Target: ₹{item.recommendedAmount.toLocaleString('en-IN')}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="pt-2 border-t flex items-center justify-between gap-2">
                            <span className="text-[11px] text-slate-500">
                              {isSelected ? 'Currently Selected' : 'Statutory Recommendation'}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setPageDecisions((prev) => ({
                                  ...prev,
                                  programId: s.id,
                                  programCode: s.code,
                                }));
                              }}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                                isSelected
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                              }`}
                            >
                              {isSelected ? (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Selected</span>
                                </>
                              ) : (
                                <span>Select Programme</span>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Or Select from All 60 Central Programmes Dropdown */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Or Choose Any Other Central Government Programme:</span>
                  <span className="text-[10px] font-normal text-slate-400">Total 60 Programmes in PostgreSQL</span>
                </label>

                <select
                  value={pageDecisions.programId || (selectedProgramObj ? selectedProgramObj.id : '')}
                  onChange={(e) => {
                    const pid = parseInt(e.target.value);
                    const prog = availablePrograms.find((p) => p.id === pid);
                    if (prog) {
                      setPageDecisions((prev) => ({
                        ...prev,
                        programId: pid,
                        programCode: prog.program_code,
                      }));
                    }
                  }}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">
                    {loadingPrograms
                      ? 'Loading programmes...'
                      : pageDecisions.programCode
                      ? `Currently Selected: ${selectedDisplayName} (${pageDecisions.programCode})`
                      : 'Choose a programme from full central catalog...'}
                  </option>
                  {availablePrograms.map((prog) => (
                    <option key={prog.id} value={prog.id}>
                      {prog.program_name} ({prog.program_code}) — {prog.primary_type}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Page-Specific Decisions Form (Category B) */}
            <form onSubmit={handleSubmit} className="space-y-6 pt-4">
              <div className="border-t border-slate-200 pt-6">
                <h3 className="text-sm font-bold text-slate-900 mb-1">Financial Advisory Decision Options</h3>
                <p className="text-xs text-slate-500 mb-4">
                  Configure loan purpose, credit profile, and repayment tenure for this financial consultation.
                </p>
              </div>

              {/* Purpose of Loan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Purpose of Loan Financing</label>
                <select
                  value={pageDecisions.purpose}
                  onChange={(e) => setPageDecisions({ ...pageDecisions, purpose: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="Equipment & Machinery Purchase">Equipment & Machinery Purchase</option>
                  <option value="Raw Material & Working Capital">Raw Material & Working Capital</option>
                  <option value="Livestock / Cattle Purchase">Livestock / Cattle Purchase</option>
                  <option value="New Business Setup">New Business Setup</option>
                  <option value="Enterprise Expansion & Modernization">Enterprise Expansion & Modernization</option>
                </select>
              </div>

              {/* Credit History & Preferred Tenure */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Applicant Credit History</label>
                  <div className="space-y-1">
                    {['Good Track Record', 'No Prior Credit', 'Minor Overdues'].map((ch) => (
                      <label key={ch} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="radio"
                          name="creditHistory"
                          checked={pageDecisions.creditHistory === ch}
                          onChange={() => setPageDecisions({ ...pageDecisions, creditHistory: ch })}
                          className="accent-blue-600"
                        />
                        <span>{ch}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Preferred Repayment Tenure</label>
                  <div className="space-y-1">
                    {[
                      { label: '36 Months (3 Years)', val: 36 },
                      { label: '60 Months (5 Years) — Recommended', val: 60 },
                      { label: '84 Months (7 Years)', val: 84 },
                    ].map((ten) => (
                      <label key={ten.val} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="radio"
                          name="preferredTenure"
                          checked={pageDecisions.preferredTenure === ten.val}
                          onChange={() => setPageDecisions({ ...pageDecisions, preferredTenure: ten.val })}
                          className="accent-blue-600"
                        />
                        <span>{ten.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Collateral Available */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Collateral Available</label>
                <div className="space-y-1">
                  {[
                    'None (Collateral-Free MUDRA / CGTMSE Coverage)',
                    'Residential / Commercial Property',
                    'Agricultural Land',
                    'Fixed Deposit / Liquid Securities',
                  ].map((col) => (
                    <label key={col} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pageDecisions.collateralAvailable.includes(col)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setPageDecisions({
                              ...pageDecisions,
                              collateralAvailable: [...pageDecisions.collateralAvailable, col],
                            });
                          } else {
                            setPageDecisions({
                              ...pageDecisions,
                              collateralAvailable: pageDecisions.collateralAvailable.filter((c) => c !== col),
                            });
                          }
                        }}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>{col}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200">
                <button
                  type="submit"
                  disabled={submitting || !isProfileComplete || !pageDecisions.programCode}
                  className="w-full py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Executing Deterministic Structuring Engine for {pageDecisions.programCode}...</span>
                    </>
                  ) : (
                    <>
                      <span>
                        {pageDecisions.programCode
                          ? `Calculate Financial Structure for ${pageDecisions.programCode}`
                          : 'Select a Programme to Calculate Financing'}
                      </span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function FinancialAdvisorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-100 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      }
    >
      <FinancialAdvisorForm />
    </Suspense>
  );
}
