"use client";

import useSWR from "swr";
import { Crown, Shield, Edit3, User, Plus, X } from "lucide-react";
import { swrFetcher } from "@/lib/api";

interface TeamMember {
  id: string;
  email: string;
  member_name?: string;
  role: "SUPER_ADMIN" | "ADMIN" | "EDITOR";
  scope: string;
  is_active: boolean;
}

const maskEmail = (email: string) => {
  const [name, domain] = email.split("@");
  if (!name || !domain) return email;
  if (name.length <= 2) return `${name[0]}***@${domain}`;
  return `${name.substring(0, 2)}***@${domain}`;
};

const getRoleConfig = (role: string) => {
  switch (role) {
    case "SUPER_ADMIN":
      return { icon: Crown, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30", label: "Super Admin" };
    case "ADMIN":
      return { icon: Shield, color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/30", label: "Admin" };
    default:
      return { icon: Edit3, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", label: "Editor" };
  }
};

function MemberCard({ member }: { member: TeamMember }) {
  const config = getRoleConfig(member.role);
  const Icon = config.icon;

  return (
    <div className={`relative w-64 bg-zinc-900/80 backdrop-blur-sm border ${config.border} rounded-2xl p-4 flex flex-col items-center text-center shadow-lg transition-transform hover:-translate-y-1 hover:shadow-xl`}>
      <div className={`w-12 h-12 rounded-full ${config.bg} flex items-center justify-center mb-3`}>
        <Icon className={`w-6 h-6 ${config.color}`} />
      </div>
      <h3 className="text-white font-semibold text-sm truncate w-full px-2" title={member.email}>
        {member.member_name || maskEmail(member.email)}
      </h3>
      <span className={`mt-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${config.color} ${config.bg}`}>
        {config.label}
      </span>
      {!member.is_active && (
        <span className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-rose-500 border-2 border-zinc-900" title="Inactive" />
      )}
    </div>
  );
}

export default function TeamAdminPage() {
  const { data: members = [], isLoading: loading, error: fetchError } = useSWR<TeamMember[]>("/api/team", swrFetcher);

  const superAdmins = members.filter(m => m.role === "SUPER_ADMIN");
  const admins = members.filter(m => m.role === "ADMIN");
  const editors = members.filter(m => m.role === "EDITOR");

  return (
    <div className="animate-in fade-in duration-500 min-h-[80vh] flex flex-col">
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-white mb-2">Organizational Chart</h1>
          <p className="text-slate-400">View team hierarchy and access levels securely.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition-colors shadow-lg shadow-indigo-500/20">
          <Plus className="w-4 h-4" /> Add Member
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        </div>
      ) : fetchError ? (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-center">
          Failed to load team data.
        </div>
      ) : (

      <div className="flex-1 overflow-x-auto pb-10">
        <div className="min-w-max mx-auto flex flex-col items-center">
          
          {/* Level 1: Super Admins */}
          <div className="flex items-center justify-center gap-8 relative">
            {superAdmins.map((m, i) => (
              <div key={m.id} className="relative">
                <MemberCard member={m} />
                {/* Horizontal connector for multiple super admins */}
                {superAdmins.length > 1 && i < superAdmins.length - 1 && (
                  <div className="absolute top-1/2 -right-8 w-8 h-px bg-zinc-700" />
                )}
              </div>
            ))}
          </div>

          {/* Connector Down from Super Admins */}
          {superAdmins.length > 0 && (admins.length > 0 || editors.length > 0) && (
            <div className="w-px h-12 bg-zinc-700 relative">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-zinc-700" />
            </div>
          )}

          {/* Level 2: Admins */}
          {admins.length > 0 && (
            <>
              {/* Horizontal line spreading to admins */}
              {admins.length > 1 && (
                <div className="w-[calc(100%-16rem)] h-px bg-zinc-700 relative">
                  {admins.map((_, i) => (
                    <div key={i} className="absolute top-0 w-px h-6 bg-zinc-700" style={{ left: `${(i / (admins.length - 1)) * 100}%` }} />
                  ))}
                </div>
              )}
              {admins.length === 1 && <div className="w-px h-6 bg-zinc-700" />}

              <div className="flex items-start justify-center gap-8 relative mt-6">
                {admins.map((m) => (
                  <MemberCard key={m.id} member={m} />
                ))}
              </div>
            </>
          )}

          {/* Connector Down from Admins to Editors */}
          {(admins.length > 0 || superAdmins.length > 0) && editors.length > 0 && (
            <div className="w-px h-12 bg-zinc-700 mt-6 relative">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-zinc-700" />
            </div>
          )}

          {/* Level 3: Editors */}
          {editors.length > 0 && (
            <>
              {/* Horizontal line spreading to editors */}
              {editors.length > 1 && (
                <div className="w-[calc(100%-16rem)] h-px bg-zinc-700 relative">
                  {editors.map((_, i) => (
                    <div key={i} className="absolute top-0 w-px h-6 bg-zinc-700" style={{ left: `${(i / (editors.length - 1)) * 100}%` }} />
                  ))}
                </div>
              )}
              {editors.length === 1 && <div className="w-px h-6 bg-zinc-700" />}

              <div className="flex items-start justify-center gap-8 relative mt-6">
                {editors.map((m) => (
                  <MemberCard key={m.id} member={m} />
                ))}
              </div>
            </>
          )}

        </div>
      </div>
      )}
    </div>
  );
}
