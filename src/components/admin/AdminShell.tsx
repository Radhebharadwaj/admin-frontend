"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  GraduationCap,
  Settings,
  Menu,
  X,
  Library,
  FileText,
} from "lucide-react";
import SignOutButton from "@/components/admin/SignOutButton";
import ToastContainer from "@/components/admin/ToastContainer";
import { useAuthStore } from "@/lib/store";
import { getAdminProfile } from "@/lib/api";
import { canView, type Role } from "@/lib/rbac";

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  const { sessionToken, setSessionToken, user, setUser } = useAuthStore();

  useEffect(() => {
    if (!sessionToken) {
      router.push("/");
      return;
    }

    if (!user) {
      getAdminProfile()
        .then((res) => {
          if (res.success && res.data) {
            setUser(res.data);
            setLoading(false);
          } else {
            router.push("/unauthorized");
          }
        })
        .catch(() => {
          router.push("/unauthorized");
        });
    } else {
      setLoading(false);
    }
  }, [sessionToken, user, setUser, router]);

  // Removed early return to ensure the shell never unmounts

  const role = (user?.role || "GUEST") as Role;

  const isActive = (path: string) => {
    if (path === "/admin") return pathname === path;
    return pathname.startsWith(path);
  };

  const getLinkClasses = (path: string) => {
    const base =
      "flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors";
    return isActive(path)
      ? `${base} bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400`
      : `${base} text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white`;
  };

  const navItems = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard, entity: null },
    { href: "/admin/universities", label: "Universities", icon: GraduationCap, entity: "universities" as const },
    { href: "/admin/subjects", label: "Subjects", icon: BookOpen, entity: "subjects" as const },
    { href: "/admin/team", label: "Team", icon: Users, entity: "team" as const },
  ];

  const roleLabel = role.replace(/_/g, " ");
  const roleColor =
    role === "SUPER_ADMIN"
      ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
      : role === "CONTENT_MANAGER"
      ? "text-blue-400 bg-blue-500/10 border-blue-500/20"
      : "text-zinc-400 bg-zinc-800 border-zinc-700";

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
          <button
            className="lg:hidden text-slate-500 hover:text-slate-900 dark:hover:text-white"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems
            .filter((item) => item.entity === null || canView(role, item.entity))
            .map((item) => (
              <Link
                key={item.href}
                onClick={() => setIsSidebarOpen(false)}
                href={item.href}
                className={getLinkClasses(item.href)}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            ))}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-white/10 space-y-3 shrink-0">
          {/* User Info */}
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm shrink-0">
              {(user?.member_name || user?.email || "A").charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                {user?.member_name || user?.email || "Admin"}
              </p>
              <span
                className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider border ${roleColor}`}
              >
                {roleLabel}
              </span>
            </div>
          </div>

          {canView(role, "settings") && (
            <Link
              onClick={() => setIsSidebarOpen(false)}
              href="/admin/settings"
              className={getLinkClasses("/admin/settings")}
            >
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
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                {user?.member_name || user?.email || "Admin User"}
              </p>
              <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold">
                {roleLabel}
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm">
              {(user?.member_name || user?.email || "A").charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-[#0a0a0a] p-4 lg:p-6 relative">
          <ToastContainer />
          {loading ? (
            <div className="flex-1 flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            children
          )}
        </div>
      </main>
    </div>
  );
}
