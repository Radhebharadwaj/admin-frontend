"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

import { useAuthStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";

export default function SignOutButton() {
  const router = useRouter();
  const { setSessionToken, setUser } = useAuthStore();

  const handleSignOut = async () => {
    // Sign out from Supabase
    await supabase.auth.signOut();
    
    // Clear Zustand store
    setSessionToken(null);
    setUser(null);
    
    // Redirect to home page
    router.push("/");
  };

  return (
    <button 
      onClick={handleSignOut}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 font-medium transition-colors"
    >
      <LogOut className="w-5 h-5" />
      Sign Out
    </button>
  );
}
