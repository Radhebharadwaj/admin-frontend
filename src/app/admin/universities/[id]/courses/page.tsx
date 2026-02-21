"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  BookOpen,
  Plus,
  Trash2,
  MoreHorizontal,
  Loader2,
  Search,
  X,
  Clock,
  Layers,
} from "lucide-react";
import { fetchApi } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { canEdit, canDelete, type Role } from "@/lib/rbac";
import Breadcrumb from "@/components/admin/Breadcrumb";
import DataTable from "@/components/admin/DataTable";
import StatusBadge from "@/components/admin/StatusBadge";
import SlideOverDrawer from "@/components/admin/SlideOverDrawer";

// ===== TYPES =====
interface University {
  id: string;
  name: string;
  slug: string;
}
interface Course {
  id: string;
  university_id: string;
  name: string;
  slug: string;
  duration_years: number | null;
  total_semesters: number;
  is_active: number;
}

export default function CoursesPage() {
  const router = useRouter();
  const params = useParams();
  const universityId = params.id as string;
  const { user, addToast } = useAuthStore();
  const role = (user?.role || "GUEST") as Role;

  // Data
  const [university, setUniversity] = useState<University | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Course>>({});
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");

  // ===== Data Fetching =====
  const fetchData = useCallback(async () => {
    setLoading(true);
    const [uniRes, coursesRes] = await Promise.all([
      fetchApi(`/api/universities/${universityId}`),
      fetchApi(`/api/courses?university_id=${universityId}`),
    ]);
    if (uniRes.success) setUniversity(uniRes.data);
    if (coursesRes.success) setCourses(coursesRes.data);
    setLoading(false);
  }, [universityId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ===== Helpers =====
  const autoSlug = (str: string) =>
    str
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const openCreate = () => {
    setEditingId(null);
    setFormData({
      name: "",
      slug: "",
      duration_years: null,
      total_semesters: undefined,
      is_active: 1,
    });
    setError("");
    setDrawerOpen(true);
  };

  const openEdit = (c: Course) => {
    setEditingId(c.id);
    setFormData({ ...c });
    setError("");
    setDrawerOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (
      !confirm(
        `Are you sure you want to delete "${name}"? This will cascade-delete all subjects, chapters, and resources under it.`
      )
    )
      return;
    try {
      const res = await fetchApi(`/api/courses/${id}`, { method: "DELETE" });
      if (!res.success) throw new Error(res.message);
      addToast("success", "Course deleted successfully.");
      await fetchData();
    } catch (err: any) {
      addToast("error", err.message || "Failed to delete course.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setError("");
    try {
      const url = editingId ? `/api/courses/${editingId}` : "/api/courses";
      const payload: any = {
        ...formData,
        duration_years: formData.duration_years
          ? parseInt(String(formData.duration_years))
          : null,
        total_semesters: parseInt(String(formData.total_semesters)),
      };
      if (!editingId) payload.university_id = universityId;

      const res = await fetchApi(url, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.success) throw new Error(res.message);
      addToast("success", editingId ? "Course updated successfully." : "Course created successfully.");
      await fetchData();
      setDrawerOpen(false);
    } catch (err: any) {
      setError(err.message);
      addToast("error", err.message || "Failed to save course.");
    }
    setFormLoading(false);
  };

  // ===== Filtered List =====
  const filtered = courses.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.slug.toLowerCase().includes(search.toLowerCase())
  );

  // ===== Styles =====
  const inputClass =
    "w-full bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all placeholder-zinc-600";
  const labelClass =
    "block text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wide";

  return (
    <div className="max-w-7xl mx-auto pb-20 animate-in fade-in duration-500">
      <Breadcrumb
        items={[
          { label: "Universities", href: "/admin/universities" },
          { label: university?.name || "Loading..." },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            {university?.name || "..."} — Courses
          </h1>
          <p className="text-sm text-zinc-400 mt-1.5 font-medium">
            Manage degree programs and certificates under this university.
          </p>
        </div>

        {canEdit(role, "courses") && (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-zinc-200 text-black text-sm font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-95"
          >
            <Plus className="w-4 h-4" /> Add Course
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
          placeholder="Search courses..."
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
          <p className="text-sm font-medium">Loading courses...</p>
        </div>
      ) : (
        <DataTable
          headers={["Course", "Duration", "Semesters", "Status", "Actions"]}
          emptyIcon={BookOpen}
          emptyText="No courses found. Add your first course here."
          rowCount={filtered.length}
        >
          {filtered.map((c) => (
            <tr
              key={c.id}
              className="group hover:bg-zinc-800/30 transition-colors cursor-pointer"
              onClick={() =>
                router.push(
                  `/admin/universities/${universityId}/courses/${c.id}/semesters`
                )
              }
            >
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-zinc-800/80 border border-zinc-700 flex items-center justify-center text-zinc-400 group-hover:text-white transition-colors">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-white text-sm">
                      {c.name}
                    </div>
                    <div className="text-xs text-zinc-500 font-mono mt-0.5">
                      {c.slug}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-1.5 text-sm text-zinc-400">
                  <Clock className="w-3.5 h-3.5" />
                  {c.duration_years ? `${c.duration_years} Years` : "—"}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-1.5 text-sm text-zinc-400">
                  <Layers className="w-3.5 h-3.5" />
                  <span className="font-medium text-white">
                    {c.total_semesters}
                  </span>{" "}
                  semesters
                </div>
              </td>
              <td className="px-6 py-4">
                <StatusBadge active={c.is_active === 1} />
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-1">
                  {canEdit(role, "courses") && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEdit(c);
                      }}
                      className="p-2 text-zinc-500 hover:text-white rounded-lg hover:bg-zinc-700 transition-colors"
                      title="Edit"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  )}
                  {canDelete(role, "courses") && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(c.id, c.name);
                      }}
                      className="p-2 text-zinc-500 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
                      title="Delete"
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
        title={editingId ? "Edit Course" : "Create Course"}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className={labelClass}>Course Name</label>
            <input
              type="text"
              className={inputClass}
              value={formData.name || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  name: e.target.value,
                  slug: editingId ? formData.slug : autoSlug(e.target.value),
                })
              }
              placeholder="e.g. Bachelor of Computer Applications"
              required
            />
          </div>

          {/* Slug */}
          <div>
            <label className={labelClass}>Slug</label>
            <input
              type="text"
              className={`${inputClass} font-mono`}
              value={formData.slug || ""}
              onChange={(e) =>
                setFormData({ ...formData, slug: e.target.value })
              }
              placeholder="bca"
              required
            />
          </div>

          {/* Duration & Semesters */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Duration (Years)</label>
              <input
                type="number"
                min="1"
                max="10"
                className={inputClass}
                value={formData.duration_years || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    duration_years: e.target.value
                      ? parseInt(e.target.value)
                      : null,
                  })
                }
                placeholder="3"
              />
            </div>
            <div>
              <label className={labelClass}>
                Total Semesters <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                min="1"
                max="16"
                className={inputClass}
                value={formData.total_semesters || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    total_semesters: parseInt(e.target.value) || undefined,
                  })
                }
                placeholder="6"
                required
              />
            </div>
          </div>

          {/* Is Active Toggle */}
          <div className="flex items-center justify-between p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl">
            <div>
              <p className="text-sm font-medium text-white">Active Status</p>
              <p className="text-xs text-zinc-500 mt-0.5">
                Hidden courses won't appear in the student UI.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setFormData({
                  ...formData,
                  is_active: formData.is_active === 1 ? 0 : 1,
                })
              }
              className={`relative w-12 h-7 rounded-full transition-colors ${
                formData.is_active === 1 ? "bg-emerald-500" : "bg-zinc-700"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                  formData.is_active === 1 ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Actions */}
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
              {editingId ? "Save Changes" : "Create Course"}
            </button>
          </div>
        </form>
      </SlideOverDrawer>
    </div>
  );
}

