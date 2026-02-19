"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Users, BookOpen, GraduationCap, Settings, Menu, X } from "lucide-react";
import SignOutButton from "@/components/admin/SignOutButton";
import { useAuthStore } from "@/lib/store";
import { getAdminProfile } from "@/lib/api";
import { supabase } from "@/lib/supabase";

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  const { sessionToken, setSessionToken, user, setUser } = useAuthStore();
  const [debugError, setDebugError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionToken) {
      setDebugError("NO SESSION TOKEN — redirecting to login");
      router.push("/");
      return;
    }

    if (!user) {
      setDebugError(`Calling API... Token: ${sessionToken.substring(0, 20)}...`);
      getAdminProfile().then((res) => {
        if (res.success && res.data) {
          setUser(res.data);
          setDebugError(null);
          setLoading(false);
        } else {
          setDebugError(`API returned failure: ${JSON.stringify(res)}`);
          // Don't redirect for now — show debug info
          setLoading(false);
        }
      }).catch((err) => {
        setDebugError(`API CATCH ERROR: ${err?.message || String(err)}`);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [sessionToken, user, setUser, router]);

  if (debugError && !user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-8">
        <div className="max-w-2xl w-full bg-zinc-900 border border-red-500/30 rounded-xl p-6">
          <h2 className="text-red-400 text-lg font-bold mb-4">🔍 Debug Info (temporary)</h2>
          <pre className="text-green-400 text-sm whitespace-pre-wrap break-all">{debugError}</pre>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const role = user?.role || "UNKNOWN";

  const isActive = (path: string) => {
    if (path === "/admin") return pathname === path;
    return pathname.startsWith(path);
  };

  const getLinkClasses = (path: string) => {
    const base = "flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors";
    return isActive(path)
      ? `${base} bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400`
      : `${base} text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white`;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] flex">
      {/* Sidebar - Mobile Drawer & Desktop Fixed */}
      <aside 
        className={`${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white dark:bg-[#111] border-r border-slate-200 dark:border-white/10 flex flex-col transition-transform duration-300 ease-in-out`}
      >
        <div className="h-16 px-6 border-b border-slate-200 dark:border-white/10 flex items-center justify-between shrink-0">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white">
              Qudu<span className="text-indigo-600 dark:text-indigo-400">Admin</span>
            </span>
          </Link>
          <button className="lg:hidden text-slate-500 hover:text-slate-900 dark:hover:text-white" onClick={() => setIsSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <Link onClick={() => setIsSidebarOpen(false)} href="/admin" className={getLinkClasses("/admin")}>
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </Link>
          <Link onClick={() => setIsSidebarOpen(false)} href="/admin/universities" className={getLinkClasses("/admin/universities")}>
            <GraduationCap className="w-5 h-5" />
            Universities
          </Link>
          <Link onClick={() => setIsSidebarOpen(false)} href="/admin/subjects" className={getLinkClasses("/admin/subjects")}>
            <BookOpen className="w-5 h-5" />
            Subjects
          </Link>
          
          {role === "SUPER_ADMIN" && (
            <Link onClick={() => setIsSidebarOpen(false)} href="/admin/team" className={getLinkClasses("/admin/team")}>
              <Users className="w-5 h-5" />
              Team
            </Link>
          )}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-white/10 space-y-1 shrink-0">
          {role === "SUPER_ADMIN" && (
            <Link onClick={() => setIsSidebarOpen(false)} href="/admin/settings" className={getLinkClasses("/admin/settings")}>
              <Settings className="w-5 h-5" />
              Settings
            </Link>
          )}
          <SignOutButton />
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        {/* Top Header */}
        <header className="h-16 shrink-0 bg-white dark:bg-[#111] border-b border-slate-200 dark:border-white/10 flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest hidden sm:block">
              Internal Operations
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-slate-900 dark:text-white">Admin User</p>
              <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold">{role}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm">
              A
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
