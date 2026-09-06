'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { Award, CheckCircle, TrendingUp, Landmark, ShieldCheck, Loader2 } from 'lucide-react';

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
  const adv = report?.advisory?.planJson || {};

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <Navbar />

      <main className="max-w-4xl mx-auto p-6 space-y-6 w-full">
        
        {/* Banner */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold uppercase mb-2">
              Official UnnatE Detailed Project Report (DPR)
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 capitalize">{bus.type} Business DPR</h1>
            <p className="text-xs text-slate-500 mt-0.5">Entrepreneur: {usr.name} • Location: {usr.district}, {usr.state}</p>
          </div>

          <div className="bg-emerald-50 px-4 py-3 rounded-2xl border border-emerald-200 text-center">
            <span className="text-[10px] font-bold uppercase text-emerald-700">Feasibility Score</span>
            <div className="text-2xl font-black text-emerald-900">{adv.feasibilityScore || 85} / 100</div>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 mb-2">Executive Summary</h2>
          <p className="text-xs text-slate-600 leading-relaxed">{adv.executiveSummary}</p>
        </div>

        {/* Financial Projections Summary */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 mb-3">Capital & Financial Breakdown</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-400 block text-[10px]">Estimated Capital</span>
              <strong className="text-slate-900 text-base">₹{bus.estimatedCapital?.toLocaleString('en-IN')}</strong>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-400 block text-[10px]">Month 6 Revenue</span>
              <strong className="text-emerald-700 text-base">₹{adv.financialProjections?.month6?.revenue?.toLocaleString('en-IN')}</strong>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-400 block text-[10px]">Month 12 Revenue</span>
              <strong className="text-emerald-700 text-base">₹{adv.financialProjections?.month12?.revenue?.toLocaleString('en-IN')}</strong>
            </div>
          </div>
        </div>

        {/* Action Timeline */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 mb-3">Implementation Plan</h2>
          <div className="space-y-2 text-xs">
            {adv.actionTimeline?.map((item: any, i: number) => (
              <div key={i} className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center">M{item.month}</span>
                <div>
                  <div className="font-bold text-slate-900">{item.title}</div>
                  <div className="text-[11px] text-slate-500">{item.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}
