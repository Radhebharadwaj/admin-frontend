"use client";
export const runtime = "edge";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  Bookmark,
  FileText,
  Plus,
  Trash2,
  Pencil,
  Loader2,
  File,
  ExternalLink,
  Lock,
  UploadCloud,
} from "lucide-react";
import useSWR from "swr";
import Image from "next/image";
import { fetchApi, swrFetcher } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { canEdit, canDelete, type Role } from "@/lib/rbac";
import SkeletonTable from "@/components/admin/SkeletonTable";
import Breadcrumb from "@/components/admin/Breadcrumb";
import DataTable from "@/components/admin/DataTable";
import SlideOverDrawer from "@/components/admin/SlideOverDrawer";
import ImageUploader from "@/components/admin/ImageUploader";
import ConfirmDeleteModal from "@/components/admin/ConfirmDeleteModal";
import dynamic from 'next/dynamic';

const TiptapEditor = dynamic(() => import("@/components/admin/TiptapEditor"), {
  ssr: false,
  loading: () => <div className="h-[500px] w-full bg-zinc-900 border border-zinc-800 rounded-xl animate-pulse"></div>
});

// ===== TYPES =====
interface Chapter {
  id: string;
  subject_id: string;
  chapter_number: number;
  title: string;
  unit_name: string | null;
  is_active: number;
}
interface Resource {
  id: string;
  subject_id: string;
  chapter_id: string | null;
  category: string;
  title: string;
  external_url: string | null;
  thumbnail_url: string | null;
  description: string | null;
  price_in_inr: number;
  is_public: number;
  is_active: number;
  valid_from?: string | null;
  free_after_date?: string | null;
  submission_deadline?: string | null;
  content_type?: string;
  r2_object_key?: string | null;
  rich_text_content?: string | null;
}

const CATEGORIES = [
  { value: "ASSIGNMENT", label: "Assignment" },
  { value: "PROJECT", label: "Project" },
  { value: "PYQ", label: "PYQ (Previous Year Question)" },
  { value: "SHORTNOTES", label: "Short Notes" },
  { value: "SOLUTION", label: "Solution" },
  { value: "VIDEO_LECTURE", label: "Video Lecture" },
  { value: "EBOOK_MODULE", label: "eBook Module" },
];

export default function SubjectDetailsPage() {
  const params = useParams();
  const universityId = params.id as string;
  const courseId = params.courseId as string;
  const semester = params.semester as string;
  const subjectId = params.subjectId as string;
  const { user, addToast } = useAuthStore();
  const role = (user?.role || "GUEST") as Role;

  // Data
  const { data: uniData } = useSWR(`/api/universities/${universityId}`, swrFetcher);
  const { data: courseData } = useSWR(`/api/courses/${courseId}`, swrFetcher);
  const { data: subData } = useSWR(`/api/subjects/${subjectId}`, swrFetcher);
  const { data: chapters = [], error: chError, mutate: mutateChapters } = useSWR<Chapter[]>(`/api/chapters?subject_id=${subjectId}`, swrFetcher);
  const { data: resources = [], error: resError, isLoading: loading, mutate: mutateResources } = useSWR<Resource[]>(`/api/resources?subject_id=${subjectId}`, swrFetcher);

  const univName = uniData?.name || "";
  const courseName = courseData?.name || "";
  const subjectCode = subData?.subject_code || "";
  const subjectName = subData?.name || "";

  // Drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [formType, setFormType] = useState<"chapter" | "resource">("chapter");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: string; id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      addToast("error", "File is too large. Maximum size is 50MB.");
      return;
    }

    setUploadingDoc(true);
    try {
      const uploadData = new FormData();
      uploadData.append("file", file);
      uploadData.append("folder", "documents");

      const res = await fetchApi("/api/upload/document", {
        method: "POST",
        body: uploadData,
      });

      if (!res.success) throw new Error(res.message);
      
      setFormData((prev: any) => ({ ...prev, r2_object_key: res.data.url }));
      addToast("success", "File uploaded successfully.");
    } catch (err: any) {
      addToast("error", err.message || "File upload failed.");
    } finally {
      setUploadingDoc(false);
    }
  };

  // ===== Drawer Helpers =====
  const openChapterCreate = () => {
    setFormType("chapter");
    setEditingId(null);
    setFormData({ title: "", chapter_number: "", unit_name: "" });
    setError("");
    setDrawerOpen(true);
  };
  const openChapterEdit = (c: Chapter) => {
    setFormType("chapter");
    setEditingId(c.id);
    setFormData({ ...c });
    setError("");
    setDrawerOpen(true);
  };
  const openContextualResourceCreate = (chapterId: string | null) => {
    setFormType("resource");
    setEditingId(null);
    setFormData({
      title: "",
      category: "ASSIGNMENT",
      chapter_id: chapterId || "",
      external_url: "",
      thumbnail_url: null,
      description: "",
      price_in_inr: "0",
      is_public: false,
      is_free: false,
      valid_from: "",
      free_after_date: "",
      submission_deadline: "",
      content_type: "external_url",
      r2_object_key: "",
      rich_text_content: "",
    });
    setError("");
    setDrawerOpen(true);
  };
  const openResourceEdit = (r: Resource) => {
    setFormType("resource");
    setEditingId(r.id);
    setFormData({
      ...r,
      price_in_inr: String(r.price_in_inr || 0),
      is_public: r.is_public === 1,
      is_free: (r.price_in_inr || 0) === 0,
      valid_from: r.valid_from ? new Date(r.valid_from).toISOString().slice(0, 16) : "",
      free_after_date: r.free_after_date ? new Date(r.free_after_date).toISOString().slice(0, 16) : "",
      submission_deadline: r.submission_deadline ? new Date(r.submission_deadline).toISOString().slice(0, 16) : "",
      content_type: r.content_type || "external_url",
      r2_object_key: r.r2_object_key || "",
      rich_text_content: r.rich_text_content || "",
    });
    setError("");
    setDrawerOpen(true);
  };

  const handleDelete = (type: string, id: string, name: string) => {
    setItemToDelete({ type, id, name });
    setDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    if (!itemToDelete) return;
    const { type, id } = itemToDelete;
    setIsDeleting(true);
    try {
      if (type === "chapters") {
        await mutateChapters(
          async () => {
            const res = await fetchApi(`/api/${type}/${id}`, { method: "DELETE" });
            if (!res.success) throw new Error(res.message);
            return chapters.filter((c) => c.id !== id);
          },
          {
            optimisticData: chapters.filter((c) => c.id !== id),
            rollbackOnError: true,
            populateCache: true,
            revalidate: false,
          }
        );
      } else {
        await mutateResources(
          async () => {
            const res = await fetchApi(`/api/${type}/${id}`, { method: "DELETE" });
            if (!res.success) throw new Error(res.message);
            return resources.filter((r) => r.id !== id);
          },
          {
            optimisticData: resources.filter((r) => r.id !== id),
            rollbackOnError: true,
            populateCache: true,
            revalidate: false,
          }
        );
      }
      addToast("success", "Deleted successfully.");
    } catch (err: any) {
      addToast("error", err.message || `Failed to delete ${type}.`);
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
      if (formType === "chapter") {
        const url = editingId ? `/api/chapters/${editingId}` : "/api/chapters";
        const payload: any = {
          ...formData,
          chapter_number: parseInt(formData.chapter_number),
          unit_name: formData.unit_name ? formData.unit_name.trim() : null,
        };
        if (!editingId) payload.subject_id = subjectId;

        const optimisticData = editingId
          ? chapters.map((c) => (c.id === editingId ? { ...c, ...payload } : c))
          : [{ ...payload, id: `temp-${Date.now()}` }, ...chapters];

        await mutateChapters(
          async () => {
            const res = await fetchApi(url, {
              method: editingId ? "PATCH" : "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
            if (!res.success) throw new Error(res.message);
            const fetchRes = await fetchApi(`/api/chapters?subject_id=${subjectId}`);
            if (fetchRes.success) return fetchRes.data;
            throw new Error("Failed to reload data");
          },
          {
            optimisticData: optimisticData as Chapter[],
            rollbackOnError: true,
            populateCache: true,
            revalidate: false,
          }
        );
        addToast("success", "Saved successfully.");
      } else {
        const url = editingId
          ? `/api/resources/${editingId}`
          : "/api/resources";
        const payload: any = {
          ...formData,
          chapter_id: formData.chapter_id || null,
          price_in_inr: formData.is_free ? 0 : parseInt(formData.price_in_inr || "0"),
          is_public: formData.is_public ? 1 : 0,
          external_url: formData.content_type === "external_url" ? (formData.external_url || null) : null,
          thumbnail_url: formData.thumbnail_url || null,
          description: formData.description || null,
          valid_from: formData.valid_from ? new Date(formData.valid_from).toISOString() : null,
          free_after_date: formData.free_after_date ? new Date(formData.free_after_date).toISOString() : null,
          submission_deadline: formData.submission_deadline && (formData.category === "ASSIGNMENT" || formData.category === "PROJECT") ? new Date(formData.submission_deadline).toISOString() : null,
          content_type: formData.content_type || "external_url",
          r2_object_key: formData.content_type === "r2_upload" ? (formData.r2_object_key || null) : null,
          rich_text_content: formData.content_type === "internal_module" ? (formData.rich_text_content || null) : null,
        };
        delete payload.is_free;
        if (!editingId) payload.subject_id = subjectId;

        const optimisticData = editingId
          ? resources.map((r) => (r.id === editingId ? { ...r, ...payload } : r))
          : [{ ...payload, id: `temp-${Date.now()}` }, ...resources];

        await mutateResources(
          async () => {
            const res = await fetchApi(url, {
              method: editingId ? "PATCH" : "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
            if (!res.success) throw new Error(res.message);
            const fetchRes = await fetchApi(`/api/resources?subject_id=${subjectId}`);
            if (fetchRes.success) return fetchRes.data;
            throw new Error("Failed to reload data");
          },
          {
            optimisticData: optimisticData as Resource[],
            rollbackOnError: true,
            populateCache: true,
            revalidate: false,
          }
        );
        addToast("success", "Saved successfully.");
      }
      setDrawerOpen(false);
    } catch (err: any) {
      setError(err.message);
      addToast("error", err.message || "Failed to save.");
    }
    setFormLoading(false);
  };

  // Group chapters by unit_name (normalized to prevent duplicates)
  const groupedChapters = chapters.reduce<
    { unitName: string | null; items: Chapter[] }[]
  >((acc, ch) => {
    const rawUnit = ch.unit_name || null;
    const normalizedUnit = rawUnit ? rawUnit.trim().toUpperCase() : null;
    
    const existing = acc.find((g) => g.unitName === normalizedUnit);
    if (existing) {
      existing.items.push(ch);
    } else {
      acc.push({ unitName: normalizedUnit, items: [ch] });
    }
    return acc;
  }, []).sort((a, b) => {
    // Put chapters without a unit at the top
    if (a.unitName === null) return -1;
    if (b.unitName === null) return 1;
    return a.unitName.localeCompare(b.unitName);
  });

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
            label: univName || <div className="w-24 h-4 bg-zinc-800 animate-pulse rounded" />,
            href: `/admin/universities/${universityId}/courses`,
          },
          {
            label: courseName || <div className="w-32 h-4 bg-zinc-800 animate-pulse rounded" />,
            href: `/admin/universities/${universityId}/courses/${courseId}/semesters`,
          },
          {
            label: `Sem ${semester}`,
            href: `/admin/universities/${universityId}/courses/${courseId}/semesters/${semester}/subjects`,
          },
          { label: subjectName ? `${subjectCode} — ${subjectName}` : <div className="w-48 h-4 bg-zinc-800 animate-pulse rounded" /> },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            {subjectName ? (
              `${subjectCode} — Chapters & Resources`
            ) : (
              <div className="w-72 h-9 bg-zinc-800 animate-pulse rounded-lg" />
            )}
          </h1>
          <p className="text-sm text-zinc-400 mt-1.5 font-medium">
            {subjectName || <span className="w-32 h-4 bg-zinc-800 animate-pulse rounded inline-block" />}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {canEdit(role, "chapters") && (
            <button
              onClick={openChapterCreate}
              className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-bold rounded-xl transition-all active:scale-95 border border-zinc-700"
            >
              <Plus className="w-4 h-4" /> Add Chapter
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-8">
          <SkeletonTable />
          <SkeletonTable />
        </div>
      ) : (chError || resError) ? (
        <div className="flex flex-col items-center justify-center py-32 text-red-500">
          <p className="text-sm font-medium">Failed to load data.</p>
        </div>
      ) : (
        <div className="space-y-8">
        <div>
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-indigo-400" /> Syllabus Chapters
          </h3>

          {groupedChapters.length === 0 ? (
            <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-12 text-center">
              <Bookmark className="w-12 h-12 mx-auto mb-3 text-zinc-700 opacity-30" />
              <p className="text-sm font-medium text-zinc-600">
                No chapters added yet.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {groupedChapters.map((group, gi) => (
                <div key={gi}>
                  {group.unitName && (
                    <div className="flex items-center gap-4 mb-2 mt-4">
                      <span className="text-xs font-bold tracking-widest text-indigo-400 uppercase">
                        {group.unitName}
                      </span>
                      <div className="flex-1 border-t border-zinc-800" />
                    </div>
                  )}
                  <DataTable
                    headers={["#", "Title", "Actions"]}
                    rowCount={group.items.length}
                    emptyIcon={Bookmark}
                    emptyText="No chapters"
                  >
                    {group.items.map((c) => (
                      <tr
                        key={c.id}
                        className="group hover:bg-zinc-800/30 transition-colors"
                      >
                        <td className="px-6 py-4 w-24 align-middle">
                          <span className="inline-flex items-center justify-center whitespace-nowrap px-2.5 py-1 rounded-md bg-zinc-800/50 border border-zinc-700 text-zinc-300 text-xs font-semibold tracking-wide">
                            CH {c.chapter_number}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-white align-middle">
                          <div className="flex flex-col gap-2">
                            <span>{c.title}</span>
                            {resources.filter((r) => r.chapter_id === c.id).length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-1">
                                {resources
                                  .filter((r) => r.chapter_id === c.id)
                                  .map((r) => (
                                    <button
                                      key={r.id}
                                      onClick={() => openResourceEdit(r)}
                                      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-medium hover:bg-indigo-500/20 transition-colors text-left"
                                    >
                                      <FileText className="w-3 h-3 shrink-0" />
                                      <span className="truncate max-w-[150px]">{r.title}</span>
                                    </button>
                                  ))}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right align-middle">
                          <div className="flex items-center justify-end gap-1">
                            {canEdit(role, "resources") && (
                              <button
                                onClick={() => openContextualResourceCreate(c.id)}
                                className="p-2 text-indigo-400 hover:text-indigo-300 rounded-lg hover:bg-indigo-500/10 transition-colors"
                                title="Add Material"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            )}
                            {canEdit(role, "chapters") && (
                              <button
                                onClick={() => openChapterEdit(c)}
                                className="p-2 text-zinc-500 hover:text-white rounded-lg hover:bg-zinc-700 transition-colors"
                                title="Edit Chapter"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                            )}
                            {canDelete(role, "chapters") && (
                              <button
                                onClick={() =>
                                  handleDelete("chapters", c.id, c.title)
                                }
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
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ===== MASTER MATERIALS SECTION ===== */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-400" /> Subject Master Materials (Books, PYQs, Syllabus)
            </h3>
            {canEdit(role, "resources") && (
              <button
                onClick={() => openContextualResourceCreate(null)}
                className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-lg transition-all border border-emerald-500/20"
              >
                <Plus className="w-3 h-3" /> Add Master Material
              </button>
            )}
          </div>
          <DataTable
            headers={[
              "Title",
              "Category",
              "Price",
              "Actions",
            ]}
            emptyIcon={File}
            emptyText="No master materials uploaded yet."
            rowCount={resources.filter((r) => !r.chapter_id).length}
          >
            {resources.filter((r) => !r.chapter_id).map((r) => (
              <tr
                key={r.id}
                className="group hover:bg-zinc-800/30 transition-colors"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {r.thumbnail_url ? (
                      <div className="relative w-9 h-12 rounded-md overflow-hidden border border-zinc-700 shrink-0">
                        <Image
                          src={r.thumbnail_url}
                          alt={r.title}
                          fill
                          sizes="36px"
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-9 h-12 rounded-md bg-zinc-800/50 border border-zinc-700 flex items-center justify-center text-zinc-500">
                        <FileText className="w-4 h-4" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="font-semibold text-white text-sm truncate max-w-[200px]">
                        {r.title}
                      </div>
                      {r.external_url && (
                        <a
                          href={r.external_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-indigo-400 hover:underline flex items-center gap-1 mt-0.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="w-3 h-3" /> External Link
                        </a>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-[10px] font-bold text-zinc-300 bg-zinc-800 px-2.5 py-1 rounded-md border border-zinc-700">
                    {r.category}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm font-medium">
                  {r.price_in_inr > 0 ? (
                    <span className="text-emerald-400">₹{r.price_in_inr}</span>
                  ) : (
                    <span className="text-zinc-500">FREE</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {canEdit(role, "resources") && (
                      <button
                        onClick={() => openResourceEdit(r)}
                        className="p-2 text-zinc-500 hover:text-white rounded-lg hover:bg-zinc-700 transition-colors"
                        title="Edit Resource"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    )}
                    {canDelete(role, "resources") && (
                      <button
                        onClick={() =>
                          handleDelete("resources", r.id, r.title)
                        }
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
        </div>
        </div>
      )}

      {/* ===== DRAWER ===== */}
      <SlideOverDrawer
        title={
          formType === "chapter"
            ? editingId
              ? "Edit Chapter"
              : "Create Chapter"
            : editingId
            ? "Edit Resource"
            : "Create Resource"
        }
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        wide={formType === "resource"}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          {/* ===== CHAPTER FORM ===== */}
          {formType === "chapter" && (
            <>
              <div>
                <label className={labelClass}>Chapter Number</label>
                <input
                  type="number"
                  min="1"
                  className={inputClass}
                  value={formData.chapter_number || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      chapter_number: e.target.value,
                    })
                  }
                  placeholder="1"
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Chapter Title</label>
                <input
                  type="text"
                  className={inputClass}
                  value={formData.title || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Introduction to Arrays"
                  required
                />
              </div>
              <div>
                <label className={labelClass}>
                  Unit / Block Name{" "}
                  <span className="text-zinc-600">(Optional)</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    className={inputClass}
                    value={formData.unit_name || ""}
                    onChange={(e) => {
                      setFormData({ ...formData, unit_name: e.target.value });
                      setShowUnitDropdown(true);
                    }}
                    onFocus={() => setShowUnitDropdown(true)}
                    onBlur={() => setTimeout(() => setShowUnitDropdown(false), 200)}
                    placeholder="Block 1"
                  />
                  {showUnitDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl max-h-48 overflow-auto">
                      {Array.from(new Set(chapters.map((c) => c.unit_name?.trim()).filter(Boolean)))
                        .filter((u) => u!.toLowerCase().includes((formData.unit_name || "").toLowerCase()))
                        .map((u) => (
                          <button
                            key={u}
                            type="button"
                            className="w-full text-left px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors border-b border-zinc-800/50 last:border-0"
                            onClick={() => {
                              setFormData({ ...formData, unit_name: u });
                              setShowUnitDropdown(false);
                            }}
                          >
                            {u}
                          </button>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-xs text-zinc-600 mt-1.5">
                  Type a new unit or select an existing one to group chapters.
                </p>
              </div>
            </>
          )}

          {/* ===== RESOURCE FORM ===== */}
          {formType === "resource" && (
            <>
              {/* Cover Image Upload */}
              <ImageUploader
                value={formData.thumbnail_url || null}
                onChange={(url) =>
                  setFormData({ ...formData, thumbnail_url: url })
                }
                folder="covers"
                label="Cover Image (Thumbnail)"
                placeholder="Upload a cover image for this resource"
              />

              <div>
                <label className={labelClass}>Resource Title</label>
                <input
                  type="text"
                  className={inputClass}
                  value={formData.title || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="e.g. Introduction to Algorithms (eBook)"
                  required
                />
              </div>

              <div>
                <label className={labelClass}>Category</label>
                <select
                  className={inputClass}
                  value={formData.category || "ASSIGNMENT"}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-4 flex flex-col gap-1">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Target Destination
                </span>
                <span className="text-sm font-medium text-white flex items-center gap-2 mt-1">
                  <Bookmark className="w-4 h-4 text-indigo-400" />
                  {formData.chapter_id
                    ? `Chapter: ${chapters.find((c) => c.id === formData.chapter_id)?.title || "Unknown"}`
                    : "Entire Subject (Master Material)"}
                </span>
              </div>

              {/* Content Source Switcher */}
              <div className="space-y-3">
                <label className={labelClass}>Content Source</label>
                <div className="flex gap-2 p-1 bg-zinc-900 rounded-xl border border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, content_type: "external_url" })}
                    className={`flex-1 text-xs font-semibold py-2 rounded-lg transition-colors ${
                      formData.content_type === "external_url"
                        ? "bg-zinc-800 text-white shadow-sm"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    External Link
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, content_type: "r2_upload" })}
                    className={`flex-1 text-xs font-semibold py-2 rounded-lg transition-colors ${
                      formData.content_type === "r2_upload"
                        ? "bg-zinc-800 text-white shadow-sm"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, content_type: "internal_module" })}
                    className={`flex-1 text-xs font-semibold py-2 rounded-lg transition-colors ${
                      formData.content_type === "internal_module"
                        ? "bg-zinc-800 text-white shadow-sm"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    Internal Module
                  </button>
                </div>

                {/* Tab Content */}
                <div className="mt-4">
                  {formData.content_type === "external_url" && (
                    <div className="animate-in fade-in duration-300">
                      <input
                        type="url"
                        className={inputClass}
                        value={formData.external_url || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, external_url: e.target.value })
                        }
                        placeholder="https://egyankosh.ac.in/bitstream/..."
                      />
                      <p className="text-xs text-zinc-600 mt-1.5">
                        For eBooks/Govt PDFs. Will be served via our CORS proxy.
                      </p>
                    </div>
                  )}

                  {formData.content_type === "r2_upload" && (
                    <div className="animate-in fade-in duration-300">
                      {formData.r2_object_key ? (
                        <div className="flex items-center justify-between p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <File className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                            <div className="truncate">
                              <p className="text-sm font-semibold text-white truncate">
                                {formData.r2_object_key.split("/").pop()}
                              </p>
                              <p className="text-xs text-indigo-300">Upload Complete</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, r2_object_key: "" })}
                            className="p-2 text-zinc-400 hover:text-white transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-zinc-800 border-dashed rounded-xl cursor-pointer bg-zinc-900/50 hover:bg-zinc-800/50 hover:border-zinc-700 transition-all group">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            {uploadingDoc ? (
                              <>
                                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-2" />
                                <p className="text-sm font-semibold text-zinc-300">Uploading to R2...</p>
                              </>
                            ) : (
                              <>
                                <UploadCloud className="w-8 h-8 text-zinc-500 group-hover:text-indigo-400 transition-colors mb-2" />
                                <p className="text-sm font-semibold text-zinc-300">Click to upload a document</p>
                                <p className="text-xs text-zinc-500 mt-1">PDF, MP4, WebM (Max 50MB)</p>
                              </>
                            )}
                          </div>
                          <input
                            type="file"
                            className="hidden"
                            accept="application/pdf,video/mp4,video/webm,application/epub+zip,application/zip"
                            onChange={handleFileUpload}
                            disabled={uploadingDoc}
                          />
                        </label>
                      )}
                    </div>
                  )}

                  {formData.content_type === "internal_module" && (
                    <div className="animate-in fade-in duration-300">
                      <TiptapEditor
                        value={formData.rich_text_content || ""}
                        onChange={(val) => setFormData({ ...formData, rich_text_content: val })}
                      />
                      <p className="text-xs text-zinc-500 mt-2">
                        This module will be rendered natively inside the student's learning portal.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className={labelClass}>Description</label>
                <textarea
                  className={`${inputClass} min-h-[100px] resize-y`}
                  value={formData.description || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Brief description of this resource..."
                  rows={4}
                />
              </div>

              {/* Pricing & Access Rules Card */}
              <div className="bg-zinc-900/50 border border-zinc-700/50 rounded-xl p-5 space-y-6">
                <h4 className="text-sm font-bold text-white flex items-center gap-2 border-b border-zinc-800 pb-3">
                  <Lock className="w-4 h-4 text-indigo-400" /> Pricing & Access Rules
                </h4>

                {/* Smart Pricing & Visibility */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className={labelClass}>Resource Type</label>
                    <div className="flex gap-5 mt-2">
                      <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-zinc-300 hover:text-white transition-colors">
                        <input
                          type="radio"
                          name="pricing_type"
                          value="free"
                          checked={formData.is_free || false}
                          onChange={() => setFormData({ ...formData, is_free: true, price_in_inr: "0" })}
                          className="accent-indigo-500 w-4 h-4"
                        />
                        Free Resource
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-zinc-300 hover:text-white transition-colors">
                        <input
                          type="radio"
                          name="pricing_type"
                          value="paid"
                          checked={!formData.is_free}
                          onChange={() => setFormData({ ...formData, is_free: false })}
                          className="accent-indigo-500 w-4 h-4"
                        />
                        Paid / Premium
                      </label>
                    </div>
                  </div>

                  {!formData.is_free && (
                    <div className="animate-in fade-in zoom-in-95 duration-200">
                      <label className={labelClass}>Price (INR)</label>
                      <input
                        type="number"
                        min="0"
                        className={inputClass}
                        value={formData.price_in_inr || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, price_in_inr: e.target.value })
                        }
                        placeholder="e.g. 49"
                        required={!formData.is_free}
                      />
                    </div>
                  )}
                </div>

                {/* Visibility Toggle */}
                <div>
                  <label className="flex items-center gap-3 cursor-pointer select-none group inline-flex">
                    <div className="relative">
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={formData.is_public || false}
                        onChange={(e) =>
                          setFormData({ ...formData, is_public: e.target.checked })
                        }
                      />
                      <div className={`block w-10 h-6 rounded-full transition-colors duration-300 ${formData.is_public ? 'bg-indigo-500' : 'bg-zinc-700'}`}></div>
                      <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 shadow-sm ${formData.is_public ? 'transform translate-x-4' : ''}`}></div>
                    </div>
                    <span className="text-sm font-semibold text-white group-hover:text-indigo-400 transition-colors">Public Visibility</span>
                  </label>
                  <p className="text-xs font-medium text-zinc-500 mt-2">
                    (If ON, unregistered students can see this exists for SEO. If OFF, only enrolled students see it)
                  </p>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-3 border-t border-zinc-800/50">
                  <div>
                    <label className={labelClass}>Valid From (Optional)</label>
                    <input
                      type="datetime-local"
                      className={`${inputClass} [color-scheme:dark]`}
                      value={formData.valid_from || ""}
                      onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                    />
                    <p className="text-xs font-medium text-zinc-500 mt-2">
                      (When should this resource become visible/unlocked? Leave empty to publish immediately)
                    </p>
                  </div>

                  {!formData.is_free && (
                    <div className="animate-in fade-in duration-300">
                      <label className={labelClass}>Make Free After (Optional)</label>
                      <input
                        type="datetime-local"
                        className={`${inputClass} [color-scheme:dark]`}
                        value={formData.free_after_date || ""}
                        onChange={(e) => setFormData({ ...formData, free_after_date: e.target.value })}
                      />
                      <p className="text-xs font-medium text-zinc-500 mt-2">
                        (Use this if a paid module should automatically become free after a certain date/exam)
                      </p>
                    </div>
                  )}
                </div>

                {/* Submission Deadline for Assignments/Projects */}
                {(formData.category === "ASSIGNMENT" || formData.category === "PROJECT") && (
                  <div className="pt-3 border-t border-zinc-800/50 animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className={labelClass}>Submission Deadline</label>
                    <input
                      type="datetime-local"
                      className={`${inputClass} [color-scheme:dark]`}
                      value={formData.submission_deadline || ""}
                      onChange={(e) => setFormData({ ...formData, submission_deadline: e.target.value })}
                      required
                    />
                    <p className="text-xs font-medium text-zinc-500 mt-2">
                      (Set the final date for students to submit this assignment)
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

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
              {editingId ? "Save Changes" : "Create"}
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

