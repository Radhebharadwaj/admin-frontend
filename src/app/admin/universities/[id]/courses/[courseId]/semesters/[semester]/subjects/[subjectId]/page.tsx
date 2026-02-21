"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  Bookmark,
  FileText,
  Plus,
  Trash2,
  MoreHorizontal,
  Loader2,
  File,
  ExternalLink,
} from "lucide-react";
import { fetchApi } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { canEdit, canDelete, type Role } from "@/lib/rbac";
import Breadcrumb from "@/components/admin/Breadcrumb";
import DataTable from "@/components/admin/DataTable";
import SlideOverDrawer from "@/components/admin/SlideOverDrawer";
import ImageUploader from "@/components/admin/ImageUploader";

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
  const { user } = useAuthStore();
  const role = (user?.role || "GUEST") as Role;

  // Context for breadcrumb
  const [univName, setUnivName] = useState("");
  const [courseName, setCourseName] = useState("");
  const [subjectCode, setSubjectCode] = useState("");
  const [subjectName, setSubjectName] = useState("");

  // Data
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  // Drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [formType, setFormType] = useState<"chapter" | "resource">("chapter");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [uniRes, courseRes, subRes, chRes, rsRes] = await Promise.all([
      fetchApi(`/api/universities/${universityId}`),
      fetchApi(`/api/courses/${courseId}`),
      fetchApi(`/api/subjects/${subjectId}`),
      fetchApi(`/api/chapters?subject_id=${subjectId}`),
      fetchApi(`/api/resources?subject_id=${subjectId}`),
    ]);
    if (uniRes.success) setUnivName(uniRes.data.name);
    if (courseRes.success) setCourseName(courseRes.data.name);
    if (subRes.success) {
      setSubjectCode(subRes.data.subject_code);
      setSubjectName(subRes.data.name);
    }
    if (chRes.success) setChapters(chRes.data);
    else setChapters([]);
    if (rsRes.success) setResources(rsRes.data);
    else setResources([]);
    setLoading(false);
  }, [universityId, courseId, subjectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
  const openResourceCreate = () => {
    setFormType("resource");
    setEditingId(null);
    setFormData({
      title: "",
      category: "ASSIGNMENT",
      chapter_id: "",
      external_url: "",
      thumbnail_url: null,
      description: "",
      price_in_inr: "0",
      is_public: false,
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
    });
    setError("");
    setDrawerOpen(true);
  };

  const handleDelete = async (entity: string, id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This is permanent.`)) return;
    await fetchApi(`/api/${entity}/${id}`, { method: "DELETE" });
    await fetchData();
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
          unit_name: formData.unit_name || null,
        };
        if (!editingId) payload.subject_id = subjectId;
        const res = await fetchApi(url, {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.success) throw new Error(res.message);
      } else {
        const url = editingId
          ? `/api/resources/${editingId}`
          : "/api/resources";
        const payload: any = {
          ...formData,
          chapter_id: formData.chapter_id || null,
          price_in_inr: parseInt(formData.price_in_inr || "0"),
          is_public: formData.is_public ? 1 : 0,
          external_url: formData.external_url || null,
          thumbnail_url: formData.thumbnail_url || null,
          description: formData.description || null,
        };
        if (!editingId) payload.subject_id = subjectId;
        const res = await fetchApi(url, {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.success) throw new Error(res.message);
      }
      await fetchData();
      setDrawerOpen(false);
    } catch (err: any) {
      setError(err.message);
    }
    setFormLoading(false);
  };

  // Group chapters by unit_name
  const groupedChapters = chapters.reduce<
    { unitName: string | null; items: Chapter[] }[]
  >((acc, ch) => {
    const existing = acc.find((g) => g.unitName === ch.unit_name);
    if (existing) {
      existing.items.push(ch);
    } else {
      acc.push({ unitName: ch.unit_name, items: [ch] });
    }
    return acc;
  }, []);

  const inputClass =
    "w-full bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all placeholder-zinc-600";
  const labelClass =
    "block text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wide";

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-zinc-500">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-indigo-500" />
        <p className="text-sm font-medium">Loading subject details...</p>
      </div>
    );
  }

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
          {
            label: `Sem ${semester}`,
            href: `/admin/universities/${universityId}/courses/${courseId}/semesters/${semester}/subjects`,
          },
          { label: `${subjectCode} — ${subjectName}` },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            {subjectCode} — Chapters & Resources
          </h1>
          <p className="text-sm text-zinc-400 mt-1.5 font-medium">
            {subjectName}
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
          {canEdit(role, "resources") && (
            <button
              onClick={openResourceCreate}
              className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-zinc-200 text-black text-sm font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-95"
            >
              <Plus className="w-4 h-4" /> Add Resource
            </button>
          )}
        </div>
      </div>

      {/* ===== CHAPTERS SECTION ===== */}
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
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-lg border border-indigo-500/20 uppercase tracking-wider">
                        {group.unitName}
                      </span>
                      <div className="flex-1 h-px bg-zinc-800" />
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
                        <td className="px-6 py-4 w-20">
                          <span className="text-xs font-bold text-zinc-400 bg-zinc-800 border border-zinc-700 px-2.5 py-1 rounded-md">
                            CH {c.chapter_number}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-white">
                          {c.title}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {canEdit(role, "chapters") && (
                              <button
                                onClick={() => openChapterEdit(c)}
                                className="p-2 text-zinc-500 hover:text-white rounded-lg hover:bg-zinc-700 transition-colors"
                              >
                                <MoreHorizontal className="w-4 h-4" />
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

        {/* ===== RESOURCES SECTION ===== */}
        <div>
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" /> Study Materials
          </h3>
          <DataTable
            headers={[
              "Title",
              "Linked To",
              "Category",
              "Price",
              "Actions",
            ]}
            emptyIcon={File}
            emptyText="No resources uploaded yet."
            rowCount={resources.length}
          >
            {resources.map((r) => (
              <tr
                key={r.id}
                className="group hover:bg-zinc-800/30 transition-colors"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {r.thumbnail_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={r.thumbnail_url}
                        alt={r.title}
                        className="w-9 h-12 rounded-md object-cover border border-zinc-700"
                      />
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
                <td className="px-6 py-4 text-xs font-medium text-zinc-400">
                  {r.chapter_id
                    ? `CH ${
                        chapters.find((c) => c.id === r.chapter_id)
                          ?.chapter_number || "?"
                      }`
                    : "Subject Level"}
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
                      >
                        <MoreHorizontal className="w-4 h-4" />
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
                <input
                  type="text"
                  className={inputClass}
                  value={formData.unit_name || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, unit_name: e.target.value })
                  }
                  placeholder="Block 1"
                />
                <p className="text-xs text-zinc-600 mt-1.5">
                  If provided, chapters will be grouped under this unit in the
                  UI.
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

              <div>
                <label className={labelClass}>Link to Chapter</label>
                <select
                  className={inputClass}
                  value={formData.chapter_id || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, chapter_id: e.target.value })
                  }
                >
                  <option value="">— Subject Level (No Chapter) —</option>
                  {chapters.map((ch) => (
                    <option key={ch.id} value={ch.id}>
                      CH {ch.chapter_number}: {ch.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>
                  External URL{" "}
                  <span className="text-zinc-600">(PDF / Video Link)</span>
                </label>
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Price (INR)</label>
                  <input
                    type="number"
                    min="0"
                    className={inputClass}
                    value={formData.price_in_inr || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        price_in_inr: e.target.value,
                      })
                    }
                    placeholder="₹ 0 for free"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-xs font-semibold text-zinc-400 mt-8 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      className="rounded bg-zinc-900 border-zinc-700 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-zinc-950 w-4 h-4"
                      checked={formData.is_public || false}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          is_public: e.target.checked,
                        })
                      }
                    />
                    Is Public?
                  </label>
                </div>
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
    </div>
  );
}

