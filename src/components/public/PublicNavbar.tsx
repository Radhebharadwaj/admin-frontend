"use client";

import { BookOpen } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function PublicNavbar() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 group-hover:bg-indigo-500/20 transition-colors">
                <BookOpen className="w-5 h-5 text-indigo-400" />
              </div>
              <span className="font-bold text-lg tracking-tight text-white">
                Qudu<span className="text-indigo-400">Hub</span>
              </span>
            </Link>
          </div>

          {/* Search (Visual Only for now) */}
          <div className="hidden md:block flex-1 max-w-md mx-8">
            <div className="relative group">
              <input
                type="text"
                placeholder="Search for subjects, topics, or materials..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-full py-2 pl-4 pr-10 text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 bg-zinc-800 rounded text-[10px] font-medium text-zinc-400">
                ⌘K
              </div>
            </div>
          </div>

          {/* Right Nav */}
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-sm font-medium text-white hover:text-indigo-400 transition-colors"
                >
                  My Library
                </Link>
                <button
                  onClick={() => supabase.auth.signOut()}
                  className="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                href="/auth"
                className="text-sm font-medium bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
