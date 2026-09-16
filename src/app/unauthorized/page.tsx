"use client";

import { ShieldAlert, ArrowRight } from "lucide-react";
import { useAuthStore } from "@/lib/store";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import Cookies from "js-cookie";

export default function UnauthorizedPage() {
  const { setSessionToken, setUser } = useAuthStore();

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
      <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center shadow-2xl">
        <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldAlert className="text-rose-500 w-8 h-8" />
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
        <p className="text-zinc-400 mb-8">
          This portal is strictly restricted to authorized QuduHub team members only. 
          Your email address is not registered in the administrative system.
        </p>

        <div className="space-y-4">
          <Link 
            href="https://qudu.in"
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-xl font-semibold transition-all shadow-lg shadow-indigo-600/20"
          >
            Go to Student Portal
            <ArrowRight className="w-4 h-4" />
          </Link>
          
          <button 
            onClick={async () => {
              try {
                // 1. Officially kill the Supabase session
                await supabase.auth.signOut();
                
                // 2. Nuke local/session storage just in case
                setSessionToken(null);
                setUser(null);
                localStorage.clear();
                sessionStorage.clear();
                
                // 3. Critically: Destroy the middleware cookie!
                Cookies.remove('admin-session');
                document.cookie = "admin-session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                
                // 4. Force redirect to the PUBLIC login page (root)
                window.location.href = '/'; 
              } catch (error) {
                Cookies.remove('admin-session');
                document.cookie = "admin-session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                window.location.href = '/'; 
              }
            }}
            className="text-sm text-zinc-400 hover:text-white transition-colors mt-4 block text-center w-full"
          >
            Return to Admin Login
          </button>
        </div>
      </div>
    </div>
  );
}
