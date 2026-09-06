'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useLanguage } from '@/lib/i18n/useLanguage';
import { ArrowRight, CheckCircle2, ShieldCheck, Zap, Sparkles, Building2, Landmark, Award } from 'lucide-react';

export default function LandingPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      {/* HERO SECTION matching screenshot 1 */}
      <section className="relative overflow-hidden bg-gradient-to-b from-sky-200 via-sky-100 to-emerald-50/40 pt-12 pb-24 border-b border-emerald-100">
        
        {/* Decorative Background Waves & Tricolor Accent */}
        <div className="absolute inset-0 pointer-events-none opacity-30">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-300/40 via-transparent to-transparent" />
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 backdrop-blur border border-emerald-200 shadow-sm mb-6 text-xs font-semibold text-emerald-800">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
            <span>SIH26091 • AI Hyper-Local Advisory Platform</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-6 drop-shadow-sm">
            {t('heroTitle')}
          </h1>

          <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto mb-10 leading-relaxed font-normal">
            {t('heroSubtitle')}
          </p>

          {/* Action CTAs matching screenshot 1 */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              href="/auth/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white font-bold text-base shadow-lg shadow-blue-500/25 transition-all transform hover:-translate-y-0.5"
            >
              <span>{t('startAssessment')}</span>
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                <ArrowRight className="w-4 h-4 text-white" />
              </div>
            </Link>

            <Link
              href="#how-it-works"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-white hover:bg-slate-50 text-slate-800 font-semibold text-base shadow-md border border-slate-200 transition-all"
            >
              <span>{t('seeHowItWorks')}</span>
            </Link>
          </div>

          {/* Feature Badges Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            <div className="bg-white/80 backdrop-blur p-4 rounded-2xl border border-emerald-100 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Landmark className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">MUDRA & Schemes</div>
                <div className="text-[11px] text-slate-500">₹50K - ₹10L Loans</div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur p-4 rounded-2xl border border-emerald-100 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">Hyper-Local AI</div>
                <div className="text-[11px] text-slate-500">State & District Insights</div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur p-4 rounded-2xl border border-emerald-100 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">Instant DPR</div>
                <div className="text-[11px] text-slate-500">60-Sec Feasibility</div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur p-4 rounded-2xl border border-emerald-100 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">Bilingual Support</div>
                <div className="text-[11px] text-slate-500">Hindi & English</div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section id="how-it-works" className="py-20 bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-4">How UnnatE Works in 3 Simple Steps</h2>
            <p className="text-slate-600 text-sm">Empowering rural entrepreneurs with instant business advisory, loan structure recommendations, and scheme eligibility matching.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:shadow-md transition-shadow relative">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold text-sm flex items-center justify-center mb-4">1</div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">1-Min Business Profile</h3>
              <p className="text-slate-600 text-sm leading-relaxed">Enter your business type (agriculture, dairy, retail, services) and location in Hindi or English.</p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:shadow-md transition-shadow relative">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold text-sm flex items-center justify-center mb-4">2</div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">AI Feasibility & Scheme Search</h3>
              <p className="text-slate-600 text-sm leading-relaxed">Claude Sonnet 4.5 & vector search analyze local market demand and scan MUDRA, PMEGP, and state schemes.</p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:shadow-md transition-shadow relative">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold text-sm flex items-center justify-center mb-4">3</div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Download DPR & Apply to Bank</h3>
              <p className="text-slate-600 text-sm leading-relaxed">Get a complete Detailed Project Report (DPR), affordable EMI loan structures, and 7-day shareable report links.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-400 py-12 mt-auto">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-xs font-medium">© 2026 UnnatE • Smart India Hackathon (SIH26091) Submission.</p>
          <p className="text-[11px] text-slate-500 mt-2">AI-Driven Hyper-Local Business Advisory and Financial Structuring Assistant for Rural Micro-Entrepreneurs.</p>
        </div>
      </footer>
    </div>
  );
}
