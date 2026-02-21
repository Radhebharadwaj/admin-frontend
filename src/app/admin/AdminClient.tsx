"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GraduationCap, BookOpen, Library, Users, TrendingUp } from "lucide-react";
import { getDashboardStats } from "@/lib/api";
import { useAuthStore } from "@/lib/store";

export default function AdminClient() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({ universities: 0, courses: 0, subjects: 0, teamMembers: 0, totalSales: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats()
      .then((statsRes) => {
        if (statsRes.success && statsRes.data) {
          setStats((prev) => ({ ...prev, ...statsRes.data }));
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="w-full h-96 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  return (
    <div className="animate-in fade-in duration-500 max-w-7xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight">Dashboard Overview</h1>
        <p className="text-slate-500 dark:text-slate-400">Welcome back to the QuduHub internal operations center.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        
        {/* Card 1: Universities */}
        <Link 
          href="/admin/universities" 
          className="group relative p-6 bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl shadow-sm hover:shadow-indigo-500/10 hover:border-indigo-500/40 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <GraduationCap className="w-24 h-24 text-indigo-500 transform rotate-12" />
          </div>
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-indigo-400" />
              </div>
              <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Universities</p>
            </div>
            <p className="text-4xl font-bold tracking-tight text-white">{stats.universities}</p>
          </div>
        </Link>

        {/* Card 2: Courses */}
        <div 
          className="group relative p-6 bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl shadow-sm hover:shadow-blue-500/10 hover:border-blue-500/40 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <BookOpen className="w-24 h-24 text-blue-500 transform rotate-12" />
          </div>
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-blue-400" />
              </div>
              <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Courses</p>
            </div>
            <p className="text-4xl font-bold tracking-tight text-white">{stats.courses}</p>
          </div>
        </div>

        {/* Card 3: Subjects */}
        <div 
          className="group relative p-6 bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl shadow-sm hover:shadow-amber-500/10 hover:border-amber-500/40 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Library className="w-24 h-24 text-amber-500 transform rotate-12" />
          </div>
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Library className="w-5 h-5 text-amber-400" />
              </div>
              <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Subjects</p>
            </div>
            <p className="text-4xl font-bold tracking-tight text-white">{stats.subjects}</p>
          </div>
        </div>

        {/* Card 4: Team Members (Conditional) */}
        {isSuperAdmin && (
          <div 
            className="group relative p-6 bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl shadow-sm hover:shadow-fuchsia-500/10 hover:border-fuchsia-500/40 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Users className="w-24 h-24 text-fuchsia-500 transform rotate-12" />
            </div>
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-fuchsia-500/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-fuchsia-400" />
                </div>
                <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Team</p>
              </div>
              <p className="text-4xl font-bold tracking-tight text-white">{stats.teamMembers || 0}</p>
            </div>
          </div>
        )}

        {/* Card 5: Total Sales (Conditional) - Spans 2 columns if on large screens to fit Bento style */}
        {isSuperAdmin && (
          <div 
            className="group relative p-6 bg-zinc-900/50 backdrop-blur-sm border border-emerald-500/20 rounded-2xl shadow-sm hover:shadow-[0_0_30px_-5px_rgba(16,185,129,0.3)] hover:border-emerald-500/50 transition-all duration-300 hover:-translate-y-1 overflow-hidden md:col-span-2 lg:col-span-2 xl:col-span-2"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <TrendingUp className="w-32 h-32 text-emerald-500 transform rotate-12" />
            </div>
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                </div>
                <p className="text-sm font-semibold text-emerald-500 uppercase tracking-wider">Total Revenue</p>
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-5xl font-extrabold tracking-tight text-[#00ff88] drop-shadow-[0_0_10px_rgba(0,255,136,0.3)]">
                  ₹{stats.totalSales.toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}