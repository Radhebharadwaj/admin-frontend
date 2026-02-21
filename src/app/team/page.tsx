"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Plus, Edit2, Trash2, PowerOff, ShieldAlert, Loader2 } from "lucide-react";

type TeamMember = {
  id: string;
  email: string;
  role: string;
  scope: string;
  is_active: boolean;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ email: "", role: "EDITOR", scope: "ALL" });

  const router = useRouter();

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/");
        return;
      }
      setSessionToken(session.access_token);
      fetchMembers(session.access_token);
    };

    initAuth();
  }, [router]);

  const fetchMembers = async (token: string) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/team`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch team members");
      const data = await res.json();
      if (data.success) {
        setMembers(data.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (member?: TeamMember) => {
    if (member) {
      setEditingId(member.id);
      setFormData({ email: member.email, role: member.role, scope: member.scope });
    } else {
      setEditingId(null);
      setFormData({ email: "", role: "EDITOR", scope: "ALL" });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ email: "", role: "EDITOR", scope: "ALL" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionToken) return;

    try {
      setModalLoading(true);
      const url = editingId ? `${API_URL}/api/team/${editingId}` : `${API_URL}/api/team`;
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Operation failed");
      }

      await fetchMembers(sessionToken);
      handleCloseModal();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setModalLoading(false);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    if (!sessionToken || !confirm(`Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} this user?`)) return;

    try {
      const res = await fetch(`${API_URL}/api/team/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ is_active: !currentStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update status");
      }
      fetchMembers(sessionToken);
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!sessionToken || !confirm("Are you sure you want to permanently delete this member?")) return;

    try {
      const res = await fetch(`${API_URL}/api/team/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to delete user");
      }
      fetchMembers(sessionToken);
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 p-8 text-zinc-100 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
              <ShieldAlert className="w-8 h-8 text-blue-500" />
              Team Management
            </h1>
            <p className="text-zinc-400 mt-1">Manage admin roles and access scopes</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-lg shadow-blue-500/20"
          >
            <Plus className="w-5 h-5" />
            Add Member
          </button>
        </header>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
            <table className="w-full text-left">
              <thead className="bg-zinc-900/50 border-b border-zinc-800 text-sm font-medium text-zinc-400">
                <tr>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Scope</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {members.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">
                      No team members found.
                    </td>
                  </tr>
                ) : (
                  members.map((member) => (
                    <tr key={member.id} className="hover:bg-zinc-800/20 transition-colors">
                      <td className="px-6 py-4 font-medium">{member.email}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${member.role === 'SUPER_ADMIN' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          }`}>
                          {member.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-zinc-800 text-zinc-300 px-2.5 py-1 rounded-lg text-xs font-medium border border-zinc-700">
                          {member.scope}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`flex items-center gap-1.5 text-sm font-medium ${member.is_active ? 'text-green-400' : 'text-zinc-500'
                          }`}>
                          <span className={`w-2 h-2 rounded-full ${member.is_active ? 'bg-green-400' : 'bg-zinc-500'}`}></span>
                          {member.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => handleOpenModal(member)}
                            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleActive(member.id, member.is_active)}
                            className={`p-2 rounded-lg transition-colors ${member.is_active
                                ? 'text-orange-400 hover:bg-orange-400/10'
                                : 'text-green-400 hover:bg-green-400/10'
                              }`}
                            title={member.is_active ? "Deactivate" : "Activate"}
                          >
                            <PowerOff className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(member.id)}
                            className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-zinc-800">
              <h2 className="text-xl font-semibold text-white">
                {editingId ? "Edit Team Member" : "Add Team Member"}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  disabled={!!editingId} // Usually can't change email easily
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all disabled:opacity-50"
                  placeholder="admin@quduhub.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none"
                  >
                    <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                    <option value="EDITOR">EDITOR</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">Scope</label>
                  <select
                    value={formData.scope}
                    onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none"
                  >
                    <option value="ALL">ALL</option>
                    <option value="IGNOU">IGNOU</option>
                    <option value="DU-SOL">DU-SOL</option>
                  </select>
                </div>
              </div>


              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-5 py-2.5 rounded-xl font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-medium transition-colors disabled:opacity-70 flex items-center justify-center min-w-[100px]"
                >
                  {modalLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
