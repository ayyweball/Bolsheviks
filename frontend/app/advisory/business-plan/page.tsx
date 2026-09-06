'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { useLanguage } from '@/lib/i18n/useLanguage';
import { Sparkles, ArrowRight, Loader2, IndianRupee, MapPin, Building2 } from 'lucide-react';

export default function BusinessPlanFormPage() {
  const { t } = useLanguage();
  const router = useRouter();

  const [form, setForm] = useState({
    businessType: 'agriculture',
    subType: 'Dairy Farming (20 Cows)',
    experienceLevel: 'Intermediate',
    targetMarket: 'District Mandi & Co-operatives',
    currentIncome: 25000,
    estimatedCapital: 500000,
    existingDebt: 0,
    additionalContext: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/advisory/business-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate business plan');

      router.push(`/advisory/business-plan/${data.plan_id}`);
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
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-green-500 text-white flex items-center justify-center shadow-md">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900">{t('advisory.businessPlan')}</h1>
                <p className="text-xs text-slate-500">Generate instant hyper-local feasibility score, 6-month timeline, and financial projections powered by Claude AI.</p>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600 text-xs font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Business Type & Sub-type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Business Category</label>
                  <select
                    value={form.businessType}
                    onChange={(e) => setForm({ ...form, businessType: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="agriculture">Agriculture & Dairy</option>
                    <option value="retail">Retail & Village Kirana</option>
                    <option value="services">Repair & Local Services</option>
                    <option value="manufacturing">Micro Manufacturing & Processing</option>
                    <option value="transport">Transport & Logistics</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Sub-Type / Business Name</label>
                  <input
                    type="text"
                    required
                    value={form.subType}
                    onChange={(e) => setForm({ ...form, subType: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. 20-Cow Dairy Farm, Agro Processing Unit"
                  />
                </div>
              </div>

              {/* Capital Slider */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-slate-700">{t('forms.estimatedCapital')}</label>
                  <span className="text-base font-black text-emerald-700">₹{form.estimatedCapital.toLocaleString('en-IN')}</span>
                </div>
                <input
                  type="range"
                  min={50000}
                  max={1000000}
                  step={25000}
                  value={form.estimatedCapital}
                  onChange={(e) => setForm({ ...form, estimatedCapital: parseInt(e.target.value) })}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-bold mt-1">
                  <span>₹50,000 (MUDRA Shishu)</span>
                  <span>₹5,00,000 (MUDRA Kishor)</span>
                  <span>₹10,00,000 (MUDRA Tarun)</span>
                </div>
              </div>

              {/* Monthly Income & Existing Debt */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t('forms.currentIncome')}</label>
                  <input
                    type="number"
                    value={form.currentIncome}
                    onChange={(e) => setForm({ ...form, currentIncome: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Existing Debt (₹)</label>
                  <input
                    type="number"
                    value={form.existingDebt}
                    onChange={(e) => setForm({ ...form, existingDebt: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Experience Level & Target Market */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Experience Level</label>
                  <div className="flex gap-2">
                    {['Beginner', 'Intermediate', 'Experienced'].map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setForm({ ...form, experienceLevel: lvl })}
                        className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                          form.experienceLevel === lvl ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Market</label>
                  <input
                    type="text"
                    value={form.targetMarket}
                    onChange={(e) => setForm({ ...form, targetMarket: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. Local Mandi, Village Traders"
                  />
                </div>
              </div>

              {/* Additional Context */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Additional Business Context</label>
                <textarea
                  rows={3}
                  value={form.additionalContext}
                  onChange={(e) => setForm({ ...form, additionalContext: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Describe your land availability, equipment needs, or special requirements..."
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Analyzing Feasibility with Claude AI...</span>
                  </>
                ) : (
                  <>
                    <span>Generate Business Plan & Feasibility Score</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
