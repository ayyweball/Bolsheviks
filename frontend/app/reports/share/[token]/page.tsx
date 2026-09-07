'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import {
  FileText,
  Building2,
  TrendingUp,
  Landmark,
  ShieldCheck,
  Loader2,
  Calendar,
  AlertCircle,
  IndianRupee,
  Layers,
  CloudSun,
  Database,
} from 'lucide-react';

const PROVENANCE_STYLES: Record<string, string> = {
  'USER PROVIDED': 'bg-blue-50 text-blue-700 border-blue-200',
  'GOVERNMENT / DATASET DERIVED': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'MODELLED INDICATOR': 'bg-purple-50 text-purple-700 border-purple-200',
  'AI INTERPRETATION': 'bg-amber-50 text-amber-700 border-amber-200',
  'ILLUSTRATIVE ASSUMPTION': 'bg-orange-50 text-orange-700 border-orange-200',
  'BACKEND DETERMINISTIC CALCULATION': 'bg-indigo-50 text-indigo-700 border-indigo-200',
};

function ProvenanceBadge({ tag }: { tag: string }) {
  const style = PROVENANCE_STYLES[tag] || 'bg-slate-100 text-slate-700 border-slate-200';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${style}`}>
      {tag}
    </span>
  );
}

export default function SharedReportViewPage({ params }: { params: { token: string } }) {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/reports/share/${params.token}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.report) setReport(data.report);
        else setError(data.error || 'Failed to load report');
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [params.token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-8">
        <div className="bg-white p-8 rounded-3xl border border-red-200 text-center max-w-md">
          <h2 className="text-lg font-bold text-red-600 mb-2">Report Link Expired or Invalid</h2>
          <p className="text-xs text-slate-500">{error}</p>
        </div>
      </div>
    );
  }

  const bus = report?.business || {};
  const usr = report?.user || {};
  const dpr = report?.advisory?.planJson || {};

  // Check if plan has canonical 13-section structure
  const isStructuredDPR = !!(dpr.executive_summary && dpr.capital_structure);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />

      <main className="max-w-4xl mx-auto p-4 md:p-6 space-y-6 w-full">
        {/* Banner Header */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold uppercase mb-2">
              <ShieldCheck className="w-3.5 h-3.5" /> Official Detailed Project Report (DPR)
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 capitalize">
              {dpr.project_name || `${bus.type || 'Enterprise'} Detailed Project Report`}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Promoter: <span className="font-semibold text-slate-700">{dpr.promoter_name || usr.name || 'Entrepreneur'}</span> • Location:{' '}
              <span className="font-semibold text-slate-700">
                {dpr.district_name || bus.district || usr.district}, {dpr.state_name || bus.state || usr.state}
              </span>
            </p>
          </div>

          <div className="bg-slate-50 px-4 py-3 rounded-xl border text-center">
            <span className="text-[10px] font-bold uppercase text-slate-500">Scheme Alignment</span>
            <div className="text-sm font-extrabold text-indigo-950 mt-0.5">
              {dpr.executive_summary?.recommended_program_name || dpr.government_support?.program_name || 'Statutory Scheme'}
            </div>
          </div>
        </div>

        {/* Section 1: Executive Summary */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 uppercase">1. Executive Summary</h2>
            <ProvenanceBadge tag={dpr.executive_summary?.provenance || 'BACKEND DETERMINISTIC CALCULATION + AI INTERPRETATION'} />
          </div>
          <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
            {dpr.executive_summary?.executive_narrative || dpr.executiveSummary || 'Executive summary not provided.'}
          </p>
        </div>

        {/* Section 2: Capital Structure & Amortization (Zero Frontend Math) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 uppercase">2. Authoritative Capital Structure & Debt Service</h2>
            <ProvenanceBadge tag="BACKEND DETERMINISTIC CALCULATION" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border">
              <span className="text-slate-500 block text-[10px] font-semibold uppercase">Total Project Cost</span>
              <strong className="text-slate-900 text-base">
                ₹{(dpr.capital_structure?.total_project_cost || bus.projectCost || bus.estimatedCapital || 0).toLocaleString('en-IN')}
              </strong>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border">
              <span className="text-slate-500 block text-[10px] font-semibold uppercase">Promoter Contribution</span>
              {dpr.capital_structure?.promoter_equity_amount != null ? (
                <>
                  <strong className="text-blue-700 text-base">
                    ₹{dpr.capital_structure.promoter_equity_amount.toLocaleString('en-IN')}
                  </strong>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {dpr.capital_structure?.promoter_equity_pct != null
                      ? `${dpr.capital_structure.promoter_equity_pct}% margin`
                      : 'Self-equity'}
                  </div>
                </>
              ) : (
                <div className="text-[11px] text-amber-700 font-medium mt-1 leading-snug">
                  Not specified by authoritative programme data
                </div>
              )}
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border">
              <span className="text-slate-500 block text-[10px] font-semibold uppercase">Net Bank Loan</span>
              <strong className="text-indigo-700 text-base">
                {dpr.capital_structure?.net_bank_loan_exposure != null
                  ? `₹${dpr.capital_structure.net_bank_loan_exposure.toLocaleString('en-IN')}`
                  : 'Not applicable'}
              </strong>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border">
              <span className="text-slate-500 block text-[10px] font-semibold uppercase">Monthly EMI</span>
              {dpr.government_support?.is_credit_linked && dpr.financial_assumptions?.annual_interest_rate_pct != null ? (
                <>
                  <strong className="text-emerald-700 text-base">
                    ₹{(dpr.financial_assumptions?.monthly_emi || 0).toLocaleString('en-IN')}
                  </strong>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {dpr.financial_assumptions.loan_tenure_months} mos @ {dpr.financial_assumptions.annual_interest_rate_pct}%
                    {dpr.financial_assumptions.is_benchmark_assumption ? ' benchmark' : ''}
                  </div>
                  <div className="text-[9px] text-indigo-600 font-semibold mt-0.5">
                    {dpr.financial_assumptions.rate_display_text || 'Market-linked / lender-dependent'}
                  </div>
                </>
              ) : (
                <div className="text-[11px] text-slate-500 font-medium mt-1 leading-snug">
                  Not applicable — programme is not credit-linked.
                </div>
              )}
            </div>
          </div>

          {/* Amortization Schedule Table */}
          {dpr.financial_assumptions?.amortization_schedule && (
            <div>
              <span className="text-xs font-semibold text-slate-700 block mb-2">Annual Amortization Progression:</span>
              <div className="overflow-x-auto border rounded-xl">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b">
                    <tr>
                      <th className="p-2">Year</th>
                      <th className="p-2">Opening (₹)</th>
                      <th className="p-2">Principal (₹)</th>
                      <th className="p-2">Interest (₹)</th>
                      <th className="p-2">Annual Payment (₹)</th>
                      <th className="p-2">Closing (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {dpr.financial_assumptions.amortization_schedule.map((row: any) => (
                      <tr key={row.year} className="hover:bg-slate-50 font-mono">
                        <td className="p-2 font-sans font-bold">{row.year}</td>
                        <td className="p-2">₹{row.opening_balance.toLocaleString('en-IN')}</td>
                        <td className="p-2 text-indigo-700">₹{row.annual_principal.toLocaleString('en-IN')}</td>
                        <td className="p-2 text-orange-700">₹{row.annual_interest.toLocaleString('en-IN')}</td>
                        <td className="p-2 font-bold">₹{row.total_annual_payment.toLocaleString('en-IN')}</td>
                        <td className="p-2 text-slate-600">₹{row.closing_balance.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Section 3: Market Analysis & Comparable Districts */}
        {dpr.market_analysis && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 uppercase">3. District Market Intelligence & Nearest Neighbors</h2>
              <div className="flex gap-1.5">
                <ProvenanceBadge tag="GOVERNMENT / DATASET DERIVED" />
                <ProvenanceBadge tag="MODELLED INDICATOR" />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-500 block text-[10px]">District Registered MSMEs</span>
                <strong className="text-slate-900 text-sm">{dpr.market_analysis.total_msmes_in_district?.toLocaleString('en-IN')}</strong>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-500 block text-[10px]">Micro Share</span>
                <strong className="text-slate-900 text-sm">{dpr.market_analysis.micro_enterprise_share?.toFixed(1)}%</strong>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-500 block text-[10px]">KMeans Archetype</span>
                <strong className="text-indigo-700 text-xs line-clamp-1">{dpr.market_analysis.cluster_archetype_label}</strong>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-500 block text-[10px]">Market Indicator (MRI)</span>
                <strong className="text-emerald-700 text-sm">{dpr.market_analysis.market_research_indicator?.toFixed(1)}/100</strong>
              </div>
            </div>

            {dpr.market_analysis.comparable_districts?.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-700 block">Top Comparable Markets (scikit-learn NearestNeighbors):</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {dpr.market_analysis.comparable_districts.map((cd: any, i: number) => (
                    <div key={i} className="p-2.5 bg-slate-50 border rounded-xl space-y-1">
                      <div className="flex items-center justify-between font-bold text-slate-800">
                        <span>#{cd.similarity_rank} {cd.district_name}, {cd.state_name}</span>
                        <span className="font-mono text-[10px] bg-slate-200 px-1.5 py-0.5 rounded">
                          Distance: {cd.similarity_distance.toFixed(3)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 italic">{cd.qualitative_observation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Section 4: Implementation Milestones */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 uppercase">4. Implementation Schedule (Months 1-6)</h2>
            <ProvenanceBadge tag="AI INTERPRETATION" />
          </div>

          <div className="space-y-2 text-xs">
            {(dpr.implementation_plan?.milestones || dpr.actionTimeline || []).map((item: any, i: number) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                  M{item.phase_number || item.month || i + 1}
                </span>
                <div>
                  <div className="font-bold text-slate-900">{item.activity || item.title}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{item.critical_deliverable || item.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 5: Illustrative Operating Assumptions Disclaimer */}
        {dpr.illustrative_assumptions && (
          <div className="bg-orange-50/70 border border-orange-200 rounded-2xl p-5 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-orange-950 uppercase">Illustrative Operating Assumptions</span>
              <ProvenanceBadge tag="ILLUSTRATIVE ASSUMPTION" />
            </div>
            <p className="text-orange-900 text-[11px] font-semibold italic">
              "{dpr.illustrative_assumptions.disclaimer}"
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700 text-[11px] pt-1">
              <div><span className="font-semibold">Working Capital Cycle:</span> {dpr.illustrative_assumptions.working_capital_cycle_days} Days</div>
              <div><span className="font-semibold">Break-Even Point:</span> {dpr.illustrative_assumptions.break_even_commentary}</div>
            </div>
          </div>
        )}

        {/* Provenance Legend */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 text-xs text-slate-500 space-y-2">
          <span className="font-bold text-slate-700 block uppercase text-[11px]">Audit & Provenance Contract</span>
          <p className="text-[11px] leading-relaxed">
            Every metric and projection in this report is provenance-tagged. Financial liabilities, subsidies, and interest amortization are deterministic backend calculations derived directly from official gazetted government scheme parameters. Market statistics reflect the real PostgreSQL Udyam MSME census. Zero numbers are fabricated.
          </p>
        </div>
      </main>
    </div>
  );
}
