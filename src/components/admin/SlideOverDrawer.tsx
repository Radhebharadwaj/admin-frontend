"use client";

import { X } from "lucide-react";

interface SlideOverDrawerProps {
  title: string;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Optional width override, defaults to max-w-md */
  wide?: boolean;
}

export default function SlideOverDrawer({ title, open, onClose, children, wide }: SlideOverDrawerProps) {
  if (!open) return null;
  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />
      <div
        className={`fixed inset-y-0 right-0 z-50 w-full ${
          wide ? "max-w-lg" : "max-w-md"
        } bg-zinc-950 border-l border-zinc-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300`}
      >
        <div className="flex items-center justify-between p-6 border-b border-zinc-800/60 bg-zinc-950/50 backdrop-blur shrink-0">
          <h2 className="text-lg font-semibold text-white tracking-tight">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">{children}</div>
      </div>
    </>
  );
}
