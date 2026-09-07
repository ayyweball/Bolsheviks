'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { useLanguage } from '@/lib/i18n/useLanguage';
import { useAppStore } from '@/lib/store';
import {
  Landmark,
  ShieldCheck,
  CheckCircle,
  XCircle,
  FileText,
  MapPin,
  Filter,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  ExternalLink,
  Loader2,
  AlertTriangle,
  Award,
  BadgeIndianRupee,
  ArrowRight,
  HelpCircle,
  Sparkles
} from 'lucide-react';

export default function SchemesPage() {
  const { t } = useLanguage();
  const { user, business, setProfile } = useAppStore();

  const [schemes, setSchemes] = useState<any[]>([]);
  const [eligibilitySummary, setEligibilitySummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expandedScheme, setExpandedScheme] = useState<string | number | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Local filter overrides initialized from saved profile
  const [activeDistrict, setActiveDistrict] = useState('');
  const [activeState, setActiveState] = useState('');
  const [financingTarget, setFinancingTarget] = useState<number>(500000);
  const [filterWomen, setFilterWomen] = useState(false);

  // Load canonical profile on mount
  useEffect(() => {
    fetch('/api/user/profile')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setProfile(data.user, data.business || null);
          setActiveState(data.user.state || '');
          setActiveDistrict(data.user.district || '');
          setFilterWomen(data.user.gender === 'Female');
          const defaultTarget = data.business?.requestedFinancing || data.business?.projectCost || data.business?.estimatedCapital || 500000;
          setFinancingTarget(defaultTarget);
          fetchSchemes({
            state: data.user.state,
            district: data.user.district,
            gender: data.user.gender,
            social_category: data.user.socialCategory,
            is_rural: data.user.isRural,
            is_new_business: data.business?.isNewBusiness,
            is_traditional_artisan: data.user.isTraditionalArtisan,
            is_street_vendor: data.user.isStreetVendor,
            sector: data.business?.sector,
            project_cost: data.business?.projectCost || data.business?.estimatedCapital,
            requested_loan_amount: defaultTarget,
          });
        }
      })
      .catch((err) => {
        console.warn('Could not load user profile:', err);
        fetchSchemes({});
      });
  }, [setProfile]);

  const fetchSchemes = async (overrideParams: any = {}) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/advisory/schemes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...overrideParams,
          target_financing_need: financingTarget,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch recommendations');
      }
      if (data.schemes) setSchemes(data.schemes);
      if (data.eligibilitySummary) setEligibilitySummary(data.eligibilitySummary);
      if (data.userLocation) {
        if (data.userLocation.state) setActiveState(data.userLocation.state);
        if (data.userLocation.district) setActiveDistrict(data.userLocation.district);
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Could not load authoritative recommendations.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilter = () => {
    fetchSchemes({
      state: activeState || undefined,
      district: activeDistrict || undefined,
      gender: filterWomen ? 'Female' : (user?.gender || undefined),
      requested_loan_amount: financingTarget,
    });
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <Navbar />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar />

        <main className="flex-1 p-6 space-y-6">
          
          {/* Header Banner */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Landmark className="w-5 h-5" />
                </div>
                <h1 className="text-2xl font-extrabold text-slate-900">{t('advisory.schemeMatcher')}</h1>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Authoritative 100-pt statutory engine evaluation for {activeDistrict ? `${activeDistrict}, ` : ''}{activeState || 'All India'}.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/dashboard/profile"
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <span>{activeDistrict ? `${activeDistrict}, ${activeState}` : 'Configure Location'}</span>
              </Link>
            </div>
          </div>

          {/* Single Source of Truth Profile Inputs Banner */}
          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-200">
                  USER PROVIDED
                </span>
                <span className="text-xs font-bold text-slate-800">Using your saved Business Profile for Statutory Evaluation</span>
              </div>
              <Link
                href="/dashboard/profile"
                className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
              >
                <span>Edit Business Profile</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Location</span>
                <span className="font-bold text-slate-800 block truncate">
                  {user?.district ? `${user.district}, ${user.state}` : 'Not configured'}
                </span>
                <span className="text-[9px] text-slate-500">{user?.isRural ? 'Rural Jurisdiction' : 'Urban Jurisdiction'}</span>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Enterprise</span>
                <span className="font-bold text-slate-800 block truncate">
                  {business?.type || 'Enterprise'}
                </span>
                <span className="text-[9px] text-slate-500">{business?.sector || 'General Domain'}</span>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Project Cost & Capital</span>
                <span className="font-bold text-slate-800 block">
                  ₹{(business?.projectCost || business?.estimatedCapital || 0).toLocaleString('en-IN')}
                </span>
                <span className="text-[9px] text-slate-500">
                  {business?.promoterContribution ? `₹${business.promoterContribution.toLocaleString('en-IN')} promoter equity` : 'Self-contribution'}
                </span>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Demographics</span>
                <span className="font-bold text-slate-800 block truncate">
                  {user?.gender || 'Applicant'} • {user?.socialCategory || 'General'}
                </span>
                <span className="text-[9px] text-slate-500 truncate block">
                  {user?.isTraditionalArtisan ? 'Artisan • ' : ''}
                  {user?.isStreetVendor ? 'Street Vendor • ' : ''}
                  {user?.isStartup ? 'Startup • ' : ''}
                  {user?.isDifferentlyAbled ? 'PwD • ' : ''}
                  {user?.isExServiceman ? 'Ex-Serviceman' : 'Standard Quota'}
                </span>
              </div>
            </div>
          </div>

          {/* Statutory Eligibility Assessment Gate Banner */}
          {eligibilitySummary && (
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-5 rounded-3xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wide">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Deterministic Statutory Hard Gate</span>
                </div>
                <h2 className="text-base font-extrabold mt-0.5">
                  {eligibilitySummary.totalEvaluated} Central Government Programmes Evaluated
                </h2>
                <p className="text-[11px] text-slate-300">
                  Rules verified against applicant demographics, location jurisdiction, and enterprise parameters.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="px-3.5 py-2 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-center">
                  <span className="block text-lg font-black text-emerald-400">{eligibilitySummary.totalEligible}</span>
                  <span className="text-[10px] font-bold text-slate-300 uppercase">Eligible</span>
                </div>
                <div className="px-3.5 py-2 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-center">
                  <span className="block text-lg font-black text-amber-400">{eligibilitySummary.totalPartiallyVerified}</span>
                  <span className="text-[10px] font-bold text-slate-300 uppercase">Partially Verified</span>
                </div>
                <div className="px-3.5 py-2 rounded-2xl bg-red-500/20 border border-red-500/30 text-center">
                  <span className="block text-lg font-black text-red-400">{eligibilitySummary.totalIneligible}</span>
                  <span className="text-[10px] font-bold text-slate-300 uppercase">Ineligible</span>
                </div>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
              <Link href="/dashboard/profile" className="underline font-bold hover:text-red-900">
                Go to Profile
              </Link>
            </div>
          )}

          {/* Quick Target Financing Filter Bar */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1 w-full">
              <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                <span>Financing / Loan Needed</span>
                <span className="text-emerald-700 font-extrabold">₹{financingTarget.toLocaleString('en-IN')}</span>
              </div>
              <input
                type="range"
                min={20000}
                max={20000000}
                step={25000}
                value={financingTarget}
                onChange={(e) => setFinancingTarget(parseInt(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 bg-slate-50 px-3 py-2.5 rounded-xl border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filterWomen}
                  onChange={(e) => setFilterWomen(e.target.checked)}
                  className="accent-emerald-600"
                />
                <span>Women Quota</span>
              </label>

              <button
                onClick={handleApplyFilter}
                className="px-5 py-2.5 rounded-xl bg-emerald-700 text-white font-bold text-xs hover:bg-emerald-800 transition-colors shrink-0 shadow-sm cursor-pointer"
              >
                Apply Filter
              </button>
            </div>
          </div>

          {/* Scheme Cards List */}
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-500 font-semibold">Evaluating Statutory Rules & Scoring Recommendations...</p>
            </div>
          ) : schemes.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 p-8">
              <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
              <h3 className="text-base font-extrabold text-slate-900">No matching programmes found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                No government programmes matched the current profile attributes. Try updating your profile or adjusting financing requirements.
              </p>
              <Link href="/dashboard/profile" className="mt-4 inline-block px-4 py-2 rounded-xl bg-emerald-700 text-white font-bold text-xs">
                Review Profile
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {schemes.map((item, idx) => {
                const s = item.scheme;
                const isExpanded = expandedScheme === (s.id || idx);
                const fitScore = Math.round(item.recommendationScore ?? item.approvalProbability ?? 80);
                const fitCategory = (item.fitCategory || 'STRONG_FIT').replace(/_/g, ' ');

                return (
                  <div key={idx} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
                    
                    {/* Top Row: Name, Ministry, Fit Category & Recommendation Score */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b pb-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-extrabold text-slate-900">{s.name}</h3>
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-extrabold flex items-center gap-1">
                            <Award className="w-3 h-3 text-emerald-700" />
                            {fitCategory}: {fitScore}/100
                          </span>
                          {item.eligibilityStatus && (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.eligibilityStatus === 'Eligible' 
                                ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              {item.eligibilityStatus}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{s.ministry}</p>
                      </div>

                      <div className="text-right">
                        <div className="text-xs text-slate-400 font-semibold">Target Amount</div>
                        <div className="text-base font-black text-emerald-800">
                          {item.recommendedAmount ? `₹${item.recommendedAmount.toLocaleString('en-IN')}` : 'Scheme Defined'}
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">{s.description}</p>

                    {/* Quick Facts Grid - Authoritative Scheme Attributes */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Assistance Type</span>
                        <strong className="text-slate-800">{s.primaryType || 'Statutory Assistance'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Actionability</span>
                        <strong className="text-slate-800">{s.actionabilityType || 'Direct Benefit'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Programme Code</span>
                        <strong className="text-slate-800 font-mono text-[11px]">{s.code || 'CENTRAL'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Statutory Status</span>
                        <strong className="text-slate-800 capitalize">{item.eligibilityStatus || 'Eligible'}</strong>
                      </div>
                    </div>

                    {/* Statutory Reasons Satisfied */}
                    {item.statutoryReasons && item.statutoryReasons.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Statutory Rules Satisfied by Your Profile:</span>
                        </h4>
                        <ul className="space-y-1 text-xs text-slate-600 pl-5 list-disc">
                          {item.statutoryReasons.map((reason: string, ri: number) => (
                            <li key={ri}>{reason}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Unverified Statutory Criteria */}
                    {item.unverifiedCriteria && item.unverifiedCriteria.length > 0 && (
                      <div className="p-3 bg-amber-50/70 rounded-2xl border border-amber-200 text-xs text-amber-900">
                        <div className="font-bold flex items-center gap-1.5 mb-1 text-[11px]">
                          <HelpCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>Criteria Requiring External Verification / Documentation:</span>
                        </div>
                        <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                          {item.unverifiedCriteria.map((crit: string, ci: number) => (
                            <li key={ci}>{crit}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Disqualifying Reasons if any */}
                    {item.disqualifyingReasons && item.disqualifyingReasons.length > 0 && (
                      <div className="p-3 bg-red-50/70 rounded-2xl border border-red-200 text-xs text-red-900">
                        <div className="font-bold flex items-center gap-1.5 mb-1 text-[11px]">
                          <XCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                          <span>Disqualifying Criteria:</span>
                        </div>
                        <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                          {item.disqualifyingReasons.map((disq: string, di: number) => (
                            <li key={di}>{disq}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Collapsible Local Insights */}
                    {isExpanded && (
                      <div className="pt-4 border-t space-y-3">
                        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                          <h5 className="text-xs font-bold text-slate-900 mb-1">Local Operational Insights ({activeDistrict || 'District'})</h5>
                          <p className="text-xs text-slate-700">{item.hyperLocalInsight}</p>
                        </div>
                      </div>
                    )}

                    {/* Action Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                      <button
                        onClick={() => setExpandedScheme(isExpanded ? null : (s.id || idx))}
                        className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                      >
                        {isExpanded ? <>Hide Details <ChevronUp className="w-4 h-4" /></> : <>View Operational Insights <ChevronDown className="w-4 h-4" /></>}
                      </button>

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/advisory/financial?programId=${encodeURIComponent(s.id)}&programCode=${encodeURIComponent(s.code || '')}&loanNeeded=${encodeURIComponent(financingTarget)}`}
                          className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs"
                        >
                          <BadgeIndianRupee className="w-3.5 h-3.5" />
                          <span>Structure Financing</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                        {s.officialPortalUrl && (
                          <a
                            href={s.officialPortalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold"
                          >
                            <span>Official Portal</span>
                            <ExternalLink className="w-3 h-3 text-slate-500" />
                          </a>
                        )}
                        <Link
                          href="/chat"
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Ask AI Advisor</span>
                        </Link>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </main>
      </div>
    </div>
  );
}


