"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import useSWR from "swr";
import Link from "next/link";
import { Layers, Loader2 } from "lucide-react";
import { swrFetcher } from "@/lib/api";
import Breadcrumb from "@/components/admin/Breadcrumb";

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
  const { data: courseData, error: courseError } = useSWR(`/api/courses/${courseId}`, swrFetcher);
  const { data: semesters = [], error: semError, isLoading: loading } = useSWR<SemesterInfo[]>(`/api/subjects/semesters?course_id=${courseId}`, swrFetcher);

  const univName = uniData?.name || "";
  const courseName = courseData?.name || "";
  const totalSemesters = courseData?.total_semesters || 0;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-zinc-500">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-indigo-500" />
        <p className="text-sm font-medium">Loading semesters...</p>
      </div>
    );
  }

  if (uniError || courseError || semError) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-red-500">
        <p className="text-sm font-medium">Failed to load data.</p>
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
          { label: `${courseName} — Semesters` },
        ]}
      />

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">
          {courseName} — Semesters
        </h1>
        <p className="text-sm text-zinc-400 mt-1.5 font-medium">
          Select a semester to manage its subjects.
        </p>
      </div>

      {/* Semester Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {Array.from({ length: totalSemesters }, (_, i) => {
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
    </div>
  );
}

