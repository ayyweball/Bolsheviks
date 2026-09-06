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
  FileText,
  MapPin,
  Filter,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  ExternalLink,
  Loader2,
  AlertTriangle,
  Award
} from 'lucide-react';

export default function SchemesPage() {
  const { t } = useLanguage();
  const { user } = useAppStore();

  const [schemes, setSchemes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedScheme, setExpandedScheme] = useState<string | number | null>(null);

  const [filters, setFilters] = useState({
    businessType: 'agriculture',
    estimatedCapital: 500000,
    category: 'General',
    isWoman: false,
    state: user?.state || 'Uttar Pradesh',
    district: user?.district || 'Lucknow',
  });

  const fetchSchemes = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/advisory/schemes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filters),
      });
      const data = await res.json();
      if (data.schemes) setSchemes(data.schemes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchemes();
  }, [filters.estimatedCapital, filters.businessType, filters.isWoman]);

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
                Authoritative 100-pt Recommendation Engine matched {schemes.length} statutory programmes for {filters.district}, {filters.state}.
              </p>
            </div>

            {/* Quick Filter Pill */}
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.isWoman}
                  onChange={(e) => setFilters({ ...filters, isWoman: e.target.checked })}
                  className="accent-emerald-600"
                />
                <span>Women Entrepreneur</span>
              </label>
            </div>
          </div>

          {/* Capital Range Filter */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1 w-full">
              <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                <span>Filter Loan / Financing Needed</span>
                <span className="text-emerald-700">₹{filters.estimatedCapital.toLocaleString('en-IN')}</span>
              </div>
              <input
                type="range"
                min={20000}
                max={1000000}
                step={25000}
                value={filters.estimatedCapital}
                onChange={(e) => setFilters({ ...filters, estimatedCapital: parseInt(e.target.value) })}
                className="w-full accent-emerald-600 cursor-pointer"
              />
            </div>

            <button
              onClick={fetchSchemes}
              className="px-4 py-2.5 rounded-xl bg-emerald-700 text-white font-bold text-xs hover:bg-emerald-800 transition-colors shrink-0"
            >
              Apply Filter
            </button>
          </div>

          {/* Scheme Cards List */}
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-500 font-semibold">Evaluating Statutory Eligibility & Scoring Recommendations...</p>
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
                        <div className="text-xs text-slate-400 font-semibold">Financing Target</div>
                        <div className="text-base font-black text-emerald-800">₹{item.recommendedAmount?.toLocaleString('en-IN')}</div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">{s.description}</p>

                    {/* Quick Facts Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Loan Range</span>
                        <strong className="text-slate-800">₹{(s.loanMin/1000).toFixed(0)}K - ₹{(s.loanMax/100000).toFixed(1)}L</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Indicative Rate</span>
                        <strong className="text-slate-800">{s.interestRate}% p.a.</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Typical Tenure</span>
                        <strong className="text-slate-800">{s.tenure} Months</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">State Scope</span>
                        <strong className="text-slate-800 capitalize">{s.state}</strong>
                      </div>
                    </div>

                    {/* Recommendation Drivers / Highlights */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 mb-2">Recommendation Drivers & Fit Factors</h4>
                      <ul className="space-y-1.5 text-xs text-slate-600">
                        {(item.recommendationDrivers && item.recommendationDrivers.length > 0 
                          ? item.recommendationDrivers 
                          : s.eligibility?.keyPoints || ['Statutory scheme alignment confirmed']
                        ).map((driver: string, i: number) => (
                          <li key={i} className="flex items-start gap-2">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{driver}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Cautionary Notes if present */}
                    {item.cautionaryNotes && item.cautionaryNotes.length > 0 && (
                      <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 text-xs text-amber-800">
                        <div className="font-bold flex items-center gap-1.5 mb-1 text-amber-900 text-[11px]">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>Statutory & Operational Considerations:</span>
                        </div>
                        <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                          {item.cautionaryNotes.map((note: string, ci: number) => (
                            <li key={ci}>{note}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Collapsible Hyper-Local Insights & Application Steps */}
                    {isExpanded && (
                      <div className="pt-4 border-t space-y-4">
                        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                          <h5 className="text-xs font-bold text-slate-900 mb-1">Local Intelligence ({filters.district})</h5>
                          <p className="text-xs text-slate-700">{item.hyperLocalInsight}</p>
                        </div>

                        <div>
                          <h5 className="text-xs font-bold text-slate-900 mb-2">Application Steps</h5>
                          <ol className="list-decimal list-inside space-y-1 text-xs text-slate-600 font-medium">
                            <li>Visit nearest Public Sector Bank or Gramin Bank branch in {filters.district}.</li>
                            <li>Request scheme application form for {s.name}.</li>
                            <li>Attach UnnatE financial plan & project cost estimate.</li>
                            <li>Submit Aadhaar, PAN, and bank statement.</li>
                            <li>Sanction letter issued following standard underwriting within 7-14 business days.</li>
                          </ol>
                        </div>
                      </div>
                    )}

                    {/* Action Bar */}
                    <div className="flex items-center justify-between pt-2">
                      <button
                        onClick={() => setExpandedScheme(isExpanded ? null : (s.id || idx))}
                        className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1"
                      >
                        {isExpanded ? <>Hide Details <ChevronUp className="w-4 h-4" /></> : <>View Application Details & Local Insights <ChevronDown className="w-4 h-4" /></>}
                      </button>

                      <div className="flex items-center gap-2">
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
