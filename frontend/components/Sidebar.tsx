'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/lib/i18n/useLanguage';
import {
  LayoutDashboard,
  Building2,
  BarChart3,
  Landmark,
  BadgeIndianRupee,
  FileSpreadsheet,
  FileText,
  Bot,
  Lightbulb
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const { t } = useLanguage();

  const menuItems = [
    { href: '/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
    { href: '/dashboard/profile', label: t('nav.businessProfile'), icon: Building2 },
    { href: '/advisory/business-plan', label: t('nav.marketAnalysis'), icon: BarChart3 },
    { href: '/advisory/schemes', label: t('nav.governmentSchemes'), icon: Landmark },
    { href: '/advisory/financial', label: t('nav.financialOptions'), icon: BadgeIndianRupee },
    { href: '/advisory/business-plan', label: t('nav.dprBuilder'), icon: FileSpreadsheet },
    { href: '/dashboard', label: t('nav.insightsReports'), icon: FileText },
    { href: '/chat', label: t('nav.aiAdvisor'), icon: Bot },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between hidden md:flex">
      <div className="space-y-1">
        <div className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Main Menu
        </div>
        {menuItems.map((item, idx) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={idx}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs transition-all ${
                isActive
                  ? 'bg-emerald-50 text-emerald-800 font-semibold shadow-sm border border-emerald-100'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Need Guidance Widget matching screenshot 2 bottom left */}
      <div className="mt-8 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/60 rounded-2xl p-4 text-center relative overflow-hidden">
        <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-2 shadow-inner">
          <Lightbulb className="w-5 h-5 fill-amber-400 stroke-amber-700" />
        </div>
        <h4 className="text-xs font-bold text-slate-900 mb-1">{t('dashboard.needGuidance')}</h4>
        <p className="text-[11px] text-slate-500 mb-3">{t('dashboard.askAdvisor')}</p>
        <Link
          href="/chat"
          className="inline-block w-full py-1.5 px-3 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs shadow-sm transition-colors"
        >
          Ask AI Advisor
        </Link>
      </div>
    </aside>
  );
}
