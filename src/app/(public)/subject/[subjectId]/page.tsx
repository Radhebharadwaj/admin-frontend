export const runtime = "edge";
"use client";

import { useParams } from "next/navigation";
import useSWR from "swr";
import { swrFetcher } from "@/lib/api";
import { BookOpen, CheckCircle, FileText, Lock, PlayCircle, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface Chapter {
  id: string;
  unit_name: string | null;
  chapter_number: number;
  title: string;
}

interface Resource {
  id: string;
  chapter_id: string | null;
  category: string;
  title: string;
  is_public: number;
  price_in_inr: number;
  thumbnail_url: string | null;
  content_type?: string;
}

export default function SubjectCatalogPage() {
  const params = useParams();
  const subjectId = params.subjectId as string;

  const { data: subject, isLoading: subLoading } = useSWR(
    `/api/subjects/${subjectId}`,
    swrFetcher
  );
  const { data: chapters = [], isLoading: chLoading } = useSWR<Chapter[]>(
    `/api/chapters?subject_id=${subjectId}`,
    swrFetcher
  );
  const { data: resources = [], isLoading: resLoading } = useSWR<Resource[]>(
    `/api/resources?subject_id=${subjectId}`,
    swrFetcher
  );

  const loading = subLoading || chLoading || resLoading;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <h2 className="text-xl font-bold text-white mb-2">Subject Not Found</h2>
        <p className="text-zinc-400">The subject you are looking for does not exist.</p>
        <Link href="/" className="mt-4 text-indigo-400 hover:text-indigo-300">
          Go Home
        </Link>
      </div>
    );
  }

  // Group chapters by unit
  const units = chapters.reduce((acc, chapter) => {
    const unitName = chapter.unit_name || "General Topics";
    if (!acc[unitName]) acc[unitName] = [];
    acc[unitName].push(chapter);
    return acc;
  }, {} as Record<string, Chapter[]>);

  // Separate subject-level resources (Master Materials)
  const masterResources = resources.filter((r) => !r.chapter_id);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "VIDEO_LECTURE":
        return <PlayCircle className="w-4 h-4" />;
      case "ASSIGNMENT":
      case "PROJECT":
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const ResourceCard = ({ r }: { r: Resource }) => {
    const isPaid = r.price_in_inr > 0;
    
    return (
      <Link href={`/read/${r.id}`} className="block group">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-indigo-500/50 transition-all duration-300 h-full flex flex-col relative">
          
          {/* Thumbnail */}
          <div className="aspect-video w-full bg-zinc-950 relative border-b border-zinc-800 overflow-hidden">
            {r.thumbnail_url ? (
              <Image 
                src={r.thumbnail_url} 
                alt={r.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
                <BookOpen className="w-8 h-8 text-zinc-700" />
              </div>
            )}
            
            {/* Category Badge */}
            <div className="absolute top-2 left-2 bg-zinc-950/80 backdrop-blur text-xs font-semibold px-2 py-1 rounded-md text-zinc-300 flex items-center gap-1.5 border border-zinc-800">
              {getCategoryIcon(r.category)}
              {r.category.replace("_", " ")}
            </div>

            {/* Price Badge */}
            <div className="absolute top-2 right-2 flex gap-1">
              {isPaid ? (
                <div className="bg-indigo-500 text-white text-xs font-bold px-2 py-1 rounded-md shadow-lg flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  ₹{r.price_in_inr}
                </div>
              ) : (
                <div className="bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-md shadow-lg">
                  FREE
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-4 flex-1 flex flex-col">
            <h4 className="text-sm font-semibold text-white group-hover:text-indigo-400 transition-colors line-clamp-2">
              {r.title}
            </h4>
            <div className="mt-auto pt-3 flex items-center text-xs text-zinc-500 font-medium">
              <span className="uppercase tracking-wider">
                {r.content_type === "internal_module" 
                  ? "Interactive Module" 
                  : r.content_type === "r2_upload" 
                  ? "Digital Download" 
                  : "External Link"}
              </span>
            </div>
          </div>
        </div>
      </Link>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      {/* Subject Header */}
      <div className="bg-gradient-to-br from-indigo-500/20 to-purple-500/10 border border-indigo-500/20 rounded-3xl p-8 mb-12">
        <h1 className="text-3xl font-bold text-white mb-2">{subject.name}</h1>
        <p className="text-indigo-200">
          {subject.subject_code} • {chapters.length} Chapters • {resources.length} Learning Resources
        </p>
      </div>

      {/* Master Materials */}
      {masterResources.length > 0 && (
        <div className="mb-12">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            Master Materials
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {masterResources.map((r) => (
              <ResourceCard key={r.id} r={r} />
            ))}
          </div>
        </div>
      )}

      {/* Syllabus grouped by Unit */}
      <div className="space-y-12">
        {Object.entries(units).map(([unitName, unitChapters]) => (
          <div key={unitName} className="space-y-4">
            {/* Unit Header */}
            <div className="sticky top-16 z-10 bg-zinc-950/90 backdrop-blur-md py-3 border-b border-zinc-800">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                {unitName}
              </h2>
            </div>

            {/* Chapters */}
            <div className="grid gap-6">
              {unitChapters
                .sort((a, b) => a.chapter_number - b.chapter_number)
                .map((chapter) => {
                  const chapterResources = resources.filter(
                    (r) => r.chapter_id === chapter.id
                  );

                  return (
                    <div 
                      key={chapter.id} 
                      className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 transition-colors hover:bg-zinc-900/80"
                    >
                      <h3 className="text-lg font-semibold text-white mb-4">
                        Chapter {chapter.chapter_number}: {chapter.title}
                      </h3>
                      
                      {chapterResources.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                          {chapterResources.map((r) => (
                            <ResourceCard key={r.id} r={r} />
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-zinc-500 italic">No resources added yet.</p>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
