"use client";

import { useState, useEffect } from "react";
import { UploadCloud, FileText, Send, CheckCircle2, ChevronDown, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { publishAssignmentData } from "@/lib/api";
import { useAuthStore } from "@/lib/store";

export default function DataEntryForm({ dropdownData }: { dropdownData?: any }) {
  const { user } = useAuthStore();
  const [isHovering, setIsHovering] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [file, setFile] = useState<File | null>(null);
  const [showToast, setShowToast] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsHovering(true);
  };

  const handleDragLeave = () => {
    setIsHovering(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsHovering(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handlePublish = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPublishing(true);
    setErrorMsg("");
    
    const formData = new FormData(e.currentTarget);
    if (file) {
      formData.append("resource_file", file);
    }

    const res = await publishAssignmentData(formData);
    
    if (res.success) {
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        setFile(null); // Reset form
      }, 3000);
      (e.target as HTMLFormElement).reset();
    } else {
      setErrorMsg(res.message);
    }
    
    setIsPublishing(false);
  };

  return (
    <div className="max-w-4xl mx-auto w-full">
      {/* Toast Notification Placeholder */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-400 px-6 py-4 rounded-2xl shadow-xl">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-semibold">Successfully published to R2 & D1!</span>
          </div>
        </div>
      )}

      <form onSubmit={handlePublish} className="bg-white dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-3xl p-8 shadow-sm">
        
        {/* Header Section */}
        <div className="mb-10">
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2">New Entry</h2>
          <p className="text-slate-500 dark:text-slate-400">Fill out the details to publish a new assignment solution.</p>
          {errorMsg && (
            <div className="mt-4 p-4 bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 rounded-lg text-sm font-medium">
              {errorMsg}
            </div>
          )}
        </div>

        {/* Smart Dropdowns Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">University</label>
              {user?.scope !== "ALL" && (
                <div className="flex items-center gap-1 text-xs font-semibold text-rose-500 bg-rose-50 dark:bg-rose-500/10 px-2 py-0.5 rounded-full">
                  <Lock className="w-3 h-3" /> Locked
                </div>
              )}
            </div>
            <div className="relative">
              <select 
                name="university" 
                required 
                className={`w-full appearance-none bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium ${user?.scope !== "ALL" ? "opacity-70 cursor-not-allowed" : "cursor-pointer"}`}
                defaultValue={user?.scope !== "ALL" ? user?.scope : ""}
                disabled={user?.scope !== "ALL"}
              >
                {user?.scope === "ALL" && <option value="">Select University...</option>}
                {dropdownData?.universities?.map((u: any) => {
                  // If restricted, only show their assigned university
                  if (user?.scope !== "ALL" && u.slug !== user?.scope) return null;
                  return <option key={u.id} value={u.slug}>{u.name}</option>
                })}
              </select>
              {user?.scope === "ALL" && <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />}
            </div>
          </div>
          
          <div className="relative">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Course</label>
            <div className="relative">
              <select name="course" required className="w-full appearance-none bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium cursor-pointer">
                <option value="">Select Course...</option>
                {dropdownData?.courses?.map((c: any) => (
                  <option key={c.id} value={c.slug}>{c.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            </div>
          </div>

          <div className="relative">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Subject</label>
            <div className="relative">
              <select name="subject_code" required className="w-full appearance-none bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium cursor-pointer">
                <option value="">Select Subject...</option>
                {dropdownData?.subjects?.map((s: any) => (
                  <option key={s.id} value={s.subject_code}>{s.subject_code} - {s.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Drag & Drop PDF Zone */}
        <div className="mb-8">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Resource File (PDF)</label>
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`w-full h-40 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer ${
              isHovering 
                ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/10" 
                : file 
                  ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-500/10"
                  : "border-slate-300 dark:border-white/20 bg-slate-50 hover:bg-slate-100 dark:bg-[#0a0a0a] hover:dark:bg-white/5"
            }`}
          >
            {file ? (
              <div className="flex flex-col items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <FileText className="w-8 h-8" />
                <span className="font-semibold text-sm">{file.name}</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-slate-500">
                <UploadCloud className={`w-8 h-8 transition-colors ${isHovering ? "text-indigo-500" : ""}`} />
                <span className="font-medium text-sm">Drag and drop PDF here, or click to browse</span>
              </div>
            )}
          </div>
        </div>

        {/* Clean Rich Text Area Placeholder */}
        <div className="mb-10">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Rich Text Answers</label>
          <div className="w-full min-h-[250px] bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-white/10 rounded-2xl p-4 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
            {/* Pseudo Toolbar */}
            <div className="flex items-center gap-2 pb-4 border-b border-slate-200 dark:border-white/10 mb-4 text-slate-400">
              <span className="font-bold cursor-pointer hover:text-slate-700 dark:hover:text-white px-2">B</span>
              <span className="italic cursor-pointer hover:text-slate-700 dark:hover:text-white px-2">I</span>
              <span className="underline cursor-pointer hover:text-slate-700 dark:hover:text-white px-2">U</span>
            </div>
            <textarea 
              className="w-full h-full min-h-[180px] bg-transparent outline-none text-slate-900 dark:text-white resize-none"
              placeholder="Start typing your beautifully formatted answers here..."
            ></textarea>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end">
          <Button type="submit" disabled={isPublishing} className="h-12 px-8 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white border-0 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0">
            {isPublishing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
            {isPublishing ? "Publishing..." : "🚀 Publish Entry"}
          </Button>
        </div>

      </form>
    </div>
  );
}
