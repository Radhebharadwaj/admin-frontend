export const runtime = 'edge';

import PublicNavbar from "@/components/public/PublicNavbar";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col selection:bg-indigo-500/30">
      <PublicNavbar />

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {children}
      </main>
    </div>
  );
}
