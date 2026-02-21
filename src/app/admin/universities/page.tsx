"use client";

import { useState, useEffect } from "react";
import { GraduationCap, BookOpen, Layers, FileText, Plus, Trash2, Search, X, MoreHorizontal, UploadCloud, File, FileUp, Loader2 } from "lucide-react";
import { fetchApi } from "@/lib/api";

// ===== TYPES =====
interface University { id: string; name: string; slug: string; website_url: string | null; logo_url: string | null; is_active: number; }
interface Course { id: string; university_id: string; name: string; slug: string; duration_years: number | null; total_semesters: number; is_active: number; }
interface SemesterInfo { semester: number; subject_count: number; }
interface Subject { id: string; course_id: string; semester: number; name: string; subject_code: string; }
interface Resource { id: string; subject_id: string; category: string; title: string; price_in_inr: number; is_active: number; created_at?: string; }

// ===== STATE MACHINE =====
type ViewState = 
  | { level: "universities" }
  | { level: "courses"; univId: string; univName: string }
  | { level: "semesters"; univId: string; univName: string; courseId: string; courseName: string; totalSemesters: number }
  | { level: "subjects"; univId: string; univName: string; courseId: string; courseName: string; semester: number }
  | { level: "resources"; univId: string; univName: string; courseId: string; courseName: string; semester: number; subjectId: string; subjectCode: string; subjectName: string };

// ===== UI COMPONENTS =====

// 1. Sleek Search Bar
function SearchBar({ placeholder, value, onChange }: { placeholder: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative max-w-sm w-full">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all shadow-sm" />
      {value && <button onClick={() => onChange("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"><X className="w-4 h-4" /></button>}
    </div>
  );
}

// 2. Dynamic Breadcrumbs
function Breadcrumb({ items }: { items: { label: string; onClick?: () => void }[] }) {
  return (
    <nav className="flex items-center gap-2 text-sm mb-8 flex-wrap">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-2">
          {i > 0 && <span className="text-zinc-600">/</span>}
          {item.onClick ? (
            <button onClick={item.onClick} className="text-zinc-400 hover:text-indigo-400 font-medium transition-colors">
              {item.label}
            </button>
          ) : (
            <span className="text-white font-semibold">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

// 3. Status Badge
function StatusBadge({ active }: { active: boolean }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide ${
      active ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-zinc-800 text-zinc-400 border border-zinc-700"
    }`}>
      {active ? "ACTIVE" : "HIDDEN"}
    </span>
  );
}

// 4. Slide-over Drawer (Sheet)
function SlideOverDrawer({ title, open, onClose, children }: { title: string; open: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity animate-in fade-in duration-200" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-zinc-950 border-l border-zinc-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800/60 bg-zinc-950/50 backdrop-blur">
          <h2 className="text-lg font-semibold text-white tracking-tight">{title}</h2>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {children}
        </div>
      </div>
    </>
  );
}

// 5. Minimalist Data Table
function DataTable({ headers, children, emptyIcon: EmptyIcon, emptyText }: { headers: string[], children: React.ReactNode, emptyIcon: any, emptyText: string }) {
  return (
    <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-800/80 bg-zinc-900/20">
              {headers.map((h, i) => (
                <th key={i} className={`px-6 py-4 text-[11px] font-bold text-zinc-500 uppercase tracking-wider ${i === headers.length - 1 ? 'text-right' : ''}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/40">
            {children}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ===== MAIN PAGE COMPONENT =====
export default function UniversitiesPage() {
  const [view, setView] = useState<ViewState>({ level: "universities" });
  const [search, setSearch] = useState("");
  
  // Data States
  const [universities, setUniversities] = useState<University[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [semesters, setSemesters] = useState<SemesterInfo[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  
  // UI States
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [error, setError] = useState("");

  // Resource Upload States
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // --- Data Fetching ---
  const fetchUniversities = async () => {
    setLoading(true); setError("");
    const res = await fetchApi("/api/universities");
    if (res.success) setUniversities(res.data);
    setLoading(false);
  };
  const fetchCourses = async (univId: string) => {
    setLoading(true);
    const res = await fetchApi(`/api/courses?university_id=${univId}`);
    if (res.success) setCourses(res.data);
    setLoading(false);
  };
  const fetchSemesters = async (courseId: string) => {
    setLoading(true);
    const res = await fetchApi(`/api/subjects/semesters?course_id=${courseId}`);
    if (res.success) setSemesters(res.data);
    setLoading(false);
  };
  const fetchSubjects = async (courseId: string, semester: number) => {
    setLoading(true);
    const res = await fetchApi(`/api/subjects?course_id=${courseId}&semester=${semester}`);
    if (res.success) setSubjects(res.data);
    setLoading(false);
  };
  const fetchResources = async (subjectId: string) => {
    setLoading(true);
    const res = await fetchApi(`/api/resources?subject_id=${subjectId}`);
    if (res.success) setResources(res.data);
    else setResources([]); // Fallback if no resources api
    setLoading(false);
  };

  useEffect(() => { fetchUniversities(); }, []);

  // --- Navigation Handlers ---
  const nav = {
    toUniv: () => { setView({ level: "universities" }); setSearch(""); fetchUniversities(); },
    toCourses: (u: string, n: string) => { setView({ level: "courses", univId: u, univName: n }); setSearch(""); fetchCourses(u); },
    toSemesters: (u: string, un: string, c: string, cn: string, ts: number) => { setView({ level: "semesters", univId: u, univName: un, courseId: c, courseName: cn, totalSemesters: ts }); setSearch(""); fetchSemesters(c); },
    toSubjects: (u: string, un: string, c: string, cn: string, s: number) => { setView({ level: "subjects", univId: u, univName: un, courseId: c, courseName: cn, semester: s }); setSearch(""); fetchSubjects(c, s); },
    toResources: (u: string, un: string, c: string, cn: string, s: number, subId: string, subCode: string, subName: string) => { 
      setView({ level: "resources", univId: u, univName: un, courseId: c, courseName: cn, semester: s, subjectId: subId, subjectCode: subCode, subjectName: subName }); 
      setSearch(""); fetchResources(subId); 
    }
  };

  const breadcrumbItems = () => {
    const items = [];
    if (view.level === "universities") { items.push({ label: "Universities" }); }
    else { items.push({ label: "Universities", onClick: nav.toUniv }); }
    
    if (view.level === "courses") { items.push({ label: view.univName }); }
    if (view.level === "semesters" || view.level === "subjects" || view.level === "resources") {
      items.push({ label: (view as any).univName, onClick: () => nav.toCourses((view as any).univId, (view as any).univName) });
      if (view.level === "semesters") items.push({ label: view.courseName });
      else items.push({ label: (view as any).courseName, onClick: () => nav.toSemesters((view as any).univId, (view as any).univName, (view as any).courseId, (view as any).courseName, 0) });
    }
    if (view.level === "subjects" || view.level === "resources") {
      if (view.level === "subjects") items.push({ label: `Semester ${view.semester}` });
      else items.push({ label: `Semester ${(view as any).semester}`, onClick: () => nav.toSubjects((view as any).univId, (view as any).univName, (view as any).courseId, (view as any).courseName, (view as any).semester) });
    }
    if (view.level === "resources") {
      items.push({ label: view.subjectCode });
    }
    return items;
  };

  // --- CRUD Handlers ---
  const autoSlug = (str: string) => str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const openDrawer = (initialData: any, id?: string) => {
    setEditingId(id || null);
    setFormData(initialData);
    setSelectedFile(null);
    setError("");
    setDrawerOpen(true);
  };

  const handleDelete = async (entity: string, id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This is permanent.`)) return;
    await fetchApi(`/api/${entity}/${id}`, { method: "DELETE" });
    if (entity === "universities") fetchUniversities();
    if (entity === "courses" && view.level === "courses") fetchCourses(view.univId);
    if (entity === "subjects" && view.level === "subjects") fetchSubjects(view.courseId, view.semester);
    if (entity === "resources" && view.level === "resources") fetchResources(view.subjectId);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setFormLoading(true); setError("");
    try {
      if (view.level === "universities") {
        const url = editingId ? `/api/universities/${editingId}` : "/api/universities";
        const res = await fetchApi(url, { method: editingId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData) });
        if (!res.success) throw new Error(res.message);
        await fetchUniversities();
      } 
      else if (view.level === "courses") {
        const url = editingId ? `/api/courses/${editingId}` : "/api/courses";
        const payload: any = { ...formData, duration_years: formData.duration_years ? parseInt(formData.duration_years) : null, total_semesters: parseInt(formData.total_semesters) };
        if (!editingId) payload.university_id = view.univId;
        const res = await fetchApi(url, { method: editingId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        if (!res.success) throw new Error(res.message);
        await fetchCourses(view.univId);
      }
      else if (view.level === "subjects") {
        const url = editingId ? `/api/subjects/${editingId}` : "/api/subjects";
        const payload: any = { ...formData, semester: view.semester };
        if (!editingId) payload.course_id = view.courseId;
        const res = await fetchApi(url, { method: editingId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        if (!res.success) throw new Error(res.message);
        await fetchSubjects(view.courseId, view.semester);
      }
      else if (view.level === "resources") {
        // Resource Upload Logic
        if (!selectedFile && !editingId) throw new Error("Please select a PDF file to upload.");
        
        // Mocking upload for now to match UI requirement without full backend integration
        // (Assuming the backend `/api/upload` route or similar)
        const mockForm = new FormData();
        if (selectedFile) mockForm.append("resourceFile", selectedFile);
        mockForm.append("subjectCode", view.subjectCode);
        mockForm.append("sessionYear", formData.session_year || new Date().getFullYear().toString());
        mockForm.append("price", formData.price_in_inr || "0");
        
        const res = await fetchApi("/api/upload", { method: "POST", body: mockForm });
        if (!res.success) throw new Error(res.message || "Upload failed");
        await fetchResources(view.subjectId);
      }
      setDrawerOpen(false);
    } catch (err: any) { setError(err.message); }
    setFormLoading(false);
  };

  // --- Common Input Styles ---
  const inputClass = "w-full bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all placeholder-zinc-600";
  const labelClass = "block text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wide";

  return (
    <div className="max-w-7xl mx-auto pb-20 animate-in fade-in duration-500">
      <Breadcrumb items={breadcrumbItems()} />

      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            {view.level === "universities" && "Universities"}
            {view.level === "courses" && view.univName}
            {view.level === "semesters" && `${view.courseName} Semesters`}
            {view.level === "subjects" && `Semester ${view.semester}`}
            {view.level === "resources" && view.subjectCode}
          </h1>
          <p className="text-sm text-zinc-400 mt-1.5 font-medium">
            {view.level === "universities" && "Manage parent institutions and academies."}
            {view.level === "courses" && "Manage degree programs and certificates."}
            {view.level === "semesters" && "Select a semester to manage its subjects."}
            {view.level === "subjects" && "Manage subjects and curriculums for this semester."}
            {view.level === "resources" && "Manage study materials, PYQs, and solutions."}
          </p>
        </div>
        
        {view.level !== "semesters" && (
          <button 
            onClick={() => {
              if (view.level === "universities") openDrawer({ name: "", slug: "", website_url: "" });
              if (view.level === "courses") openDrawer({ name: "", slug: "", duration_years: "", total_semesters: "" });
              if (view.level === "subjects") openDrawer({ name: "", subject_code: "" });
              if (view.level === "resources") openDrawer({ title: "", category: "PYQ", price_in_inr: "0", session_year: "" });
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-zinc-200 text-black text-sm font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] active:scale-95"
          >
            <Plus className="w-4 h-4" /> 
            Add New {view.level === "universities" ? "University" : view.level === "courses" ? "Course" : view.level === "subjects" ? "Subject" : "Resource"}
          </button>
        )}
      </div>

      {view.level !== "semesters" && (
        <div className="mb-6"><SearchBar placeholder="Search by name or code..." value={search} onChange={setSearch} /></div>
      )}

      {/* CONTENT AREA */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 text-zinc-500">
          <Loader2 className="w-8 h-8 animate-spin mb-4 text-indigo-500" />
          <p className="text-sm font-medium">Loading records...</p>
        </div>
      ) : (
        <>
          {/* UNIVERSITIES TABLE */}
          {view.level === "universities" && (
            <DataTable headers={["University", "Website", "Status", "Actions"]} emptyIcon={GraduationCap} emptyText="No universities found">
              {universities.filter(u => u.name.toLowerCase().includes(search.toLowerCase())).map(u => (
                <tr key={u.id} className="group hover:bg-zinc-800/30 transition-colors cursor-pointer" onClick={() => nav.toCourses(u.id, u.name)}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-zinc-800/80 border border-zinc-700 flex items-center justify-center text-zinc-400 group-hover:text-white group-hover:border-zinc-500 transition-colors"><GraduationCap className="w-4 h-4" /></div>
                      <div>
                        <div className="font-semibold text-white text-sm">{u.name}</div>
                        <div className="text-xs text-zinc-500 font-mono mt-0.5">{u.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-400">{u.website_url || "—"}</td>
                  <td className="px-6 py-4"><StatusBadge active={u.is_active === 1} /></td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={(e) => { e.stopPropagation(); openDrawer(u, u.id); }} className="p-2 text-zinc-500 hover:text-white rounded-lg hover:bg-zinc-700 transition-colors"><MoreHorizontal className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </DataTable>
          )}

          {/* COURSES TABLE */}
          {view.level === "courses" && (
            <DataTable headers={["Course", "Duration", "Semesters", "Status", "Actions"]} emptyIcon={BookOpen} emptyText="No courses found">
              {courses.filter(c => c.name.toLowerCase().includes(search.toLowerCase())).map(c => (
                <tr key={c.id} className="group hover:bg-zinc-800/30 transition-colors cursor-pointer" onClick={() => nav.toSemesters(view.univId, view.univName, c.id, c.name, c.total_semesters)}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-zinc-800/80 border border-zinc-700 flex items-center justify-center text-zinc-400 group-hover:text-white transition-colors"><BookOpen className="w-4 h-4" /></div>
                      <div>
                        <div className="font-semibold text-white text-sm">{c.name}</div>
                        <div className="text-xs text-zinc-500 font-mono mt-0.5">{c.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-400">{c.duration_years ? `${c.duration_years} Years` : "—"}</td>
                  <td className="px-6 py-4 text-sm text-zinc-400 font-medium">{c.total_semesters}</td>
                  <td className="px-6 py-4"><StatusBadge active={c.is_active === 1} /></td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={(e) => { e.stopPropagation(); openDrawer(c, c.id); }} className="p-2 text-zinc-500 hover:text-white rounded-lg hover:bg-zinc-700 transition-colors"><MoreHorizontal className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </DataTable>
          )}

          {/* SEMESTERS GRID (Keep Grid for Semesters as it's cleaner) */}
          {view.level === "semesters" && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {Array.from({ length: view.totalSemesters }, (_, i) => {
                const sem = i + 1;
                const existing = semesters.find(s => s.semester === sem);
                const hasSubjects = (existing?.subject_count || 0) > 0;
                return (
                  <button key={sem} onClick={() => nav.toSubjects(view.univId, view.univName, view.courseId, view.courseName, sem)}
                    className={`group relative flex flex-col items-center justify-center p-8 rounded-2xl border transition-all duration-300 ${
                      hasSubjects ? "bg-zinc-900/60 border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800/80" : "bg-zinc-950/50 border-zinc-800/50 hover:border-zinc-700 hover:bg-zinc-900"
                    }`}>
                    <div className={`w-12 h-12 rounded-full mb-4 flex items-center justify-center transition-colors ${
                      hasSubjects ? "bg-zinc-800 text-white" : "bg-zinc-900 text-zinc-600"
                    }`}>
                      <Layers className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-white text-base mb-1">Semester {sem}</h3>
                    <p className={`text-xs font-medium ${hasSubjects ? "text-indigo-400" : "text-zinc-600"}`}>
                      {hasSubjects ? `${existing?.subject_count} Subjects` : "Empty"}
                    </p>
                  </button>
                );
              })}
            </div>
          )}

          {/* SUBJECTS TABLE */}
          {view.level === "subjects" && (
            <DataTable headers={["Subject Code", "Subject Name", "Actions"]} emptyIcon={FileText} emptyText="No subjects found">
              {subjects.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.subject_code.toLowerCase().includes(search.toLowerCase())).map(s => (
                <tr key={s.id} className="group hover:bg-zinc-800/30 transition-colors cursor-pointer" onClick={() => nav.toResources(view.univId, view.univName, view.courseId, view.courseName, view.semester, s.id, s.subject_code, s.name)}>
                  <td className="px-6 py-4">
                    <span className="font-mono text-xs font-bold tracking-wide text-zinc-300 bg-zinc-800 border border-zinc-700 px-3 py-1.5 rounded-md">
                      {s.subject_code}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-white">{s.name}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={(e) => { e.stopPropagation(); openDrawer(s, s.id); }} className="p-2 text-zinc-500 hover:text-white rounded-lg hover:bg-zinc-700 transition-colors"><MoreHorizontal className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </DataTable>
          )}

          {/* RESOURCES TABLE */}
          {view.level === "resources" && (
            <DataTable headers={["File / Title", "Category", "Price", "Status", "Actions"]} emptyIcon={File} emptyText="No resources uploaded yet">
              {resources.map(r => (
                <tr key={r.id} className="group hover:bg-zinc-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400"><FileText className="w-5 h-5" /></div>
                      <div>
                        <div className="font-semibold text-white text-sm">{r.title || r.category}</div>
                        <div className="text-xs text-zinc-500 font-mono mt-0.5">{r.created_at ? new Date(r.created_at).toLocaleDateString() : "Uploaded recently"}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4"><span className="text-xs font-bold text-zinc-300 bg-zinc-800 px-2.5 py-1 rounded-md">{r.category}</span></td>
                  <td className="px-6 py-4 text-sm font-medium text-emerald-400">{r.price_in_inr > 0 ? `₹${r.price_in_inr}` : "FREE"}</td>
                  <td className="px-6 py-4"><StatusBadge active={r.is_active === 1} /></td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleDelete("resources", r.id, r.title)} className="p-2 text-zinc-500 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </DataTable>
          )}
        </>
      )}

      {/* DRAWER FOR ALL FORMS */}
      <SlideOverDrawer 
        title={editingId ? `Edit ${view.level.slice(0, -1)}` : `New ${view.level === "universities" ? "University" : view.level === "courses" ? "Course" : view.level === "subjects" ? "Subject" : "Resource"}`} 
        open={drawerOpen} onClose={() => setDrawerOpen(false)}
      >
        <form onSubmit={handleFormSubmit} className="space-y-5">
          {error && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm font-medium">{error}</div>}

          {/* University Fields */}
          {view.level === "universities" && (
            <>
              <div><label className={labelClass}>University Name</label><input type="text" className={inputClass} value={formData.name || ""} onChange={e => setFormData({...formData, name: e.target.value, slug: editingId ? formData.slug : autoSlug(e.target.value)})} placeholder="e.g. Stanford University" required /></div>
              <div><label className={labelClass}>Slug</label><input type="text" className={`${inputClass} font-mono`} value={formData.slug || ""} onChange={e => setFormData({...formData, slug: e.target.value})} placeholder="stanford-univ" required /></div>
              <div><label className={labelClass}>Website URL</label><input type="url" className={inputClass} value={formData.website_url || ""} onChange={e => setFormData({...formData, website_url: e.target.value})} placeholder="https://stanford.edu" /></div>
            </>
          )}

          {/* Course Fields */}
          {view.level === "courses" && (
            <>
              <div><label className={labelClass}>Course Name</label><input type="text" className={inputClass} value={formData.name || ""} onChange={e => setFormData({...formData, name: e.target.value, slug: editingId ? formData.slug : autoSlug(e.target.value)})} placeholder="e.g. Computer Science" required /></div>
              <div><label className={labelClass}>Slug</label><input type="text" className={`${inputClass} font-mono`} value={formData.slug || ""} onChange={e => setFormData({...formData, slug: e.target.value})} placeholder="computer-science" required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelClass}>Duration (Years)</label><input type="number" min="1" className={inputClass} value={formData.duration_years || ""} onChange={e => setFormData({...formData, duration_years: e.target.value})} placeholder="4" /></div>
                <div><label className={labelClass}>Semesters</label><input type="number" min="1" max="16" className={inputClass} value={formData.total_semesters || ""} onChange={e => setFormData({...formData, total_semesters: e.target.value})} placeholder="8" required /></div>
              </div>
            </>
          )}

          {/* Subject Fields */}
          {view.level === "subjects" && (
            <>
              <div><label className={labelClass}>Subject Code</label><input type="text" className={`${inputClass} font-mono uppercase`} value={formData.subject_code || ""} onChange={e => setFormData({...formData, subject_code: e.target.value.toUpperCase()})} placeholder="CS-101" required /></div>
              <div><label className={labelClass}>Subject Name</label><input type="text" className={inputClass} value={formData.name || ""} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Data Structures" required /></div>
            </>
          )}

          {/* Resource Upload Fields */}
          {view.level === "resources" && (
            <>
              {!editingId && (
                <div>
                  <label className={labelClass}>Upload PDF</label>
                  <div 
                    className={`mt-1 flex justify-center px-6 pt-8 pb-8 border-2 border-dashed rounded-2xl transition-all cursor-pointer ${dragActive ? 'border-indigo-500 bg-indigo-500/10' : selectedFile ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/50'}`}
                    onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={(e) => { e.preventDefault(); setDragActive(false); if (e.dataTransfer.files && e.dataTransfer.files[0]) setSelectedFile(e.dataTransfer.files[0]); }}
                    onClick={() => document.getElementById('file-upload')?.click()}
                  >
                    <div className="space-y-2 text-center">
                      {selectedFile ? (
                        <FileUp className="mx-auto h-10 w-10 text-emerald-400" />
                      ) : (
                        <UploadCloud className="mx-auto h-10 w-10 text-zinc-500" />
                      )}
                      <div className="flex text-sm text-zinc-400 justify-center">
                        <span className={selectedFile ? "text-emerald-400 font-semibold" : "text-indigo-400 font-semibold"}>
                          {selectedFile ? selectedFile.name : "Click to upload or drag and drop"}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-600">PDF up to 10MB</p>
                    </div>
                    <input id="file-upload" type="file" className="hidden" accept=".pdf" onChange={(e) => { if (e.target.files && e.target.files[0]) setSelectedFile(e.target.files[0]); }} />
                  </div>
                </div>
              )}
              
              <div><label className={labelClass}>Category</label>
                <select className={inputClass} value={formData.category || "PYQ"} onChange={e => setFormData({...formData, category: e.target.value})}>
                  <option value="PYQ">Previous Year Question (PYQ)</option>
                  <option value="SOLUTION">Solution / Notes</option>
                  <option value="ASSIGNMENT">Assignment</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelClass}>Session Year</label><input type="text" className={inputClass} value={formData.session_year || ""} onChange={e => setFormData({...formData, session_year: e.target.value})} placeholder="e.g. 2024" required /></div>
                <div><label className={labelClass}>Price (INR)</label><input type="number" min="0" className={inputClass} value={formData.price_in_inr || ""} onChange={e => setFormData({...formData, price_in_inr: e.target.value})} placeholder="₹ 0 for free" /></div>
              </div>
            </>
          )}

          <div className="pt-6 mt-6 border-t border-zinc-800 flex justify-end gap-3">
            <button type="button" onClick={() => setDrawerOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={formLoading} className="px-5 py-2.5 rounded-xl text-sm font-bold bg-white text-black hover:bg-zinc-200 transition-all disabled:opacity-50 flex items-center gap-2 shadow-[0_0_15px_rgba(255,255,255,0.1)]">
              {formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {editingId ? "Save Changes" : "Create"}
            </button>
          </div>
        </form>
      </SlideOverDrawer>
    </div>
  );
}
