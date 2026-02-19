"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import useSWR from "swr";
import { BookOpen, Loader2, PlayCircle, FileText, ChevronRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://admin-backend.pixraglobal.workers.dev";

interface Resource {
  id: string;
  subject_id: string;
  category: string;
  title: string;
  thumbnail_url: string | null;
  content_type: string;
}

const fetcherWithAuth = async (url: string) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Unauthorized");
  
  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${session.access_token}`
    }
  });
  
  if (!res.ok) throw new Error("Failed to fetch");
  const json = await res.json();
  return json.data;
};

export default function DashboardPage() {
  const router = useRouter();
  const [userName, setUserName] = useState("Student");
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push("/auth");
      } else {
        setUserName(session.user.user_metadata?.name || session.user.email?.split("@")[0] || "Student");
        setIsAuthChecking(false);
      }
    });
  }, [router]);

  const { data: resources, isLoading, error } = useSWR<Resource[]>(
    isAuthChecking ? null : `${API_URL}/api/student/library`,
    fetcherWithAuth
  );

  if (isAuthChecking || isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-zinc-950 min-h-[calc(100vh-4rem)]">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-zinc-950 min-h-[calc(100vh-4rem)]">
        <h2 className="text-xl font-bold text-white mb-2">Error Loading Library</h2>
        <p className="text-zinc-400">Please try refreshing the page.</p>
      </div>
    );
  }

  const getCategoryIcon = (category: string) => {
    if (category === 'VIDEO_LECTURE') return <PlayCircle className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  return (
    <div className="flex-1 bg-zinc-950 min-h-[calc(100vh-4rem)]">
      {/* Header Banner */}
      <div className="bg-zinc-900 border-b border-zinc-800 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-500/20">
              <BookOpen className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Welcome back, {userName}</h1>
              <p className="text-zinc-400 mt-1">Here is your premium learning library.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-xl font-semibold text-white mb-6">My Purchased Resources</h2>

        {!resources || resources.length === 0 ? (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-12 text-center flex flex-col items-center max-w-2xl mx-auto">
            <div className="w-20 h-20 bg-zinc-800 rounded-2xl flex items-center justify-center mb-6">
              <BookOpen className="w-10 h-10 text-zinc-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Your library is empty</h3>
            <p className="text-zinc-400 mb-8 max-w-md">
              You haven't unlocked any resources yet. Browse the catalog to find premium study materials, PYQs, and video lectures.
            </p>
            <Link 
              href="/"
              className="bg-white hover:bg-zinc-200 text-black font-bold py-3 px-6 rounded-xl transition-colors inline-flex items-center gap-2"
            >
              Browse Catalog <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {resources.map((resource) => (
              <Link 
                key={resource.id} 
                href={`/read/${resource.id}`}
                className="group flex flex-col bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/10 transition-all"
              >
                <div className="aspect-video w-full bg-zinc-800 relative">
                  {resource.thumbnail_url ? (
                    <Image
                      src={resource.thumbnail_url}
                      alt={resource.title}
                      fill
                      className="object-cover transition-transform group-hover:scale-105 duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <BookOpen className="w-8 h-8 text-zinc-600" />
                    </div>
                  )}
                  <div className="absolute top-3 left-3 px-2 py-1 bg-black/60 backdrop-blur-md rounded border border-white/10 text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    {getCategoryIcon(resource.category)}
                    {resource.category.replace('_', ' ')}
                  </div>
                </div>
                
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="font-semibold text-white line-clamp-2 group-hover:text-indigo-400 transition-colors">
                      {resource.title}
                    </h4>
                  </div>
                  <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center justify-between">
                    <span className="text-xs text-emerald-400 font-medium px-2 py-1 bg-emerald-400/10 rounded-md">
                      Unlocked
                    </span>
                    <span className="text-indigo-400 flex items-center text-sm font-medium">
                      View <ChevronRight className="w-4 h-4 ml-1" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
