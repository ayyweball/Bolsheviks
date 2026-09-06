'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { useLanguage } from '@/lib/i18n/useLanguage';
import {
  Building2,
  TrendingUp,
  FileSpreadsheet,
  BadgeIndianRupee,
  Landmark,
  LineChart as LineChartIcon,
  Download,
  Share2,
  Loader2,
  Plus
} from 'lucide-react';

export default function BusinessDetailPage({ params }: { params: { id: string } }) {
  const { t } = useLanguage();
  const [business, setBusiness] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/businesses/${params.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.business) setBusiness(data.business);
      })
      .finally(() => setLoading(false));
  }, [params.id]);

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

  if (!business) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col">
        <Navbar />
        <div className="p-8 text-center text-slate-600">Business entity not found</div>
      </div>
    );
  }

  const latestAdvisory = business.advisories?.[0];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <Navbar />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar />

        <main className="flex-1 p-6 space-y-6">
          
          {/* Header Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-900 capitalize">{business.type} Business</h1>
                  <p className="text-xs text-slate-500">Created: {new Date(business.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={`/dashboard/businesses/${business.id}/progress`}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 text-white font-bold text-xs shadow-sm hover:bg-emerald-800 transition-colors"
              >
                <LineChartIcon className="w-4 h-4" />
                <span>Progress Tracker</span>
              </Link>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 border-b border-slate-200 pb-2">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'advisories', label: 'Generated Advisories' },
              { id: 'progress', label: 'Progress Logs' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === tab.id ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Contents */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200">
                  <div className="text-xs font-bold text-slate-400">Target Capital</div>
                  <div className="text-2xl font-black text-slate-900 mt-1">₹{business.estimatedCapital?.toLocaleString('en-IN')}</div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200">
                  <div className="text-xs font-bold text-slate-400">Target Monthly Income</div>
                  <div className="text-2xl font-black text-emerald-700 mt-1">₹{business.targetMonthlyIncome?.toLocaleString('en-IN') || '50,000'}</div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200">
                  <div className="text-xs font-bold text-slate-400">Advisories Count</div>
                  <div className="text-2xl font-black text-blue-600 mt-1">{business.advisories?.length || 0}</div>
                </div>
              </div>

              {latestAdvisory && (
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                  <h3 className="text-sm font-bold text-slate-900">Latest AI Advisory Report</h3>
                  <p className="text-xs text-slate-600">{latestAdvisory.planJson?.executiveSummary}</p>
                  <Link
                    href={`/advisory/business-plan/${latestAdvisory.id}`}
                    className="inline-block text-xs font-bold text-emerald-700 hover:underline"
                  >
                    View Full Plan & Financial Breakdown →
                  </Link>
                </div>
              )}
            </div>
          )}

          {activeTab === 'advisories' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4">
              <h3 className="text-sm font-bold text-slate-900">Advisory History</h3>
              {business.advisories?.length === 0 ? (
                <p className="text-xs text-slate-400">No advisories generated yet.</p>
              ) : (
                <div className="space-y-3">
                  {business.advisories.map((ad: any, i: number) => (
                    <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex justify-between items-center text-xs">
                      <div>
                        <strong className="text-slate-900 uppercase font-bold">{ad.type} Advisory</strong>
                        <span className="text-slate-500 block text-[11px]">{new Date(ad.createdAt).toLocaleString()}</span>
                      </div>
                      <Link
                        href={`/advisory/business-plan/${ad.id}`}
                        className="px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-800 font-bold hover:bg-emerald-200"
                      >
                        Open Advisory
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'progress' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-slate-900">Monthly Progress Logs</h3>
                <Link
                  href={`/dashboard/businesses/${business.id}/progress`}
                  className="px-3 py-1.5 bg-emerald-700 text-white font-bold text-xs rounded-xl"
                >
                  Log New Month
                </Link>
              </div>

              {business.progressLogs?.length === 0 ? (
                <p className="text-xs text-slate-400">No progress logged yet.</p>
              ) : (
                <div className="space-y-2">
                  {business.progressLogs.map((log: any, idx: number) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between text-xs font-semibold">
                      <span>{log.month}</span>
                      <span className="text-emerald-700">Income: ₹{log.actualIncome.toLocaleString('en-IN')}</span>
                      <span className="text-amber-700">Expense: ₹{log.actualExpense.toLocaleString('en-IN')}</span>
                      <span className="text-blue-700">Net: ₹{(log.actualIncome - log.actualExpense).toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
