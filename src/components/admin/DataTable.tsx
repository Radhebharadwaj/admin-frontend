"use client";

import React from "react";

interface DataTableProps {
  headers: string[];
  children: React.ReactNode;
  emptyIcon?: React.ComponentType<{ className?: string }>;
  emptyText?: string;
  /** Number of rows — used to show empty state when 0 */
  rowCount?: number;
}

export default function DataTable({
  headers,
  children,
  emptyIcon: EmptyIcon,
  emptyText = "No records found.",
  rowCount,
}: DataTableProps) {
  return (
    <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-800/80 bg-zinc-900/20">
              {headers.map((h, i) => (
                <th
                  key={i}
                  className={`px-6 py-4 text-[11px] font-bold text-zinc-500 uppercase tracking-wider ${
                    i === headers.length - 1 ? "text-right" : ""
                  }`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/40">
            {rowCount === 0 && EmptyIcon ? (
              <tr>
                <td colSpan={headers.length} className="px-6 py-20">
                  <div className="flex flex-col items-center justify-center text-zinc-600">
                    <EmptyIcon className="w-12 h-12 mb-3 opacity-30" />
                    <p className="text-sm font-medium">{emptyText}</p>
                  </div>
                </td>
              </tr>
            ) : (
              children
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
