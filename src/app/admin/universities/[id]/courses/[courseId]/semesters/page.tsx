"use client";
export const runtime = "edge";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import useSWR from "swr";
import Link from "next/link";
import { Layers, Loader2, Settings } from "lucide-react";
import { swrFetcher, fetchApi } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { canEdit, type Role } from "@/lib/rbac";
import Breadcrumb from "@/components/admin/Breadcrumb";
import SkeletonGrid from "@/components/admin/SkeletonGrid";
import SlideOverDrawer from "@/components/admin/SlideOverDrawer";

interface SemesterInfo {
  semester: number;
  subject_count: number;
}

export default function SemestersPage() {
  const router = useRouter();
  const params = useParams();
  const universityId = params.id as string;
  const courseId = params.courseId as string;

  const { data: uniData, error: uniError } = useSWR(`/api/universities/${universityId}`, swrFetcher);
  const { data: courseData, error: courseError, mutate: mutateCourse } = useSWR(`/api/courses/${courseId}`, swrFetcher);
  const { data: semesters = [], error: semError, isLoading: loading } = useSWR<SemesterInfo[]>(`/api/subjects/semesters?course_id=${courseId}`, swrFetcher);

  const univName = uniData?.name || "";
  const courseName = courseData?.name || "";
  const currentTotalSemesters = courseData?.total_semesters || 0;

  const { user, addToast } = useAuthStore();
  const role = (user?.role || "GUEST") as Role;

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [totalSemestersInput, setTotalSemestersInput] = useState<number | "">("");
  const [formLoading, setFormLoading] = useState(false);

  const openEdit = () => {
    setTotalSemestersInput(courseData?.total_semesters || "");
    setDrawerOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    
    try {
      const res = await fetchApi(`/api/courses/${courseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: courseData?.name, 
          slug: courseData?.slug,
          total_semesters: totalSemestersInput 
        }),
      });
      if (!res.success) throw new Error(res.message);
      
      mutateCourse();
      addToast("success", "Semesters updated successfully.");
      setDrawerOpen(false);
    } catch (err: any) {
      addToast("error", err.message || "Failed to update semesters.");
    }
    setFormLoading(false);
  };

  return (
    <div className="max-w-7xl mx-auto pb-20 animate-in fade-in duration-500">
      <Breadcrumb
        items={[
          { label: "Universities", href: "/admin/universities" },
          {
            label: univName || <div className="w-24 h-4 bg-zinc-800 animate-pulse rounded" />,
            href: `/admin/universities/${universityId}/courses`,
          },
          { label: courseName ? `${courseName} — Semesters` : <div className="w-32 h-4 bg-zinc-800 animate-pulse rounded" /> },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            {courseName ? (
              `${courseName} — Semesters`
            ) : (
              <div className="w-64 h-9 bg-zinc-800 animate-pulse rounded-lg" />
            )}
          </h1>
          <p className="text-sm text-zinc-400 mt-1.5 font-medium">
            Select a semester to manage its subjects.
          </p>
        </div>

        {canEdit(role, "courses") && (
          <button
            onClick={openEdit}
            className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-zinc-200 text-black text-sm font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-95"
          >
            <Settings className="w-4 h-4" /> Edit Course / Semesters
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <SkeletonGrid />
      ) : (uniError || courseError || semError) ? (
        <div className="flex flex-col items-center justify-center py-32 text-red-500">
          <p className="text-sm font-medium">Failed to load data.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: currentTotalSemesters }, (_, i) => {
          const sem = i + 1;
          const existing = semesters.find((s) => s.semester === sem);
          const count = existing?.subject_count || 0;
          const hasSubjects = count > 0;

          return (
            <Link
              key={sem}
              href={`/admin/universities/${universityId}/courses/${courseId}/semesters/${sem}/subjects`}
              className={`group relative flex flex-col items-center justify-center p-8 rounded-2xl border transition-all duration-300 hover:-translate-y-1 ${
                hasSubjects
                  ? "bg-zinc-900/60 border-zinc-700 hover:border-indigo-500/40 hover:bg-zinc-800/80 hover:shadow-indigo-500/10 hover:shadow-lg"
                  : "bg-zinc-950/50 border-zinc-800/50 hover:border-zinc-700 hover:bg-zinc-900"
              }`}
            >
              <div
                className={`w-12 h-12 rounded-full mb-4 flex items-center justify-center transition-colors ${
                  hasSubjects
                    ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                    : "bg-zinc-900 text-zinc-600"
                }`}
              >
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-base mb-1">
                Semester {sem}
              </h3>
              <p
                className={`text-xs font-medium ${
                  hasSubjects ? "text-indigo-400" : "text-zinc-600"
                }`}
              >
                {hasSubjects ? `${count} Subject${count > 1 ? "s" : ""}` : "Empty"}
              </p>
            </Link>
          );
        })}
        </div>
      )}

      {/* ===== EDIT DRAWER ===== */}
      <SlideOverDrawer
        title="Edit Course Semesters"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wide">
              Total Semesters <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              min="1"
              max="16"
              className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all placeholder-zinc-600"
              value={totalSemestersInput || ""}
              onChange={(e) => setTotalSemestersInput(parseInt(e.target.value) || "")}
              placeholder="6"
              required
            />
            <p className="text-xs text-zinc-500 mt-2">
              Increase or decrease the total number of semesters for this course. New semester cards will be dynamically generated.
            </p>
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
              {formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Save Changes
            </button>
          </div>
        </form>
      </SlideOverDrawer>
    </div>
  );
}

