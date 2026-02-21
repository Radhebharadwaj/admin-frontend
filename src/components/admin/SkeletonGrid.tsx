"use client";

import { Loader2 } from "lucide-react";

export default function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 animate-pulse">
      {[...Array(10)].map((_, i) => (
        <div key={i} className="flex flex-col items-center justify-center p-8 rounded-2xl border bg-zinc-900/40 border-zinc-800/80 h-[170px]">
          <div className="w-12 h-12 rounded-full bg-zinc-800/80 mb-4" />
          <div className="h-4 bg-zinc-700/50 rounded w-2/3 mb-2" />
          <div className="h-3 bg-zinc-800/80 rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}
