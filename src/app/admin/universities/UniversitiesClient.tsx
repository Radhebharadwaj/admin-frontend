"use client";

import { useState, useTransition } from "react";
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
import Link from "next/link";
import { useAuthStore } from "@/lib/store";
import { useUpload } from "@/lib/useUpload";
import { canEdit, canDelete, type Role } from "@/lib/rbac";
import Breadcrumb from "@/components/admin/Breadcrumb";
import DataTable from "@/components/admin/DataTable";
import StatusBadge from "@/components/admin/StatusBadge";
import SlideOverDrawer from "@/components/admin/SlideOverDrawer";
import ImageUploader from "@/components/admin/ImageUploader";
import ConfirmDeleteModal from "@/components/admin/ConfirmDeleteModal";
import TagInput from "@/components/ui/TagInput";

import { saveUniversityAction, deleteUniversityAction, UniversitySchema } from "./actions";

// Match the old frontend type structure + the new Zod schema needs
export interface University {
  id: string;
  name: string;
  slug: string;
  acronym?: string | null;
  website_url: string | null;
  logo_url: string | null;
  search_aliases?: string | null;
  is_active: number;
}

function UniversityLogo({ src, name }: { src: string | null; name: string }) {
  const [error, setError] = useState(false);

  let finalSrc = src;
  if (finalSrc && !finalSrc.startsWith("http") && !finalSrc.startsWith("/")) {
    finalSrc = `https://pub-quduhub-r2.dev/${finalSrc}`;
  }

  if (error || !finalSrc) {
    return (
      <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 transition-colors">
        <GraduationCap className="w-4 h-4" />
      </div>
    );
  }

  return (
    <div className="relative w-9 h-9 rounded-lg overflow-hidden border border-zinc-800 shrink-0 bg-zinc-950">
      <img
        src={finalSrc}
        alt={name}
        className="w-full h-full object-cover"
        onError={() => setError(true)}
      />
    </div>
  );
}

export default function UniversitiesClient({ universities }: { universities: University[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { user, addToast, sessionToken } = useAuthStore();
  const role = (user?.role || "GUEST") as Role;
  const { upload, uploading } = useUpload();

  const [search, setSearch] = useState("");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Extend UniversitySchema with logo_file for local UI state
  const [formData, setFormData] = useState<Partial<UniversitySchema> & { logo_file?: File | null }>({});
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const autoSlug = (str: string) =>
    str
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const openCreate = () => {
    setEditingId(null);
    setFormData({ name: "", slug: "", acronym: "", website_url: "", logo_url: null, is_active: 1 });
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
    if (!itemToDelete || !sessionToken) return;
    setIsDeleting(true);
    
    startTransition(async () => {
      const res = await deleteUniversityAction(itemToDelete.id, sessionToken);
      if (res.success) {
        addToast("success", res.message);
        setDeleteModalOpen(false);
      } else {
        addToast("error", res.message);
      }
      setIsDeleting(false);
      setItemToDelete(null);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionToken) return;
    
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

      if (finalLogoUrl && finalLogoUrl.startsWith("blob:")) {
        finalLogoUrl = null;
      }

      // Intercept and format the payload strictly into plain JSON
      let parsedAliases = formData.search_aliases;
      if (Array.isArray(parsedAliases)) {
        parsedAliases = parsedAliases.join(", ");
      }

      const payload: UniversitySchema = {
        id: editingId || undefined,
        name: formData.name || "",
        slug: formData.slug || "",
        acronym: formData.acronym || null,
        website_url: formData.website_url || null,
        logo_url: typeof finalLogoUrl === "string" ? finalLogoUrl : null,
        search_aliases: typeof parsedAliases === "string" ? parsedAliases : null,
        is_active: formData.is_active ? 1 : 0, // Convert boolean/truthy to integer
      };

      const res = await saveUniversityAction(payload, sessionToken);
      
      if (res.success) {
        addToast("success", res.message);
        setDrawerOpen(false);
      } else {
        setError(res.message);
        addToast("error", res.message);
      }
    } catch (err: any) {
      setError(err.message);
      addToast("error", "Failed to save university.");
    } finally {
      setFormLoading(false);
    }
  };

  const filtered = universities.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.slug.toLowerCase().includes(search.toLowerCase()) ||
      u.acronym?.toLowerCase().includes(search.toLowerCase())
  );

  const inputClass =
    "w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-200 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-700 transition-all placeholder-zinc-600";
  const labelClass =
    "block text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wide";

  return (
    <div className="max-w-7xl mx-auto pb-20 animate-in fade-in duration-500">
      <Breadcrumb items={[{ label: "Universities" }]} />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-zinc-200 tracking-tight">
            Universities
          </h1>
          <p className="text-sm text-zinc-400 mt-1.5 font-medium">
            Manage parent institutions and academies.
          </p>
        </div>

        {canEdit(role, "universities") && (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-5 py-2.5 bg-zinc-200 hover:bg-white text-zinc-950 text-sm font-bold rounded-xl transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" /> Add University
          </button>
        )}
      </div>

      <div className="relative max-w-sm w-full mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search universities..."
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-10 py-2.5 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-700 transition-all shadow-sm"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <DataTable
        headers={["University", "Website", "Status", "Actions"]}
        emptyIcon={GraduationCap}
        emptyText="No universities found. Create one to get started."
        rowCount={filtered.length}
      >
        {filtered.map((u) => (
          <tr
            key={u.id}
            className="group hover:bg-zinc-900/50 transition-colors cursor-pointer"
            onClick={() => router.push(`/admin/universities/${u.id}/courses`)}
          >
            <td className="px-6 py-4">
              <div className="flex items-center gap-3">
                <UniversityLogo src={u.logo_url} name={u.name} />
                <div>
                  <Link href={`/admin/universities/${u.id}/courses`} className="font-semibold text-zinc-200 text-sm hover:text-zinc-50 transition-colors" onClick={(e) => e.stopPropagation()}>
                    {u.acronym || u.name}
                  </Link>
                  {u.acronym && <div className="text-[11px] text-zinc-400 mt-0.5 max-w-[200px] truncate">{u.name}</div>}
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
                  className="flex items-center gap-1.5 hover:text-zinc-200 transition-colors"
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
                    className="p-2 text-zinc-500 hover:text-zinc-200 rounded-lg hover:bg-white/10 transition-colors"
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

          <div>
            <label className={labelClass}>UNIVERSITY ACRONYM (Short Name)</label>
            <input
              type="text"
              className={inputClass}
              placeholder="e.g., IGNOU"
              value={formData.acronym || ""}
              onChange={(e) =>
                setFormData({ ...formData, acronym: e.target.value })
              }
            />
          </div>

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

          <div>
            <label className={labelClass}>Search Aliases (Optional)</label>
            <TagInput
              value={formData.search_aliases ? formData.search_aliases.split(',').filter(Boolean) : []}
              onChange={(tags) => setFormData({ ...formData, search_aliases: tags.length > 0 ? tags.join(',') : "" })}
              placeholder="e.g. DU, SOL, Delhi Univ"
            />
          </div>

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

          <div className="flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
            <div>
              <p className="text-sm font-medium text-zinc-200">Active Status</p>
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

          <div className="pt-6 mt-6 border-t border-zinc-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formLoading || uploading || isPending}
              className="px-6 py-2.5 bg-zinc-200 hover:bg-white text-zinc-950 text-sm font-semibold rounded-xl transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
              {(formLoading || uploading || isPending) && <Loader2 className="w-4 h-4 animate-spin" />}
              {uploading ? "Uploading..." : formLoading || isPending ? "Saving..." : "Save University"}
            </button>
          </div>
        </form>
      </SlideOverDrawer>

      <ConfirmDeleteModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={executeDelete}
        itemName={itemToDelete?.name || ""}
        isLoading={isDeleting || isPending}
        customMessage="This will cascade-delete all courses, subjects, chapters, and resources under it."
      />
    </div>
  );
}
