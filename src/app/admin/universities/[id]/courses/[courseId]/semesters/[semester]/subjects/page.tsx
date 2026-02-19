"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  FileText,
  Plus,
  Trash2,
  MoreHorizontal,
  Loader2,
  Search,
  X,
} from "lucide-react";
import useSWR from "swr";
import Link from "next/link";
import { fetchApi, swrFetcher } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { canEdit, canDelete, type Role } from "@/lib/rbac";
import Breadcrumb from "@/components/admin/Breadcrumb";
import DataTable from "@/components/admin/DataTable";
import SlideOverDrawer from "@/components/admin/SlideOverDrawer";

// ===== TYPES =====
interface Subject {
  id: string;
  course_id: string;
  semester: number;
  name: string;
  subject_code: string;
}

export default function SubjectsPage() {
  const router = useRouter();
  const params = useParams();
  const universityId = params.id as string;
  const courseId = params.courseId as string;
  const semester = parseInt(params.semester as string);
  const { user, addToast } = useAuthStore();
  const role = (user?.role || "GUEST") as Role;

  // Data
  const { data: uniData, error: uniError } = useSWR(`/api/universities/${universityId}`, swrFetcher);
  const { data: courseData, error: courseError } = useSWR(`/api/courses/${courseId}`, swrFetcher);
  const { data: subjects = [], error: subjectsError, isLoading: loading, mutate } = useSWR<Subject[]>(`/api/subjects?course_id=${courseId}&semester=${semester}`, swrFetcher);
  const [search, setSearch] = useState("");

  const univName = uniData?.name || "";
  const courseName = courseData?.name || "";

  // Drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Subject>>({});
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");

  // ===== CRUD =====
  const openCreate = () => {
    setEditingId(null);
    setFormData({ subject_code: "", name: "" });
    setError("");
    setDrawerOpen(true);
  };

  const openEdit = (s: Subject) => {
    setEditingId(s.id);
    setFormData({ ...s });
    setError("");
    setDrawerOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (
      !confirm(
        `Delete "${name}"? This will cascade-delete all chapters and resources.`
      )
    )
      return;
    try {
      const res = await fetchApi(`/api/subjects/${id}`, { method: "DELETE" });
      if (!res.success) throw new Error(res.message);
      addToast("success", "Subject deleted successfully.");
      mutate();
    } catch (err: any) {
      addToast("error", err.message || "Failed to delete subject.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setError("");
    try {
      const url = editingId ? `/api/subjects/${editingId}` : "/api/subjects";
      const payload: any = { ...formData, semester };
      if (!editingId) payload.course_id = courseId;

      const res = await fetchApi(url, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.success) throw new Error(res.message);
      addToast("success", editingId ? "Subject updated successfully." : "Subject created successfully.");
      mutate();
      setDrawerOpen(false);
    } catch (err: any) {
      setError(err.message);
      addToast("error", err.message || "Failed to save subject.");
    }
    setFormLoading(false);
  };

  const filtered = subjects.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.subject_code.toLowerCase().includes(search.toLowerCase())
  );

  const inputClass =
    "w-full bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all placeholder-zinc-600";
  const labelClass =
    "block text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wide";

  return (
    <div className="max-w-7xl mx-auto pb-20 animate-in fade-in duration-500">
      <Breadcrumb
        items={[
          { label: "Universities", href: "/admin/universities" },
          {
            label: univName || "...",
            href: `/admin/universities/${universityId}/courses`,
          },
          {
            label: courseName || "...",
            href: `/admin/universities/${universityId}/courses/${courseId}/semesters`,
          },
          { label: `Semester ${semester}` },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Semester {semester} — Subjects
          </h1>
          <p className="text-sm text-zinc-400 mt-1.5 font-medium">
            Manage subjects and their study materials.
          </p>
        </div>
        {canEdit(role, "subjects") && (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-zinc-200 text-black text-sm font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-95"
          >
            <Plus className="w-4 h-4" /> Add Subject
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-sm w-full mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search subjects..."
          className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all shadow-sm"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 text-zinc-500">
          <Loader2 className="w-8 h-8 animate-spin mb-4 text-indigo-500" />
          <p className="text-sm font-medium">Loading subjects...</p>
        </div>
      ) : (uniError || courseError || subjectsError) ? (
        <div className="flex flex-col items-center justify-center py-32 text-red-500">
          <p className="text-sm font-medium">Failed to load data.</p>
        </div>
      ) : (
        <DataTable
          headers={["Subject Code", "Subject Name", "Actions"]}
          emptyIcon={FileText}
          emptyText="No subjects found. Add your first subject here."
          rowCount={filtered.length}
        >
          {filtered.map((s) => (
            <tr
              key={s.id}
              className="group hover:bg-zinc-800/30 transition-colors cursor-pointer"
              onClick={() =>
                router.push(
                  `/admin/universities/${universityId}/courses/${courseId}/semesters/${semester}/subjects/${s.id}`
                )
              }
            >
              <td className="px-6 py-4">
                <Link href={`/admin/universities/${universityId}/courses/${courseId}/semesters/${semester}/subjects/${s.id}`} onClick={(e) => e.stopPropagation()}>
                  <span className="font-mono text-xs font-bold tracking-wide text-zinc-300 bg-zinc-800 border border-zinc-700 px-3 py-1.5 rounded-md hover:text-indigo-400 hover:border-indigo-500/50 transition-colors">
                    {s.subject_code}
                  </span>
                </Link>
              </td>
              <td className="px-6 py-4 text-sm font-semibold text-white">
                {s.name}
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-1">
                  {canEdit(role, "subjects") && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEdit(s);
                      }}
                      className="p-2 text-zinc-500 hover:text-white rounded-lg hover:bg-zinc-700 transition-colors"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  )}
                  {canDelete(role, "subjects") && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(s.id, s.name);
                      }}
                      className="p-2 text-zinc-500 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
      )}

      {/* ===== CREATE / EDIT DRAWER ===== */}
      <SlideOverDrawer
        title={editingId ? "Edit Subject" : "Create Subject"}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          <div>
            <label className={labelClass}>Subject Code</label>
            <input
              type="text"
              className={`${inputClass} font-mono uppercase`}
              value={formData.subject_code || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  subject_code: e.target.value.toUpperCase(),
                })
              }
              placeholder="CS-201"
              required
            />
          </div>

          <div>
            <label className={labelClass}>Subject Name</label>
            <input
              type="text"
              className={inputClass}
              value={formData.name || ""}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Data Structures & Algorithms"
              required
            />
          </div>

          <div className="pt-6 mt-6 border-t border-zinc-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="px-5 py-2.5 rounded-xl text-sm font-bold bg-white text-black hover:bg-zinc-200 transition-all disabled:opacity-50 flex items-center gap-2 shadow-[0_0_15px_rgba(255,255,255,0.1)]"
            >
              {formLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : null}
              {editingId ? "Save Changes" : "Create Subject"}
            </button>
          </div>
        </form>
      </SlideOverDrawer>
    </div>
  );
}

