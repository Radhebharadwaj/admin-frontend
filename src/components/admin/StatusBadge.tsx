"use client";

export default function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide ${
        active
          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
          : "bg-zinc-800 text-zinc-400 border border-zinc-700"
      }`}
    >
      {active ? "ACTIVE" : "HIDDEN"}
    </span>
  );
}
