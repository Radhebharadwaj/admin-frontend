"use client";

import { useAuthStore } from "@/lib/store";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";

export default function ToastContainer() {
  const { toasts, removeToast } = useAuthStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((toast) => {
        const isSuccess = toast.type === "success";
        const isError = toast.type === "error";

        return (
          <div
            key={toast.id}
            className={`flex items-start gap-3 w-80 p-4 rounded-xl shadow-lg border backdrop-blur-md animate-in slide-in-from-right-5 fade-in duration-300 ${
              isSuccess
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                : isError
                ? "bg-red-500/10 border-red-500/20 text-red-400"
                : "bg-zinc-800/90 border-zinc-700 text-zinc-300"
            }`}
          >
            {isSuccess && <CheckCircle2 className="w-5 h-5 shrink-0" />}
            {isError && <XCircle className="w-5 h-5 shrink-0" />}
            {!isSuccess && !isError && <Info className="w-5 h-5 shrink-0" />}
            
            <p className="text-sm font-medium flex-1">{toast.message}</p>
            
            <button
              onClick={() => removeToast(toast.id)}
              className="text-current opacity-60 hover:opacity-100 transition-opacity shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
