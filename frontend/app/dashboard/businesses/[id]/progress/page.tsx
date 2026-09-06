'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { useLanguage } from '@/lib/i18n/useLanguage';
import {
  TrendingUp,
  Plus,
  Award,
  CheckCircle,
  Loader2,
  Calendar
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';

export default function ProgressTrackerPage({ params }: { params: { id: string } }) {
  const { t } = useLanguage();
  const [comparison, setComparison] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    month: new Date().toISOString().substring(0, 7), // YYYY-MM
    actualIncome: 35000,
    actualExpense: 18000,
    notes: 'Good sales month, local Mandi demand increased.',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchComparison = async () => {
    try {
      const res = await fetch(`/api/progress/${params.id}/comparison`);
      const data = await res.json();
      setComparison(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComparison();
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`/api/progress/${params.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        fetchComparison();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <Navbar />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar />

        <main className="flex-1 p-6 space-y-6">
          
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900">Progress Tracker</h1>
              <p className="text-xs text-slate-500">Log monthly income & expenses to track performance against AI plan targets.</p>
            </div>
          </div>

          {/* Log New Month Form */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm max-w-3xl">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              Log Monthly Performance
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Month (YYYY-MM)</label>
                  <input
                    type="month"
                    required
                    value={form.month}
                    onChange={(e) => setForm({ ...form, month: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Actual Income (₹)</label>
                  <input
                    type="number"
                    required
                    value={form.actualIncome}
                    onChange={(e) => setForm({ ...form, actualIncome: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Actual Expense (₹)</label>
                  <input
                    type="number"
                    required
                    value={form.actualExpense}
                    onChange={(e) => setForm({ ...form, actualExpense: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Notes (Optional)</label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g. Purchased 2 new cows, sales increased 15%"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="py-2.5 px-5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                <span>Save Progress Log</span>
              </button>
            </form>
          </div>

          {/* Comparison Line Chart & Table */}
          {comparison?.chartData?.length > 0 && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              
              {/* Celebration Banner */}
              {comparison.chartData[comparison.chartData.length - 1]?.exceeded && (
                <div className="p-4 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-2xl flex items-center gap-3 shadow-md">
                  <Award className="w-8 h-8 text-amber-300 shrink-0" />
                  <div>
                    <h4 className="text-sm font-extrabold">Congratulations! You Exceeded Plan Targets 🎉</h4>
                    <p className="text-xs text-emerald-100">Your net profit for {comparison.chartData[comparison.chartData.length - 1].month} exceeded the planned target by 10%+.</p>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-900">Plan vs. Actual Profit Comparison</h3>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={comparison.chartData}>
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `₹${v/1000}k`} />
                    <Tooltip formatter={(val: any) => [`₹${val.toLocaleString('en-IN')}`, 'Amount']} />
                    <Legend />
                    <Line type="monotone" dataKey="actualProfit" name="Actual Profit" stroke="#16a34a" strokeWidth={3} />
                    <Line type="monotone" dataKey="plannedProfit" name="Planned Target" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b text-slate-400 font-bold uppercase text-[10px]">
                      <th className="pb-3">Month</th>
                      <th className="pb-3">Actual Income</th>
                      <th className="pb-3">Actual Expense</th>
                      <th className="pb-3">Actual Net Profit</th>
                      <th className="pb-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {comparison.chartData.map((row: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="py-3 font-bold text-slate-900">{row.month}</td>
                        <td className="py-3 text-emerald-700">₹{row.actualIncome.toLocaleString('en-IN')}</td>
                        <td className="py-3 text-amber-700">₹{row.actualExpense.toLocaleString('en-IN')}</td>
                        <td className="py-3 font-bold text-slate-900">₹{row.actualProfit.toLocaleString('en-IN')}</td>
                        <td className="py-3">
                          {row.exceeded ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">Above Target</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">On Track</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          )}

        </main>
      </div>
    </div>
  );
}
