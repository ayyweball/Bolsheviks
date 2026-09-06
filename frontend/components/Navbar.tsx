'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/i18n/useLanguage';
import { useAppStore } from '@/lib/store';
import { Globe, LogOut, User as UserIcon, TrendingUp, Sparkles } from 'lucide-react';

export default function Navbar() {
  const { language, setLanguage, t } = useLanguage();
  const { user, logout } = useAppStore();
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    logout();
    router.push('/');
  };

  const isAuthPage = pathname?.startsWith('/auth');

  return (
    <header className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* UnnatE Logo matching screenshot 1 */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-700 to-green-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <TrendingUp className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-extrabold tracking-tight text-slate-900 leading-none">
              Unnat<span className="text-emerald-600">E</span>
            </span>
            <span className="text-[10px] font-semibold text-slate-500 tracking-wider uppercase mt-0.5">
              {t('brandTagline')}
            </span>
          </div>
        </Link>

        {/* Center Nav Links for Landing Page */}
        {!isAuthPage && !pathname?.startsWith('/dashboard') && !pathname?.startsWith('/advisory') && !pathname?.startsWith('/chat') && (
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <Link href="#how-it-works" className="hover:text-emerald-600 transition-colors">
              {t('nav.howItWorks')}
            </Link>
            <Link href="#analysis" className="hover:text-emerald-600 transition-colors">
              {t('nav.analysis')}
            </Link>
            <Link href="#entrepreneurs" className="hover:text-emerald-600 transition-colors">
              {t('nav.forEntrepreneurs')}
            </Link>
            <Link href="#about" className="hover:text-emerald-600 transition-colors">
              {t('nav.aboutUs')}
            </Link>
          </nav>
        )}

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          
          {/* Hindi / English Language Toggle */}
          <button
            onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 font-semibold text-xs transition-all border border-slate-200"
            title="Switch Language / भाषा बदलें"
          >
            <Globe className="w-4 h-4 text-emerald-600" />
            <span>{language === 'en' ? 'EN | हिन्दी' : 'हिन्दी | EN'}</span>
          </button>

          {user ? (
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 font-semibold text-xs hover:bg-emerald-100 transition-colors"
              >
                <UserIcon className="w-4 h-4" />
                <span>{user.name}</span>
              </Link>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                title={t('nav.logout')}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/auth/register"
                className="hidden sm:inline-flex items-center justify-center px-4 py-2 text-xs font-semibold text-slate-700 hover:text-emerald-700 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/auth/register"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-900 text-white font-semibold text-xs hover:bg-emerald-700 shadow-sm transition-all"
              >
                <span>{t('tryItFree')}</span>
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              </Link>
            </div>
          )}

        </div>
      </div>
    </header>
  );
}
