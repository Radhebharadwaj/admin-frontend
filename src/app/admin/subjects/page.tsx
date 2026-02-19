"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, BookOpen, ArrowRight, GraduationCap, Layers } from "lucide-react";
import Breadcrumb from "@/components/admin/Breadcrumb";
import { fetchApi } from "@/lib/api";

interface SearchResult {
  id: string;
  subject_code: string;
  subject_name: string;
  semester: number;
  course_id: string;
  course_name: string;
  course_slug: string;
  university_id: string;
  university_name: string;
  university_slug: string;
}

export default function GlobalSubjectSearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Debounced search
  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); setSearched(false); return; }
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetchApi(`/api/subjects/search?q=${encodeURIComponent(q)}`);
      if (res.success) setResults(res.data);
    } catch (e) { }
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => doSearch(query), 300);
    return () => clearTimeout(timer);
  }, [query, doSearch]);

  const navigateToSubject = (result: SearchResult) => {
    router.push(`/admin/universities/${result.university_id}/courses/${result.course_id}/semesters/${result.semester}/subjects`);
  };

  return (
    <div className="animate-in fade-in duration-500">
      <Breadcrumb items={[{ label: "Global Subject Search" }]} />

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Subject Search</h1>
        <p className="text-sm text-slate-400 mt-1">Search any subject code or name across ALL universities instantly</p>
      </div>

      {/* Search Input */}
      <div className="relative max-w-2xl mb-8">
        <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${loading ? "text-indigo-400 animate-pulse" : "text-slate-500"}`} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type a subject code like CS-201 or a name like Data Structures..."
          className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl pl-12 pr-6 py-4 text-white text-lg placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/40 transition-all"
          autoFocus
        />
        {loading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-500"></div>
          </div>
        )}
      </div>

      {/* Results */}
      {searched && !loading && results.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No subjects found for "{query}"</p>
          <p className="text-sm mt-1">Try a different code or name</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-3 max-w-2xl">
          <p className="text-sm text-slate-500 mb-4">{results.length} result{results.length !== 1 ? "s" : ""} found</p>
          {results.map((result) => (
            <button
              key={result.id}
              onClick={() => navigateToSubject(result)}
              className="w-full text-left bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 hover:border-indigo-500/30 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono text-sm text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20 font-bold">
                      {result.subject_code}
                    </span>
                    <span className="text-white font-medium truncate">{result.subject_name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><GraduationCap className="w-3 h-3" />{result.university_name}</span>
                    <span>→</span>
                    <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{result.course_name}</span>
                    <span>→</span>
                    <span className="flex items-center gap-1"><Layers className="w-3 h-3" />Sem {result.semester}</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition-colors shrink-0 ml-3" />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!searched && (
        <div className="text-center py-16 text-slate-600">
          <Search className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p className="text-lg font-medium text-slate-500">Start typing to search</p>
          <p className="text-sm mt-1">Search across all universities, courses, and semesters</p>
        </div>
      )}
    </div>
  );
}
