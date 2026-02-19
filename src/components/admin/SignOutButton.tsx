"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SignOutButton() {
  const router = useRouter();

  const handleSignOut = () => {
    // Delete the admin session cookie by setting its expiration date to the past
    document.cookie = "qudu_admin_session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
    
    // Redirect to home page
    router.push("/");
    router.refresh(); // Refresh the router to update server components state
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
