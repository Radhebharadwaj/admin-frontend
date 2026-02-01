"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  Plus,
  Trash2,
  MoreHorizontal,
  Loader2,
  Search,
  X,
  Globe,
  ExternalLink,
} from "lucide-react";
import useSWR from "swr";
import Link from "next/link";
import Image from "next/image";
import { fetchApi, swrFetcher } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { useUpload } from "@/lib/useUpload";
import { canEdit, canDelete, type Role } from "@/lib/rbac";
import Breadcrumb from "@/components/admin/Breadcrumb";
import DataTable from "@/components/admin/DataTable";
import StatusBadge from "@/components/admin/StatusBadge";
import SlideOverDrawer from "@/components/admin/SlideOverDrawer";
import ImageUploader from "@/components/admin/ImageUploader";
import SkeletonTable from "@/components/admin/SkeletonTable";
import ConfirmDeleteModal from "@/components/admin/ConfirmDeleteModal";
import TagInput from "@/components/ui/TagInput";

// ===== TYPES =====
interface University {
  id: string;
  name: string;
  slug: string;
  website_url: string | null;
  logo_url: string | null;
  logo_file?: File | null;
  search_aliases?: string;
  is_active: number;
}

function UniversityLogo({ src, name }: { src: string | null; name: string }) {
  const [error, setError] = useState(false);

  // Normalize legacy relative paths from the DB
  let finalSrc = src;
  if (finalSrc && !finalSrc.startsWith("http") && !finalSrc.startsWith("/")) {
    // Fallback public URL if DB only stored the key
    finalSrc = `https://pub-quduhub-r2.dev/${finalSrc}`;
  }

  if (error || !finalSrc) {
    return (
      <div className="w-9 h-9 rounded-lg bg-zinc-800/80 border border-zinc-700 flex items-center justify-center text-zinc-400 group-hover:text-white transition-colors">
        <GraduationCap className="w-4 h-4" />
      </div>
    );
  }

  return (
    <div className="relative w-9 h-9 rounded-lg overflow-hidden border border-zinc-700 shrink-0 bg-zinc-900/50">
      {/* Using standard img for reliable onError handling with external unoptimized URLs */}
      <img
        src={finalSrc}
        alt={name}
        className="w-full h-full object-cover"
        onError={() => setError(true)}
      />
    </div>
  );
}

export default function UniversitiesPage() {
  const router = useRouter();
  const { user, addToast } = useAuthStore();
  const role = (user?.role || "GUEST") as Role;
  const { upload, uploading } = useUpload();

  // Data
  const { data: universities = [], error: fetchError, isLoading: loading, mutate } = useSWR<University[]>("/api/universities", swrFetcher);
  const [search, setSearch] = useState("");

  // Drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<University>>({});
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ===== Helpers =====
  const autoSlug = (str: string) =>
    str
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const openCreate = () => {
    setEditingId(null);
    setFormData({ name: "", slug: "", website_url: "", logo_url: null, is_active: 1 });
    setError("");
    setDrawerOpen(true);
  };

  const openEdit = (u: University) => {
    setEditingId(u.id);
    setFormData({ ...u });
    setError("");
    setDrawerOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    setItemToDelete({ id, name });
    setDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await mutate(
        async () => {
          const res = await fetchApi(`/api/universities/${itemToDelete.id}`, { method: "DELETE" });
          if (!res.success) throw new Error(res.message);
          return universities.filter((u) => u.id !== itemToDelete.id);
        },
        {
          optimisticData: universities.filter((u) => u.id !== itemToDelete.id),
          rollbackOnError: true,
          populateCache: true,
          revalidate: false,
        }
      );
      addToast("success", "University deleted successfully.");
    } catch (err: any) {
      addToast("error", err.message || "Failed to delete university.");
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
      setItemToDelete(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setError("");
    
    try {
      let finalLogoUrl = formData.logo_url;
      if (formData.logo_file) {
        const targetSlug = formData.slug || autoSlug(formData.name || "");
        const uploadedUrl = await upload(formData.logo_file, {
          uploadType: 'image',
          entityType: 'universities',
          universitySlug: targetSlug,
          filePrefix: 'logo'
        });
        if (!uploadedUrl) {
          addToast("error", "Failed to upload image to bucket");
          setFormLoading(false);
          return;
        }
        finalLogoUrl = uploadedUrl;
      }

      // Prevent local blob URLs from being sent to the backend
      if (finalLogoUrl && finalLogoUrl.startsWith("blob:")) {
        finalLogoUrl = null;
      }

      const url = editingId ? `/api/universities/${editingId}` : "/api/universities";
      const payload = { ...formData, logo_url: finalLogoUrl };
      delete payload.logo_file;

      const optimisticData = editingId
        ? universities.map((u) => (u.id === editingId ? { ...u, ...payload } : u))
        : [{ ...payload, id: `temp-${Date.now()}` }, ...universities];
      await mutate(
        async () => {
          const res = await fetchApi(url, {
            method: editingId ? "PATCH" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (!res.success) throw new Error(res.message);
          
          // Re-fetch to get accurate DB values (like formatted slugs, default values)
          const fetchRes = await fetchApi("/api/universities");
          if (fetchRes.success) return fetchRes.data;
          throw new Error("Failed to reload data");
        },
        {
          optimisticData: optimisticData as University[],
          rollbackOnError: true,
          populateCache: true,
          revalidate: false, // We already fetched the latest in the promise above
        }
      );

      addToast("success", editingId ? "University updated successfully." : "University created successfully.");
      setDrawerOpen(false);
    } catch (err: any) {
      setError(err.message);
      addToast("error", err.message || "Failed to save university.");
    }
    setFormLoading(false);
  };

  // ===== Filtered List =====
  const filtered = universities.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.slug.toLowerCase().includes(search.toLowerCase())
  );

  // ===== Styles =====
  const inputClass =
    "w-full bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all placeholder-zinc-600";
  const labelClass =
    "block text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wide";

  return (
    <div className="max-w-7xl mx-auto pb-20 animate-in fade-in duration-500">
      <Breadcrumb items={[{ label: "Universities" }]} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Universities
          </h1>
          <p className="text-sm text-zinc-400 mt-1.5 font-medium">
            Manage parent institutions and academies.
          </p>
        </div>

        {canEdit(role, "universities") && (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-zinc-200 text-black text-sm font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-95"
          >
            <Plus className="w-4 h-4" /> Add University
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
          placeholder="Search universities..."
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
        <SkeletonTable />
      ) : fetchError ? (
        <div className="flex flex-col items-center justify-center py-32 text-red-500">
          <p className="text-sm font-medium">Failed to load universities.</p>
        </div>
      ) : (
        <DataTable
          headers={["University", "Website", "Status", "Actions"]}
          emptyIcon={GraduationCap}
          emptyText="No universities found. Create one to get started."
          rowCount={filtered.length}
        >
          {filtered.map((u) => (
            <tr
              key={u.id}
              className="group hover:bg-zinc-800/30 transition-colors cursor-pointer"
              onClick={() => router.push(`/admin/universities/${u.id}/courses`)}
            >
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <UniversityLogo src={u.logo_url} name={u.name} />
                  <div>
                    <Link href={`/admin/universities/${u.id}/courses`} className="font-semibold text-white text-sm hover:text-indigo-400 transition-colors" onClick={(e) => e.stopPropagation()}>
                      {u.name}
                    </Link>
                    <div className="text-xs text-zinc-500 font-mono mt-0.5">{u.slug}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-zinc-400">
                {u.website_url ? (
                  <a
                    href={u.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1.5 hover:text-indigo-400 transition-colors"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span className="truncate max-w-[180px]">
                      {u.website_url.replace(/^https?:\/\//, "")}
                    </span>
                    <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                ) : (
                  "—"
                )}
              </td>
              <td className="px-6 py-4">
                <StatusBadge active={u.is_active === 1} />
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-1">
                  {canEdit(role, "universities") && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEdit(u);
                      }}
                      className="p-2 text-zinc-500 hover:text-white rounded-lg hover:bg-zinc-700 transition-colors"
                      title="Edit"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  )}
                  {canDelete(role, "universities") && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(u.id, u.name);
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
        title={editingId ? "Edit University" : "Create University"}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          {/* Logo Upload */}
          <ImageUploader
            value={formData.logo_url || null}
            onChange={(val) => {
              if (val instanceof File) {
                setFormData({ ...formData, logo_file: val });
              } else {
                setFormData({ ...formData, logo_url: val as string | null, logo_file: null });
              }
            }}
            isUploading={uploading}
            label="University Logo"
            placeholder="Drag and drop logo or click to upload"
          />

          {/* Name */}
          <div>
            <label className={labelClass}>University Name</label>
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
              placeholder="e.g. Indira Gandhi National Open University"
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
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              placeholder="ignou"
              required
            />
          </div>

          {/* Search Aliases */}
          <div>
            <label className={labelClass}>Search Aliases (Optional)</label>
            <TagInput
              value={formData.search_aliases ? formData.search_aliases.split(',').filter(Boolean) : []}
              onChange={(tags) => setFormData({ ...formData, search_aliases: tags.length > 0 ? tags.join(',') : "" })}
              placeholder="e.g. DU, SOL, Delhi Univ"
            />
          </div>

          {/* Website */}
          <div>
            <label className={labelClass}>Website URL</label>
            <input
              type="url"
              className={inputClass}
              value={formData.website_url || ""}
              onChange={(e) =>
                setFormData({ ...formData, website_url: e.target.value })
              }
              placeholder="https://ignou.ac.in"
            />
          </div>

          {/* Is Active Toggle */}
          <div className="flex items-center justify-between p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl">
            <div>
              <p className="text-sm font-medium text-white">Active Status</p>
              <p className="text-xs text-zinc-500 mt-0.5">
                Hidden universities won't appear in the student UI.
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
              disabled={formLoading || uploading}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/25 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {(formLoading || uploading) && <Loader2 className="w-4 h-4 animate-spin" />}
              {uploading ? "Uploading..." : formLoading ? "Saving..." : "Save University"}
            </button>
          </div>
        </form>
      </SlideOverDrawer>

      <ConfirmDeleteModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={executeDelete}
        itemName={itemToDelete?.name || ""}
        isLoading={isDeleting}
        customMessage="This will cascade-delete all courses, subjects, chapters, and resources under it."
      />
    </div>
  );
}
