'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import ShareModal from '@/components/ShareModal';
import { useLanguage } from '@/lib/i18n/useLanguage';
import {
  Award,
  TrendingUp,
  Calendar,
  CheckCircle,
  AlertTriangle,
  FileCheck,
  Download,
  Share2,
  MessageSquare,
  Landmark,
  ArrowRight,
  Loader2
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';

export default function BusinessPlanResultsPage({ params }: { params: { planId: string } }) {
  const { t } = useLanguage();
  const [advisory, setAdvisory] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    fetch(`/api/advisory/${params.planId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.advisory) setAdvisory(data.advisory);
      })
      .finally(() => setLoading(false));
  }, [params.planId]);

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

  const plan = advisory?.planJson || {};
  const business = advisory?.business || {};

  const projData = [
    {
      period: 'Month 6',
      Revenue: plan.financialProjections?.month6?.revenue || 110000,
      Expenses: plan.financialProjections?.month6?.expenses || 70000,
      NetProfit: plan.financialProjections?.month6?.netProfit || 40000,
    },
    {
      period: 'Month 12',
      Revenue: plan.financialProjections?.month12?.revenue || 190000,
      Expenses: plan.financialProjections?.month12?.expenses || 110000,
      NetProfit: plan.financialProjections?.month12?.netProfit || 80000,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <Navbar />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar />

        <main className="flex-1 p-6 space-y-6">
          
          {/* Header Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-extrabold text-slate-900 capitalize">{business.type} Advisory Plan</h1>
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1">
                  <Award className="w-3.5 h-3.5" />
                  Feasibility: {plan.feasibilityScore || 85}/100
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Capital Target: ₹{business.estimatedCapital?.toLocaleString('en-IN')}</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShareOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
              >
                <Share2 className="w-4 h-4" />
                <span>Share DPR</span>
              </button>

              <Link
                href="/chat"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-sm transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Chat with Advisor</span>
              </Link>
            </div>
          </div>

          {/* Executive Summary */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900 mb-2">Executive Summary</h2>
            <p className="text-xs text-slate-600 leading-relaxed">{plan.executiveSummary}</p>
          </div>

          {/* Market Analysis & Financial Projections Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Market Analysis Cards */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                Market Analysis
              </h2>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Demand Level</div>
                  <div className="text-sm font-extrabold text-emerald-700 mt-0.5">{plan.marketAnalysis?.demand || 'Strong'}</div>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Competition</div>
                  <div className="text-sm font-extrabold text-slate-800 mt-0.5">{plan.marketAnalysis?.competition || 'Moderate'}</div>
                </div>
              </div>

              <div>
                <div className="text-xs font-bold text-slate-700 mb-1">Growth Potential</div>
                <p className="text-xs text-slate-600 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">{plan.marketAnalysis?.growthPotential}</p>
              </div>

              <div>
                <div className="text-xs font-bold text-slate-700 mb-1">Target Customers</div>
                <p className="text-xs text-slate-600">{plan.marketAnalysis?.targetCustomers}</p>
              </div>
            </div>

            {/* Financial Projections Bar Chart */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-slate-900">Financial Projections</h2>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                  Break-even: Month {plan.financialProjections?.breakEvenMonth || 8}
                </span>
              </div>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={projData}>
                    <XAxis dataKey="period" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `₹${v/1000}k`} />
                    <Tooltip formatter={(val: any) => [`₹${val.toLocaleString('en-IN')}`, 'Amount']} />
                    <Legend />
                    <Bar dataKey="Revenue" fill="#16a34a" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="Expenses" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="NetProfit" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* 6-Month Action Timeline */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              6-Month Action Timeline
            </h2>

            <div className="space-y-3">
              {plan.actionTimeline?.map((item: any, idx: number) => (
                <div key={idx} className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${item.completed ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    M{item.month}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Required Permits & Risk Mitigation Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Required Permits */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-blue-600" />
                Required Permits & Registration
              </h3>
              <ul className="space-y-2">
                {plan.requiredPermits?.map((permit: string, i: number) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{permit}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Risk Mitigation */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Risk & Mitigation Strategies
              </h3>
              <div className="space-y-3">
                {plan.risks?.map((r: any, i: number) => (
                  <div key={i} className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/60 text-xs">
                    <div className="font-bold text-slate-900 flex justify-between">
                      <span>{r.risk}</span>
                      <span className="text-[10px] uppercase font-semibold text-amber-700">{r.impact} Impact</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1">{r.mitigation}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Scheme Matcher Action Bar */}
          <div className="bg-gradient-to-r from-emerald-800 to-green-700 text-white p-6 rounded-3xl shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold">Matching Government Schemes Ready</h3>
              <p className="text-xs text-emerald-100 mt-1">Explore MUDRA, PMEGP, and state subsidy schemes customized for your capital target.</p>
            </div>

            <Link
              href="/advisory/schemes"
              className="px-6 py-3 rounded-2xl bg-white text-emerald-800 font-extrabold text-xs hover:bg-emerald-50 transition-colors shrink-0 flex items-center gap-2"
            >
              <span>View Eligible Schemes</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

        </main>
      </div>

      <ShareModal isOpen={shareOpen} onClose={() => setShareOpen(false)} businessId={business.id} advisoryId={advisory.id} />
    </div>
  );
}
