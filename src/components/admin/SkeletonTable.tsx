"use client";

import { Loader2 } from "lucide-react";

export default function SkeletonTable() {
  return (
    <div className="w-full bg-zinc-900/40 border border-zinc-800/80 rounded-2xl overflow-hidden animate-pulse">
      {/* Table Header Skeleton */}
      <div className="h-12 bg-zinc-800/50 border-b border-zinc-800/80 px-6 flex items-center gap-4">
        <div className="h-4 bg-zinc-700/50 rounded w-1/4" />
        <div className="h-4 bg-zinc-700/50 rounded w-1/4" />
        <div className="h-4 bg-zinc-700/50 rounded w-1/4" />
        <div className="h-4 bg-zinc-700/50 rounded w-1/4" />
      </div>
      {/* Table Rows Skeleton */}
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-20 border-b border-zinc-800/50 px-6 flex items-center gap-4">
          <div className="flex items-center gap-3 w-1/4">
            <div className="w-10 h-10 bg-zinc-700/50 rounded-lg shrink-0" />
            <div className="space-y-2 w-full">
              <div className="h-4 bg-zinc-700/50 rounded w-3/4" />
              <div className="h-3 bg-zinc-700/30 rounded w-1/2" />
            </div>
          </div>
          <div className="h-4 bg-zinc-700/30 rounded w-1/4" />
          <div className="h-6 bg-zinc-700/30 rounded-full w-16" />
          <div className="h-8 bg-zinc-700/30 rounded w-20 ml-auto" />
        </div>
      ))}
    </div>
  );
}
