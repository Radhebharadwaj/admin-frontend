import Link from "next/link";
import { ShieldAlert, ArrowRight } from "lucide-react";

export default function UnauthorizedPage() {
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
          
          <Link 
            href="/"
            className="block text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Return to Admin Login
          </Link>
        </div>
      </div>
    </div>
  );
}
