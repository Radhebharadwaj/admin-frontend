import Link from "next/link";
import { FileQuestion, Home } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function AdminNotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] animate-in fade-in zoom-in duration-500">
      <div className="w-24 h-24 mb-8 bg-indigo-50 dark:bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 border-8 border-white dark:border-[#111] shadow-xl shadow-indigo-500/10">
        <FileQuestion className="w-10 h-10" />
      </div>
      
      <div className="text-center max-w-md mx-auto">
        <span className="px-4 py-1.5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-sm font-bold rounded-full uppercase tracking-widest mb-6 inline-block">
          Error 404
        </span>
        <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4 leading-tight">
          Resource Not Found
        </h1>
        <p className="text-lg text-slate-500 dark:text-slate-400 mb-10 leading-relaxed">
          The admin resource you are looking for does not exist, has been moved, or you don't have the required permissions to access it.
        </p>
        
        <Link href="/admin">
          <Button className="h-12 px-8 rounded-xl text-base font-bold bg-indigo-600 hover:bg-indigo-700 text-white border-0 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all hover:-translate-y-0.5">
            <Home className="w-5 h-5 mr-2" />
            Return to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
