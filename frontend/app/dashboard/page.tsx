'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { useLanguage } from '@/lib/i18n/useLanguage';
import { useAppStore } from '@/lib/store';
import {
  TrendingUp,
  Landmark,
  BadgeIndianRupee,
  ShieldCheck,
  Plus,
  MapPin,
  Search,
  ArrowUpRight,
  Sun,
  FileSpreadsheet,
  ChevronRight,
  Share2,
  Download,
  CloudSun,
  Compass,
  CheckCircle2
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

// Data for Growth Projection Chart (matching screenshot 2)
const growthData = [
  { year: 'Year 1', revenue: 10 },
  { year: 'Year 2', revenue: 18.4 },
  { year: 'Year 3', revenue: 35 },
];

// Data for Funding Sources Pie Chart (matching screenshot 2)
const fundingData = [
  { name: 'Government Schemes', value: 45, color: '#22c55e' },
  { name: 'Bank Loans', value: 30, color: '#3b82f6' },
  { name: 'Subsidies', value: 15, color: '#0ea5e9' },
  { name: 'Self Investment', value: 10, color: '#f59e0b' },
];

const DEFAULT_DISTRICT_MAP: Record<string, string> = {
  'Uttar Pradesh': 'Lucknow',
  'Rajasthan': 'Jaipur',
  'Bihar': 'Patna',
  'Madhya Pradesh': 'Bhopal',
  'Maharashtra': 'Pune',
};

export default function DashboardPage() {
  const { t } = useLanguage();
  const { user, setUser } = useAppStore();
  const [selectedState, setSelectedState] = useState('Uttar Pradesh');
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [districtResearch, setDistrictResearch] = useState<any>(null);
  const [programCount, setProgramCount] = useState<number>(60);

  useEffect(() => {
    // Fetch profile and user businesses
    fetch('/api/user/profile')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
          setSelectedState(data.user.state || 'Uttar Pradesh');
        }
      })
      .catch(() => {});

    fetch('/api/businesses')
      .then((res) => res.json())
      .then((data) => {
        if (data.businesses) setBusinesses(data.businesses);
      })
      .finally(() => setLoading(false));

    // Fetch authoritative programme count from FastAPI
    fetch('/api/schemes?limit=1')
      .then((res) => res.json())
      .then((data) => {
        if (data.count) setProgramCount(data.count);
      })
      .catch(() => {});
  }, [setUser]);

  // Fetch unified district research context when state changes
  useEffect(() => {
    const targetDistrict = user?.district || DEFAULT_DISTRICT_MAP[selectedState] || 'Lucknow';
    fetch(`/api/research/district-market-context?state_name=${encodeURIComponent(selectedState)}&district_name=${encodeURIComponent(targetDistrict)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) {
          setDistrictResearch(data);
        }
      })
      .catch((err) => console.warn('Could not fetch district research context:', err));
  }, [selectedState, user?.district]);

  const market = districtResearch?.msme_market_context;
  const weather = districtResearch?.weather_context;
  const observations = districtResearch?.research_observations || [];
  const activeDistrictName = districtResearch?.district_name || DEFAULT_DISTRICT_MAP[selectedState] || 'District';

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <Navbar />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar />

        <main className="flex-1 p-6 space-y-6">
          
          {/* Top Bar with Search & Location */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search schemes, markets, or ask anything... (Ctrl K)"
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <select
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  className="bg-transparent font-bold focus:outline-none cursor-pointer"
                >
                  <option value="Uttar Pradesh">Uttar Pradesh</option>
                  <option value="Rajasthan">Rajasthan</option>
                  <option value="Bihar">Bihar</option>
                  <option value="Madhya Pradesh">Madhya Pradesh</option>
                  <option value="Maharashtra">Maharashtra</option>
                </select>
              </div>

              <Link
                href="/advisory/business-plan"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>{t('dashboard.startNewAnalysis')}</span>
              </Link>
            </div>
          </div>

          {/* Greeting Banner */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
                <span>{t('dashboard.greeting')}</span>
                <Sun className="w-6 h-6 text-amber-500 fill-amber-400" />
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Market intelligence & statutory assistance overview for {activeDistrictName}, {selectedState}.
              </p>
            </div>
          </div>

          {/* 4 Quick Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Market Demand / Density Card (Empirical Udyam Records) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                  {market?.state_rank_by_enterprises ? `Rank #${market.state_rank_by_enterprises}` : 'High'}
                </span>
              </div>
              <div className="text-xs font-medium text-slate-500">{t('dashboard.marketDemand')}</div>
              <div className="text-xl font-black text-slate-900 mt-1">
                {market?.total_enterprises ? `${(market.total_enterprises / 1000).toFixed(1)}k MSMEs` : 'Strong'}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {market?.district_share_of_state_pct 
                  ? `${market.district_share_of_state_pct.toFixed(1)}% of state enterprise base` 
                  : 'Official Udyam records'}
              </p>
            </div>

            {/* Relevant Schemes Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Landmark className="w-5 h-5" />
                </div>
                <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold">
                  {programCount > 0 ? `${programCount}` : '60+'}
                </span>
              </div>
              <div className="text-xs font-medium text-slate-500">{t('dashboard.relevantSchemes')}</div>
              <div className="text-xl font-black text-slate-900 mt-1">
                {programCount > 0 ? `${programCount} Programmes` : '60 Available'}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Central Sector & Centrally Sponsored</p>
            </div>

            {/* Estimated Funding Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <BadgeIndianRupee className="w-5 h-5" />
                </div>
                <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 text-[11px] font-bold">Max ₹10L-₹1Cr</span>
              </div>
              <div className="text-xs font-medium text-slate-500">{t('dashboard.estimatedFunding')}</div>
              <div className="text-xl font-black text-slate-900 mt-1">₹10L - ₹50L+</div>
              <p className="text-[11px] text-slate-400 mt-1">MUDRA, PMEGP & Capital Subsidies</p>
            </div>

            {/* Climate & Environmental Context Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  {weather?.current_weather ? <CloudSun className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                </div>
                <span className="px-2.5 py-1 rounded-full bg-purple-100 text-purple-800 text-[11px] font-bold">
                  {weather?.current_weather ? 'Live Context' : '78%'}
                </span>
              </div>
              <div className="text-xs font-medium text-slate-500">
                {weather?.current_weather ? 'Local Weather Signal' : t('dashboard.businessReadiness')}
              </div>
              <div className="text-xl font-black text-slate-900 mt-1">
                {weather?.current_weather?.temperature_c !== undefined 
                  ? `${Math.round(weather.current_weather.temperature_c)}°C • ${weather.current_weather.condition_description || 'Clear'}`
                  : '78 / 100'}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {weather?.current_weather?.wind_speed_kmh !== undefined 
                  ? `Wind ${Math.round(weather.current_weather.wind_speed_kmh)} km/h • Humidity ${weather.current_weather.relative_humidity_pct}%` 
                  : 'Good potential, Minor gaps to fill'}
              </p>
            </div>

          </div>

          {/* Research Observations Banner if available from FastAPI */}
          {observations.length > 0 && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                <Compass className="w-4 h-4 text-emerald-600" />
                <span>Empirical District Research Intelligence ({activeDistrictName}, {selectedState})</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {observations.slice(0, 4).map((obs: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{obs}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Visual Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Growth Projection Line Chart (2 Cols) */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{t('dashboard.growthProjection')}</h3>
                  <p className="text-[11px] text-slate-500">Estimated revenue based on local market analysis</p>
                </div>
                <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-lg">3 Years</span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={growthData}>
                    <XAxis dataKey="year" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `₹${v}L`} />
                    <Tooltip formatter={(value: any) => [`₹${value} Lakhs`, 'Revenue']} />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#16a34a"
                      strokeWidth={3}
                      dot={{ r: 5, fill: '#16a34a', strokeWidth: 2, stroke: '#fff' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Funding Sources Donut Chart (1 Col) */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="mb-4">
                <h3 className="text-sm font-bold text-slate-900">{t('dashboard.fundingSources')}</h3>
                <p className="text-[11px] text-slate-500">Optimal financial capital structure</p>
              </div>

              <div className="h-52 w-full relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={fundingData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {fundingData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val: any) => [`${val}%`, 'Share']} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-base font-extrabold text-slate-900">₹58.4L</span>
                  <span className="text-[10px] font-semibold text-slate-400">Potential</span>
                </div>
              </div>

              {/* Legend List */}
              <div className="space-y-1.5 mt-2">
                {fundingData.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="font-medium text-slate-600">{item.name}</span>
                    </div>
                    <span className="font-bold text-slate-900">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* User Businesses & Recent Advisories Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">{t('dashboard.recentAdvisories')}</h3>
              <Link href="/advisory/business-plan" className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1">
                New Plan <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {businesses.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                <FileSpreadsheet className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p>No business plans generated yet.</p>
                <Link href="/advisory/business-plan" className="mt-3 inline-block px-4 py-2 rounded-xl bg-emerald-700 text-white font-bold text-xs">
                  Create First Plan
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                      <th className="pb-3">Business Type</th>
                      <th className="pb-3">Capital Target</th>
                      <th className="pb-3">Created Date</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {businesses.map((b, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-3 font-bold text-slate-900 capitalize">{b.type}</td>
                        <td className="py-3 text-slate-700">₹{b.estimatedCapital?.toLocaleString('en-IN')}</td>
                        <td className="py-3 text-slate-500">{new Date(b.createdAt).toLocaleDateString()}</td>
                        <td className="py-3 text-right space-x-2">
                          <Link
                            href={`/dashboard/businesses/${b.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-semibold hover:bg-emerald-100 transition-colors"
                          >
                            <span>View Details</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </main>
      </div>
    </div>
  );
}
