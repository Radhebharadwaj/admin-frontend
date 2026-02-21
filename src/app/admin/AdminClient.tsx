"use client";

import { useEffect, useState } from "react";
import DataEntryForm from "@/src/components/admin/DataEntryForm";

import { getDashboardStats, getDropdownData } from "@/src/lib/api";

export default function AdminClient() {
  const [stats, setStats] = useState({ universities: 0, courses: 0, subjects: 0, totalSales: 0 });
  const [dropdownData, setDropdownData] = useState({ universities: [], courses: [], subjects: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getDashboardStats(),
      getDropdownData()
    ])
      .then(([statsRes, dropdownRes]) => {
        if (statsRes.success && statsRes.data) setStats(statsRes.data);
        if (dropdownRes.success && dropdownRes.data) setDropdownData(dropdownRes.data);
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

  return (
    <div className="animate-in fade-in duration-500">
      <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">Dashboard Overview</h1>
      <p className="text-slate-500 dark:text-slate-400 mb-8">Welcome back to the QuduHub internal operations center.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="p-6 bg-white dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm">
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Total Universities</p>
          <p className="text-4xl font-extrabold text-slate-900 dark:text-white">{stats.universities}</p>
        </div>
        <div className="p-6 bg-white dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm">
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Total Courses</p>
          <p className="text-4xl font-extrabold text-slate-900 dark:text-white">{stats.courses}</p>
        </div>
        <div className="p-6 bg-white dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm">
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Total Subjects</p>
          <p className="text-4xl font-extrabold text-slate-900 dark:text-white">{stats.subjects}</p>
        </div>
        <div className="p-6 bg-white dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm">
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Total Sales</p>
          <p className="text-4xl font-extrabold text-emerald-600 dark:text-emerald-400">₹{stats.totalSales}</p>
        </div>
      </div>
      
      <div className="mt-12">
        <DataEntryForm dropdownData={dropdownData} />
      </div>
    </div>
  );
}
