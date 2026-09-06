'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { useLanguage } from '@/lib/i18n/useLanguage';
import { BadgeIndianRupee, Plus, Trash2, ArrowRight, Loader2 } from 'lucide-react';

export default function FinancialAdvisorFormPage() {
  const { t } = useLanguage();
  const router = useRouter();

  const [form, setForm] = useState({
    monthlyIncome: 30000,
    monthlyExpenses: 12000,
    existingLoans: [{ name: 'Personal Loan', emi: 2000 }],
    creditHistory: 'Good Track Record',
    loanNeeded: 300000,
    purpose: 'Equipment & Machinery Purchase',
    preferredTenure: 60,
    collateralAvailable: ['None (Collateral-Free MUDRA Coverage)'],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addLoan = () => {
    setForm({ ...form, existingLoans: [...form.existingLoans, { name: '', emi: 0 }] });
  };

  const removeLoan = (idx: number) => {
    const updated = form.existingLoans.filter((_, i) => i !== idx);
    setForm({ ...form, existingLoans: updated });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/advisory/financial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate financial advice');

      router.push(`/advisory/financial/${data.advisoryId}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <Navbar />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar />

        <main className="flex-1 p-6 space-y-6">
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm max-w-3xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md">
                <BadgeIndianRupee className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900">{t('advisory.financialAdvisor')}</h1>
                <p className="text-xs text-slate-500">Calculate affordable EMI, debt-to-income ratio, and 3 recommended loan structures (Conservative, Balanced, Extended).</p>
              </div>
            </div>

            {error && <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600 text-xs font-semibold">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Income & Expenses */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t('forms.currentIncome')}</label>
                  <input
                    type="number"
                    required
                    value={form.monthlyIncome}
                    onChange={(e) => setForm({ ...form, monthlyIncome: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Monthly Expenses (₹)</label>
                  <input
                    type="number"
                    required
                    value={form.monthlyExpenses}
                    onChange={(e) => setForm({ ...form, monthlyExpenses: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Existing Loans Section */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-700">Existing Loans & EMIs</label>
                  <button
                    type="button"
                    onClick={addLoan}
                    className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Loan
                  </button>
                </div>

                {form.existingLoans.map((loan, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input
                      type="text"
                      placeholder="Loan Name (e.g. Bike Loan)"
                      value={loan.name}
                      onChange={(e) => {
                        const updated = [...form.existingLoans];
                        updated[idx].name = e.target.value;
                        setForm({ ...form, existingLoans: updated });
                      }}
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs"
                    />
                    <input
                      type="number"
                      placeholder="Monthly EMI (₹)"
                      value={loan.emi}
                      onChange={(e) => {
                        const updated = [...form.existingLoans];
                        updated[idx].emi = parseInt(e.target.value) || 0;
                        setForm({ ...form, existingLoans: updated });
                      }}
                      className="w-32 px-3 py-2 rounded-xl border border-slate-200 text-xs"
                    />
                    {form.existingLoans.length > 1 && (
                      <button type="button" onClick={() => removeLoan(idx)} className="p-2 text-slate-400 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Loan Needed & Purpose */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Loan Amount Needed (₹)</label>
                  <input
                    type="number"
                    required
                    value={form.loanNeeded}
                    onChange={(e) => setForm({ ...form, loanNeeded: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Purpose of Loan</label>
                  <select
                    value={form.purpose}
                    onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="Equipment & Machinery Purchase">Equipment & Machinery Purchase</option>
                    <option value="Raw Material & Working Capital">Raw Material & Working Capital</option>
                    <option value="Livestock / Cattle Purchase">Livestock / Cattle Purchase</option>
                    <option value="New Business Setup">New Business Setup</option>
                  </select>
                </div>
              </div>

              {/* Credit History & Preferred Tenure */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Credit History</label>
                  <div className="space-y-1">
                    {['Good Track Record', 'No Prior Credit', 'Minor Overdues'].map((ch) => (
                      <label key={ch} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="radio"
                          name="creditHistory"
                          checked={form.creditHistory === ch}
                          onChange={() => setForm({ ...form, creditHistory: ch })}
                          className="accent-emerald-600"
                        />
                        <span>{ch}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Preferred Tenure</label>
                  <div className="flex gap-2">
                    {[48, 60, 72].map((ten) => (
                      <button
                        key={ten}
                        type="button"
                        onClick={() => setForm({ ...form, preferredTenure: ten })}
                        className={`flex-1 py-2 rounded-xl text-xs font-semibold border ${
                          form.preferredTenure === ten ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        {ten} Months
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Calculate Loan Structures & EMI <ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
