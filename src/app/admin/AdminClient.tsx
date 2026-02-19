"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  GraduationCap,
  BookOpen,
  Library,
  Users,
  TrendingUp,
  ChevronDown,
  Trophy,
  BarChart3,
  ArrowUpRight,
  IndianRupee,
  ShoppingCart,
} from "lucide-react";
import dynamic from "next/dynamic";
import { getDashboardStats, fetchApi } from "@/lib/api";
import { useAuthStore } from "@/lib/store";

// ===== TYPES =====
interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  chartData: { date: string; revenue: number; orders: number }[];
  topPerformers: { id: string; title: string; revenue: number; orders: number }[];
}

type Timeframe = "7d" | "30d" | "1y" | "all";
const TIMEFRAME_LABELS: Record<Timeframe, string> = {
  "7d": "This Week",
  "30d": "This Month",
  "1y": "This Year",
  all: "All Time",
};

// ===== SKELETON COMPONENTS =====
function SkeletonCard() {
  return (
    <div className="relative p-6 bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl overflow-hidden">
      <div className="animate-pulse space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-800" />
          <div className="h-3 w-24 bg-zinc-800 rounded-full" />
        </div>
        <div className="h-8 w-20 bg-zinc-800 rounded-lg" />
      </div>
    </div>
  );
}

function SkeletonRevenueCard() {
  return (
    <div className="relative p-6 bg-zinc-900/50 backdrop-blur-sm border border-emerald-500/20 rounded-2xl overflow-hidden md:col-span-2 lg:col-span-2 xl:col-span-2">
      <div className="animate-pulse space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-800" />
          <div className="h-3 w-32 bg-zinc-800 rounded-full" />
        </div>
        <div className="h-10 w-40 bg-zinc-800 rounded-lg" />
      </div>
    </div>
  );
}

function SkeletonChart() {
  return (
    <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6">
      <div className="animate-pulse">
        <div className="flex items-center justify-between mb-6">
          <div className="h-5 w-40 bg-zinc-800 rounded-full" />
          <div className="h-9 w-32 bg-zinc-800 rounded-xl" />
        </div>
        <div className="h-[320px] bg-zinc-800/40 rounded-xl flex items-end gap-1 p-4 pt-8">
          {[40, 65, 45, 80, 55, 70, 90, 60, 75, 85, 50, 95].map((h, i) => (
            <div
              key={i}
              className="flex-1 bg-zinc-700/50 rounded-t-md animate-pulse"
              style={{ height: `${h}%`, animationDelay: `${i * 100}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function SkeletonLeaderboard() {
  return (
    <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6">
      <div className="animate-pulse">
        <div className="h-5 w-52 bg-zinc-800 rounded-full mb-6" />
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-zinc-800" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-3/4 bg-zinc-800 rounded-full" />
                <div className="h-2.5 w-1/3 bg-zinc-800/60 rounded-full" />
              </div>
              <div className="h-4 w-16 bg-zinc-800 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ===== DYNAMIC IMPORTS =====
const AnalyticsChart = dynamic(() => import("@/components/admin/AnalyticsChart"), {
  ssr: false,
  loading: () => <SkeletonChart />
});

// ===== MAIN COMPONENT =====
export default function AdminClient() {
  const { user } = useAuthStore();

  // Dashboard stats
  const [stats, setStats] = useState({
    universities: 0,
    courses: 0,
    subjects: 0,
    teamMembers: 0,
    totalSales: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // Analytics
  const [timeframe, setTimeframe] = useState<Timeframe>("30d");
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [tfDropdownOpen, setTfDropdownOpen] = useState(false);

  // Fetch dashboard stats
  useEffect(() => {
    getDashboardStats()
      .then((res) => {
        if (res.success && res.data) {
          setStats((prev) => ({ ...prev, ...res.data }));
        }
        setStatsLoading(false);
      })
      .catch(() => setStatsLoading(false));
  }, []);

  // Fetch analytics on timeframe change
  useEffect(() => {
    setAnalyticsLoading(true);
    fetchApi(`/api/analytics?timeframe=${timeframe}`)
      .then((res) => {
        if (res.success && res.data) {
          setAnalytics(res.data);
        }
        setAnalyticsLoading(false);
      })
      .catch(() => setAnalyticsLoading(false));
  }, [timeframe]);

  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  return (
    <div className="max-w-7xl mx-auto pb-20">
      {/* Header */}
      <div className="mb-10 animate-in fade-in duration-500">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight">
          Dashboard Overview
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Welcome back to the QuduHub internal operations center.
        </p>
      </div>

      {/* ===== METRIC CARDS ===== */}
      {statsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-10">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          {isSuperAdmin && <SkeletonCard />}
          {isSuperAdmin && <SkeletonRevenueCard />}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-10">
          {/* Universities — Clickable */}
          <Link
            href="/admin/universities"
            className="group relative p-6 bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl shadow-sm hover:shadow-indigo-500/10 hover:border-indigo-500/40 transition-all duration-300 hover:-translate-y-1 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <GraduationCap className="w-24 h-24 text-indigo-500 transform rotate-12" />
            </div>
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-indigo-400" />
                </div>
                <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">
                  Universities
                </p>
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-4xl font-bold tracking-tight text-white">
                  {stats.universities}
                </p>
                <ArrowUpRight className="w-4 h-4 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </Link>

          {/* Courses — Analytical */}
          <div className="group relative p-6 bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 delay-75">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <BookOpen className="w-24 h-24 text-blue-500 transform rotate-12" />
            </div>
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-blue-400" />
                </div>
                <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">
                  Courses
                </p>
              </div>
              <p className="text-4xl font-bold tracking-tight text-white">
                {stats.courses}
              </p>
            </div>
          </div>

          {/* Subjects — Analytical */}
          <div className="group relative p-6 bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Library className="w-24 h-24 text-amber-500 transform rotate-12" />
            </div>
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <Library className="w-5 h-5 text-amber-400" />
                </div>
                <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">
                  Subjects
                </p>
              </div>
              <p className="text-4xl font-bold tracking-tight text-white">
                {stats.subjects}
              </p>
            </div>
          </div>

          {/* Team — Analytical */}
          {isSuperAdmin && (
            <div className="group relative p-6 bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Users className="w-24 h-24 text-fuchsia-500 transform rotate-12" />
              </div>
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-fuchsia-500/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-fuchsia-400" />
                  </div>
                  <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">
                    Team
                  </p>
                </div>
                <p className="text-4xl font-bold tracking-tight text-white">
                  {stats.teamMembers || 0}
                </p>
              </div>
            </div>
          )}

          {/* Total Revenue — Analytical, Neon */}
          {isSuperAdmin && (
            <div className="group relative p-6 bg-zinc-900/50 backdrop-blur-sm border border-emerald-500/20 rounded-2xl shadow-sm hover:shadow-[0_0_30px_-5px_rgba(16,185,129,0.3)] hover:border-emerald-500/50 transition-all duration-300 overflow-hidden md:col-span-2 lg:col-span-2 xl:col-span-2 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <TrendingUp className="w-32 h-32 text-emerald-500 transform rotate-12" />
              </div>
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                  </div>
                  <p className="text-sm font-semibold text-emerald-500 uppercase tracking-wider">
                    Total Revenue
                  </p>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-5xl font-extrabold tracking-tight text-[#00ff88] drop-shadow-[0_0_10px_rgba(0,255,136,0.3)]">
                    ₹{stats.totalSales.toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== ANALYTICS SECTION ===== */}
      {isSuperAdmin && (
        <div className="space-y-6">
          {/* Revenue Chart */}
          {analyticsLoading ? (
            <>
              <SkeletonChart />
              <SkeletonLeaderboard />
            </>
          ) : (
            <>
              {/* Chart Container */}
              <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Chart Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                      <BarChart3 className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">
                        Revenue Analytics
                      </h3>
                      <p className="text-xs text-zinc-500">
                        {analytics?.totalOrders || 0} orders · ₹
                        {(analytics?.totalRevenue || 0).toLocaleString("en-IN")}{" "}
                        total
                      </p>
                    </div>
                  </div>

                  {/* Timeframe Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setTfDropdownOpen(!tfDropdownOpen)}
                      className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800/80 border border-zinc-700 rounded-xl text-sm font-medium text-zinc-300 hover:text-white hover:border-zinc-600 transition-all min-w-[140px] justify-between"
                    >
                      {TIMEFRAME_LABELS[timeframe]}
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${
                          tfDropdownOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {tfDropdownOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setTfDropdownOpen(false)}
                        />
                        <div className="absolute right-0 top-12 z-50 w-40 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                          {(
                            Object.entries(TIMEFRAME_LABELS) as [
                              Timeframe,
                              string
                            ][]
                          ).map(([key, label]) => (
                            <button
                              key={key}
                              onClick={() => {
                                setTimeframe(key);
                                setTfDropdownOpen(false);
                              }}
                              className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                                timeframe === key
                                  ? "bg-indigo-500/10 text-indigo-400 font-bold"
                                  : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                              }`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {analytics?.chartData && analytics.chartData.length > 0 ? (
                  <AnalyticsChart data={analytics.chartData} />
                ) : (
                  <div className="h-[320px] flex flex-col items-center justify-center text-zinc-600">
                    <BarChart3 className="w-16 h-16 mb-3 opacity-20" />
                    <p className="text-sm font-medium">
                      No revenue data for this period.
                    </p>
                    <p className="text-xs text-zinc-700 mt-1">
                      Revenue will appear here once purchases are made.
                    </p>
                  </div>
                )}
              </div>

              {/* ===== TOP PERFORMERS LEADERBOARD ===== */}
              <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                    <Trophy className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      Top Performing Products
                    </h3>
                    <p className="text-xs text-zinc-500">
                      Ranked by revenue · {TIMEFRAME_LABELS[timeframe]}
                    </p>
                  </div>
                </div>

                {analytics?.topPerformers &&
                analytics.topPerformers.length > 0 ? (
                  <div className="space-y-3">
                    {analytics.topPerformers.map((item, i) => {
                      const maxRev = analytics.topPerformers[0]?.revenue || 1;
                      const pct = Math.round((item.revenue / maxRev) * 100);
                      const rankColors = [
                        "text-amber-400 bg-amber-500/10 border-amber-500/20",
                        "text-zinc-300 bg-zinc-700/50 border-zinc-600",
                        "text-orange-400 bg-orange-500/10 border-orange-500/20",
                      ];
                      const rankColor =
                        i < 3
                          ? rankColors[i]
                          : "text-zinc-500 bg-zinc-800/50 border-zinc-700";

                      return (
                        <div
                          key={item.id}
                          className="group relative flex items-center gap-4 p-3 rounded-xl hover:bg-zinc-800/30 transition-colors"
                        >
                          {/* Rank Badge */}
                          <div
                            className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold shrink-0 ${rankColor}`}
                          >
                            {i + 1}
                          </div>

                          {/* Product Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">
                              {item.title}
                            </p>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-xs text-zinc-500 flex items-center gap-1">
                                <ShoppingCart className="w-3 h-3" />
                                {item.orders} order
                                {item.orders !== 1 ? "s" : ""}
                              </span>
                              {/* Progress bar */}
                              <div className="flex-1 h-1 bg-zinc-800 rounded-full max-w-[100px]">
                                <div
                                  className="h-full bg-indigo-500/50 rounded-full transition-all duration-700"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Revenue */}
                          <div className="text-right shrink-0">
                            <p className="text-sm font-bold text-emerald-400 flex items-center gap-0.5">
                              <IndianRupee className="w-3.5 h-3.5" />
                              {item.revenue.toLocaleString("en-IN")}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-12 text-center text-zinc-600">
                    <Trophy className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="text-sm font-medium">
                      No sales data for this period.
                    </p>
                    <p className="text-xs text-zinc-700 mt-1">
                      Top sellers will appear here once purchases are recorded.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}