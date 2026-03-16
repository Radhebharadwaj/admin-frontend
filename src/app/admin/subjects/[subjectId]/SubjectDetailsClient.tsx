"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FolderOpen,
  FileText,
  Plus,
  Trash2,
  Pencil,
  Loader2,
  Video,
  File,
  ExternalLink,
} from "lucide-react";
import useSWR from "swr";
import { fetchApi, swrFetcher } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { useUpload } from "@/lib/useUpload";
import { canEdit, canDelete, type Role } from "@/lib/rbac";
import Breadcrumb from "@/components/admin/Breadcrumb";
import DataTable from "@/components/admin/DataTable";
import StatusBadge from "@/components/admin/StatusBadge";
import SlideOverDrawer from "@/components/admin/SlideOverDrawer";
import SkeletonTable from "@/components/admin/SkeletonTable";
import ConfirmDeleteModal from "@/components/admin/ConfirmDeleteModal";

// ===== TYPES =====
interface Chapter {
  id: string;
  subject_id: string;
  unit_number: number | null;
  unit_name: string | null;
  chapter_number: number;
  title: string;
  is_active: number;
}

interface MasterMaterial {
  id: string;
  subject_id: string;
  title: string;
  category: string;
  price_in_inr: number;
  r2_object_key: string | null;
  is_active: number;
  // View only fields
  thumbnail_url?: string | null;
  external_url?: string | null;
}

const VALID_CATEGORIES = [
  "ASSIGNMENT",
  "PROJECT",
  "PYQ",
  "SHORTNOTES",
  "SOLUTION",
  "VIDEO_LECTURE",
  "EBOOK_MODULE",
];

export default function SubjectDetailsClient({
  subjectId,
  initialChapters,
  initialResources,
}: {
  subjectId: string;
  initialChapters: Chapter[];
  initialResources: MasterMaterial[];
}) {
  const router = useRouter();
  const { user, addToast, sessionToken } = useAuthStore();
  const role = (user?.role || "GUEST") as Role;
  const { upload, uploading } = useUpload();

  // SWR for client-side freshness, initialized with SSR data
  const {
    data: chapters = initialChapters,
    error: chaptersError,
    mutate: mutateChapters,
  } = useSWR<Chapter[]>(`/api/chapters?subject_id=${subjectId}`, swrFetcher, {
    fallbackData: initialChapters,
  });

  const {
    data: resources = initialResources,
    error: resourcesError,
    mutate: mutateResources,
  } = useSWR<MasterMaterial[]>(
    `/api/resources?subject_id=${subjectId}&category=MASTER`, 
    // In our backend, there's no native "MASTER" category filter that gets everything with chapter_id IS NULL. 
    // But we will filter it client-side.
    swrFetcher,
    { fallbackData: initialResources }
  );

  const masterResources = resources.filter((r) => !(r as any).chapter_id);

  // ===== CHAPTER STATE =====
  const [chapterDrawer, setChapterDrawer] = useState(false);
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [chapterForm, setChapterForm] = useState<Partial<Chapter>>({});
  const [chapterLoading, setChapterLoading] = useState(false);

  // ===== RESOURCE STATE =====
  const [resourceDrawer, setResourceDrawer] = useState(false);
  const [editingResourceId, setEditingResourceId] = useState<string | null>(null);
  const [resourceForm, setResourceForm] = useState<Partial<MasterMaterial>>({ category: "PYQ" });
  const [resourceLoading, setResourceLoading] = useState(false);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string; type: "CHAPTER" | "RESOURCE" } | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);

  // ===== CHAPTER HANDLERS =====
  const openCreateChapter = () => {
    setEditingChapterId(null);
    setChapterForm({ unit_number: 1, chapter_number: 1, title: "", is_active: 1 });
    setChapterDrawer(true);
  };

  const openEditChapter = (c: Chapter) => {
    setEditingChapterId(c.id);
    setChapterForm({ ...c });
    setChapterDrawer(true);
  };

  const handleChapterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionToken) return;

    setChapterLoading(true);

    try {
      // Strict Line-by-Line Payload extraction
      const safeChapterPayload = {
        subject_id: String(subjectId),
        unit_number: chapterForm.unit_number ? Number(chapterForm.unit_number) : null,
        unit_name: chapterForm.unit_name ? String(chapterForm.unit_name) : null,
        chapter_number: Number(chapterForm.chapter_number || 1),
        title: String(chapterForm.title || ""),
        is_active: chapterForm.is_active ? 1 : 0,
      };

      const url = editingChapterId ? `/api/chapters/${editingChapterId}` : "/api/chapters";
      const method = editingChapterId ? "PATCH" : "POST";

      const optimisticData = editingChapterId
        ? chapters.map((c) => (c.id === editingChapterId ? { ...c, ...safeChapterPayload } : c))
        : [
            ...chapters,
            { ...safeChapterPayload, id: `temp-${Date.now()}` } as Chapter,
          ];

      await mutateChapters(
        async () => {
          const res = await fetchApi(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(safeChapterPayload),
          });
          if (!res.success) throw new Error(res.message);
          const fetchRes = await fetchApi(`/api/chapters?subject_id=${subjectId}`);
          return fetchRes.success ? fetchRes.data : optimisticData;
        },
        { optimisticData: optimisticData as Chapter[], rollbackOnError: true, populateCache: true, revalidate: false }
      );

      addToast("success", editingChapterId ? "Chapter updated" : "Chapter created");
      setChapterDrawer(false);
    } catch (err: any) {
      addToast("error", err.message || "Failed to save chapter.");
    } finally {
      setChapterLoading(false);
    }
  };

  // ===== RESOURCE HANDLERS =====
  const openCreateResource = () => {
    setEditingResourceId(null);
    setResourceForm({ title: "", category: "PYQ", price_in_inr: 0, r2_object_key: "", is_active: 1 });
    setFileToUpload(null);
    setResourceDrawer(true);
  };

  const openEditResource = (r: MasterMaterial) => {
    setEditingResourceId(r.id);
    setResourceForm({ ...r });
    setFileToUpload(null);
    setResourceDrawer(true);
  };

  const handleResourceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionToken) return;

    setResourceLoading(true);

    try {
      let finalKey = resourceForm.r2_object_key;

      if (fileToUpload) {
        const uploadedUrl = await upload(fileToUpload, {
          uploadType: "document",
          entityType: "subjects",
          universitySlug: subjectId, // Using subjectId as bucket partition since we don't have univ slug
          filePrefix: "master",
        });
        if (!uploadedUrl) {
          addToast("error", "Failed to upload file to R2");
          setResourceLoading(false);
          return;
        }
        finalKey = uploadedUrl;
      }

      // Strict Line-by-Line Payload extraction
      const safeResourcePayload = {
        subject_id: String(subjectId),
        title: String(resourceForm.title || ""),
        category: String(resourceForm.category || "PYQ"),
        price_in_inr: Number(resourceForm.price_in_inr || 0),
        r2_object_key: typeof finalKey === "string" ? finalKey : null,
        is_active: resourceForm.is_active ? 1 : 0,
      };

      const url = editingResourceId ? `/api/resources/${editingResourceId}` : "/api/resources";
      const method = editingResourceId ? "PATCH" : "POST";

      const optimisticData = editingResourceId
        ? resources.map((r) => (r.id === editingResourceId ? { ...r, ...safeResourcePayload } : r))
        : [
            { ...safeResourcePayload, id: `temp-${Date.now()}` } as MasterMaterial,
            ...resources,
          ];

      await mutateResources(
        async () => {
          const res = await fetchApi(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(safeResourcePayload),
          });
          if (!res.success) throw new Error(res.message);
          const fetchRes = await fetchApi(`/api/resources?subject_id=${subjectId}`);
          return fetchRes.success ? fetchRes.data : optimisticData;
        },
        { optimisticData: optimisticData as MasterMaterial[], rollbackOnError: true, populateCache: true, revalidate: false }
      );

      addToast("success", editingResourceId ? "Material updated" : "Material created");
      setResourceDrawer(false);
    } catch (err: any) {
      addToast("error", err.message || "Failed to save material.");
    } finally {
      setResourceLoading(false);
    }
  };

  // ===== DELETE HANDLER =====
  const confirmDelete = (id: string, name: string, type: "CHAPTER" | "RESOURCE") => {
    setItemToDelete({ id, name, type });
    setDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);

    try {
      const isChapter = itemToDelete.type === "CHAPTER";
      const url = isChapter ? `/api/chapters/${itemToDelete.id}` : `/api/resources/${itemToDelete.id}`;
      
      if (isChapter) {
        await mutateChapters(
          async () => {
            const res = await fetchApi(url, { method: "DELETE" });
            if (!res.success) throw new Error(res.message);
            return chapters.filter((c) => c.id !== itemToDelete.id);
          },
          { optimisticData: chapters.filter((c) => c.id !== itemToDelete.id), rollbackOnError: true, populateCache: true, revalidate: false }
        );
      } else {
        await mutateResources(
          async () => {
            const res = await fetchApi(url, { method: "DELETE" });
            if (!res.success) throw new Error(res.message);
            return resources.filter((r) => r.id !== itemToDelete.id);
          },
          { optimisticData: resources.filter((r) => r.id !== itemToDelete.id), rollbackOnError: true, populateCache: true, revalidate: false }
        );
      }
      
      addToast("success", `${isChapter ? "Chapter" : "Material"} deleted successfully.`);
    } catch (err: any) {
      addToast("error", err.message || "Failed to delete item.");
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
      setItemToDelete(null);
    }
  };

  // ===== STYLES =====
  const inputClass =
    "w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-200 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-700 transition-all placeholder-zinc-600";
  const labelClass = "block text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wide";

  return (
    <div className="max-w-7xl mx-auto pb-20 animate-in fade-in duration-500 space-y-12">
      <Breadcrumb items={[{ label: "Subjects", href: "/admin/subjects" }, { label: "Details" }]} />

      {/* SECTION 1: SYLLABUS CHAPTERS */}
      <section>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-zinc-200 tracking-tight">Syllabus Chapters</h2>
            <p className="text-sm text-zinc-400 mt-1 font-medium">Manage units and chapters for this subject.</p>
          </div>
          {canEdit(role, "subjects") && (
            <button
              onClick={openCreateChapter}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-200 hover:bg-white text-zinc-950 text-sm font-bold rounded-xl transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" /> Add Chapter
            </button>
          )}
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <DataTable
            headers={["Chapter", "Unit", "Status", "Actions"]}
            emptyIcon={FolderOpen}
            emptyText="No chapters added yet."
            rowCount={chapters.length}
          >
            {chapters.map((c) => (
              <tr key={c.id} className="group hover:bg-zinc-800/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-500 shrink-0">
                      <FolderOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-zinc-200 text-sm">
                        Ch {c.chapter_number}: {c.title}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-zinc-400">
                  {c.unit_number ? `Unit ${c.unit_number}` : "—"} {c.unit_name && `(${c.unit_name})`}
                </td>
                <td className="px-6 py-4">
                  <StatusBadge active={c.is_active === 1} />
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {canEdit(role, "subjects") && (
                      <button
                        onClick={() => openEditChapter(c)}
                        className="p-2 text-zinc-500 hover:text-zinc-200 rounded-lg border border-transparent hover:border-zinc-800 hover:bg-white/5 transition-all"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    )}
                    {canDelete(role, "subjects") && (
                      <button
                        onClick={() => confirmDelete(c.id, c.title, "CHAPTER")}
                        className="p-2 text-zinc-500 hover:text-red-400 rounded-lg border border-transparent hover:border-red-500/20 hover:bg-red-500/5 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </DataTable>
        </div>
      </section>

      {/* SECTION 2: MASTER MATERIALS */}
      <section>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-zinc-200 tracking-tight">Master Materials</h2>
            <p className="text-sm text-zinc-400 mt-1 font-medium">Global files like PYQs or Full Syllabus PDFs.</p>
          </div>
          {canEdit(role, "subjects") && (
            <button
              onClick={openCreateResource}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-200 hover:bg-white text-zinc-950 text-sm font-bold rounded-xl transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" /> Add Material
            </button>
          )}
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <DataTable
            headers={["Material", "Category", "Price", "Status", "Actions"]}
            emptyIcon={FileText}
            emptyText="No master materials added yet."
            rowCount={masterResources.length}
          >
            {masterResources.map((r) => (
              <tr key={r.id} className="group hover:bg-zinc-800/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-500 shrink-0">
                      {r.category === "VIDEO_LECTURE" ? <Video className="w-4 h-4" /> : <File className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="font-semibold text-zinc-200 text-sm">{r.title}</div>
                      {r.r2_object_key && (
                        <div className="text-xs text-zinc-500 font-mono mt-0.5 max-w-[200px] truncate">
                          {r.r2_object_key}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2.5 py-1 bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs font-semibold rounded-md">
                    {r.category}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm font-mono text-zinc-400">
                  {r.price_in_inr > 0 ? `₹${(r.price_in_inr / 100).toFixed(2)}` : "Free"}
                </td>
                <td className="px-6 py-4">
                  <StatusBadge active={r.is_active === 1} />
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {canEdit(role, "subjects") && (
                      <button
                        onClick={() => openEditResource(r)}
                        className="p-2 text-zinc-500 hover:text-zinc-200 rounded-lg border border-transparent hover:border-zinc-800 hover:bg-white/5 transition-all"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    )}
                    {canDelete(role, "subjects") && (
                      <button
                        onClick={() => confirmDelete(r.id, r.title, "RESOURCE")}
                        className="p-2 text-zinc-500 hover:text-red-400 rounded-lg border border-transparent hover:border-red-500/20 hover:bg-red-500/5 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </DataTable>
        </div>
      </section>

      {/* ===== CHAPTER DRAWER ===== */}
      <SlideOverDrawer
        title={editingChapterId ? "Edit Chapter" : "Add Chapter"}
        open={chapterDrawer}
        onClose={() => setChapterDrawer(false)}
      >
        <form onSubmit={handleChapterSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Unit Number</label>
              <input
                type="number"
                className={inputClass}
                value={chapterForm.unit_number || ""}
                onChange={(e) => setChapterForm({ ...chapterForm, unit_number: parseInt(e.target.value) || 0 })}
                placeholder="1"
              />
            </div>
            <div>
              <label className={labelClass}>Chapter Number</label>
              <input
                type="number"
                className={inputClass}
                value={chapterForm.chapter_number || ""}
                onChange={(e) => setChapterForm({ ...chapterForm, chapter_number: parseInt(e.target.value) || 0 })}
                placeholder="1"
                required
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Unit Name (Optional)</label>
            <input
              type="text"
              className={inputClass}
              value={chapterForm.unit_name || ""}
              onChange={(e) => setChapterForm({ ...chapterForm, unit_name: e.target.value })}
              placeholder="e.g. Mechanics"
            />
          </div>

          <div>
            <label className={labelClass}>Chapter Title</label>
            <input
              type="text"
              className={inputClass}
              value={chapterForm.title || ""}
              onChange={(e) => setChapterForm({ ...chapterForm, title: e.target.value })}
              placeholder="e.g. Introduction to Physics"
              required
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-800 rounded-xl">
            <div>
              <p className="text-sm font-medium text-zinc-200">Active Status</p>
            </div>
            <button
              type="button"
              onClick={() => setChapterForm({ ...chapterForm, is_active: chapterForm.is_active === 1 ? 0 : 1 })}
              className={`relative w-12 h-7 rounded-full transition-colors ${
                chapterForm.is_active === 1 ? "bg-emerald-500" : "bg-zinc-700"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                  chapterForm.is_active === 1 ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <div className="pt-6 mt-6 border-t border-zinc-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setChapterDrawer(false)}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={chapterLoading}
              className="px-6 py-2.5 bg-zinc-200 hover:bg-white text-zinc-950 text-sm font-semibold rounded-xl transition-all flex items-center gap-2 disabled:opacity-50 active:scale-95"
            >
              {chapterLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {chapterLoading ? "Saving..." : "Save Chapter"}
            </button>
          </div>
        </form>
      </SlideOverDrawer>

      {/* ===== MASTER MATERIAL DRAWER ===== */}
      <SlideOverDrawer
        title={editingResourceId ? "Edit Material" : "Add Material"}
        open={resourceDrawer}
        onClose={() => setResourceDrawer(false)}
      >
        <form onSubmit={handleResourceSubmit} className="space-y-5">
          <div>
            <label className={labelClass}>Material Title</label>
            <input
              type="text"
              className={inputClass}
              value={resourceForm.title || ""}
              onChange={(e) => setResourceForm({ ...resourceForm, title: e.target.value })}
              placeholder="e.g. 2023 Previous Year Question Paper"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Category</label>
              <select
                className={inputClass}
                value={resourceForm.category || "PYQ"}
                onChange={(e) => setResourceForm({ ...resourceForm, category: e.target.value })}
              >
                {VALID_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Price (Paise)</label>
              <input
                type="number"
                className={inputClass}
                value={resourceForm.price_in_inr || 0}
                onChange={(e) => setResourceForm({ ...resourceForm, price_in_inr: parseInt(e.target.value) || 0 })}
                placeholder="0 for Free"
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>File Upload (PDF)</label>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setFileToUpload(e.target.files?.[0] || null)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-400 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-zinc-800 file:text-zinc-200 hover:file:bg-zinc-700 transition-all"
            />
            {resourceForm.r2_object_key && !fileToUpload && (
              <p className="mt-2 text-xs text-zinc-500 font-mono">
                Current file: {resourceForm.r2_object_key}
              </p>
            )}
          </div>

          <div>
            <label className={labelClass}>Or File URL String</label>
            <input
              type="text"
              className={inputClass}
              value={resourceForm.r2_object_key || ""}
              onChange={(e) => setResourceForm({ ...resourceForm, r2_object_key: e.target.value })}
              placeholder="e.g. subjects/math/pyq-2023.pdf"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-800 rounded-xl">
            <div>
              <p className="text-sm font-medium text-zinc-200">Active Status</p>
            </div>
            <button
              type="button"
              onClick={() => setResourceForm({ ...resourceForm, is_active: resourceForm.is_active === 1 ? 0 : 1 })}
              className={`relative w-12 h-7 rounded-full transition-colors ${
                resourceForm.is_active === 1 ? "bg-emerald-500" : "bg-zinc-700"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                  resourceForm.is_active === 1 ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <div className="pt-6 mt-6 border-t border-zinc-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setResourceDrawer(false)}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={resourceLoading || uploading}
              className="px-6 py-2.5 bg-zinc-200 hover:bg-white text-zinc-950 text-sm font-semibold rounded-xl transition-all flex items-center gap-2 disabled:opacity-50 active:scale-95"
            >
              {(resourceLoading || uploading) && <Loader2 className="w-4 h-4 animate-spin" />}
              {uploading ? "Uploading..." : resourceLoading ? "Saving..." : "Save Material"}
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
      />
    </div>
  );
}
