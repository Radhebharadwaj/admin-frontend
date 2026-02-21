"use client";

import { useState, useEffect } from "react";
import { GraduationCap, BookOpen, Layers, FileText, Plus, Trash2, Search, X, MoreHorizontal, UploadCloud, File, FileUp, Loader2, Bookmark } from "lucide-react";
import { fetchApi } from "@/lib/api";
import { useAuthStore } from "@/lib/store";

// ===== TYPES =====
interface University { id: string; name: string; slug: string; website_url: string | null; logo_url: string | null; is_active: number; }
interface Course { id: string; university_id: string; name: string; slug: string; duration_years: number | null; total_semesters: number; is_active: number; }
interface SemesterInfo { semester: number; subject_count: number; }
interface Subject { id: string; course_id: string; semester: number; name: string; subject_code: string; }
interface Chapter { id: string; subject_id: string; chapter_number: number; title: string; unit_name: string | null; is_active: number; }
interface Resource { id: string; subject_id: string; chapter_id: string | null; category: string; title: string; price_in_inr: number; is_active: number; created_at?: string; }

// ===== STATE MACHINE =====
type ViewState = 
  | { level: "universities" }
  | { level: "courses"; univId: string; univName: string }
  | { level: "semesters"; univId: string; univName: string; courseId: string; courseName: string; totalSemesters: number }
  | { level: "subjects"; univId: string; univName: string; courseId: string; courseName: string; semester: number }
  | { level: "subject_details"; univId: string; univName: string; courseId: string; courseName: string; semester: number; subjectId: string; subjectCode: string; subjectName: string };

// ===== UI COMPONENTS =====

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

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide ${
      active ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-zinc-800 text-zinc-400 border border-zinc-700"
    }`}>
      {active ? "ACTIVE" : "HIDDEN"}
    </span>
  );
}

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
  const { user } = useAuthStore();
  const role = user?.role || "GUEST";
  
  // Data States
  const [universities, setUniversities] = useState<University[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [semesters, setSemesters] = useState<SemesterInfo[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  
  // UI States
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formType, setFormType] = useState<"university"|"course"|"subject"|"chapter"|"resource" | "">("");
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
  const fetchSubjectDetails = async (subjectId: string) => {
    setLoading(true);
    const [chRes, rsRes] = await Promise.all([
      fetchApi(`/api/chapters?subject_id=${subjectId}`),
      fetchApi(`/api/resources?subject_id=${subjectId}`)
    ]);
    if (chRes.success) setChapters(chRes.data); else setChapters([]);
    if (rsRes.success) setResources(rsRes.data); else setResources([]);
    setLoading(false);
  };

  useEffect(() => { fetchUniversities(); }, []);

  // --- Navigation Handlers ---
  const nav = {
    toUniv: () => { setView({ level: "universities" }); setSearch(""); fetchUniversities(); },
    toCourses: (u: string, n: string) => { setView({ level: "courses", univId: u, univName: n }); setSearch(""); fetchCourses(u); },
    toSemesters: (u: string, un: string, c: string, cn: string, ts: number) => { setView({ level: "semesters", univId: u, univName: un, courseId: c, courseName: cn, totalSemesters: ts }); setSearch(""); fetchSemesters(c); },
    toSubjects: (u: string, un: string, c: string, cn: string, s: number) => { setView({ level: "subjects", univId: u, univName: un, courseId: c, courseName: cn, semester: s }); setSearch(""); fetchSubjects(c, s); },
    toSubjectDetails: (u: string, un: string, c: string, cn: string, s: number, subId: string, subCode: string, subName: string) => { 
      setView({ level: "subject_details", univId: u, univName: un, courseId: c, courseName: cn, semester: s, subjectId: subId, subjectCode: subCode, subjectName: subName }); 
      setSearch(""); fetchSubjectDetails(subId); 
    }
  };

  const breadcrumbItems = () => {
    const items = [];
    if (view.level === "universities") { items.push({ label: "Universities" }); }
    else { items.push({ label: "Universities", onClick: nav.toUniv }); }
    
    if (view.level === "courses") { items.push({ label: view.univName }); }
    if (view.level === "semesters" || view.level === "subjects" || view.level === "subject_details") {
      items.push({ label: (view as any).univName, onClick: () => nav.toCourses((view as any).univId, (view as any).univName) });
      if (view.level === "semesters") items.push({ label: view.courseName });
      else items.push({ label: (view as any).courseName, onClick: () => nav.toSemesters((view as any).univId, (view as any).univName, (view as any).courseId, (view as any).courseName, 0) });
    }
    if (view.level === "subjects" || view.level === "subject_details") {
      if (view.level === "subjects") items.push({ label: `Semester ${view.semester}` });
      else items.push({ label: `Semester ${(view as any).semester}`, onClick: () => nav.toSubjects((view as any).univId, (view as any).univName, (view as any).courseId, (view as any).courseName, (view as any).semester) });
    }
    if (view.level === "subject_details") {
      items.push({ label: `${view.subjectCode} - Chapters & Resources` });
    }
    return items;
  };

  // --- CRUD Handlers ---
  const autoSlug = (str: string) => str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const openDrawer = (type: "university"|"course"|"subject"|"chapter"|"resource", initialData: any, id?: string) => {
    setFormType(type);
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
    if (entity === "chapters" && view.level === "subject_details") fetchSubjectDetails(view.subjectId);
    if (entity === "resources" && view.level === "subject_details") fetchSubjectDetails(view.subjectId);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setFormLoading(true); setError("");
    try {
      if (formType === "university") {
        const url = editingId ? `/api/universities/${editingId}` : "/api/universities";
        const res = await fetchApi(url, { method: editingId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData) });
        if (!res.success) throw new Error(res.message);
        await fetchUniversities();
      } 
      else if (formType === "course") {
        const url = editingId ? `/api/courses/${editingId}` : "/api/courses";
        const payload: any = { ...formData, duration_years: formData.duration_years ? parseInt(formData.duration_years) : null, total_semesters: parseInt(formData.total_semesters) };
        if (!editingId && view.level === "courses") payload.university_id = view.univId;
        const res = await fetchApi(url, { method: editingId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        if (!res.success) throw new Error(res.message);
        if (view.level === "courses") await fetchCourses(view.univId);
      }
      else if (formType === "subject") {
        const url = editingId ? `/api/subjects/${editingId}` : "/api/subjects";
        const payload: any = { ...formData, semester: (view as any).semester };
        if (!editingId && view.level === "subjects") payload.course_id = view.courseId;
        const res = await fetchApi(url, { method: editingId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        if (!res.success) throw new Error(res.message);
        if (view.level === "subjects") await fetchSubjects(view.courseId, view.semester);
      }
      else if (formType === "chapter") {
        const url = editingId ? `/api/chapters/${editingId}` : "/api/chapters";
        const payload: any = { ...formData, chapter_number: parseInt(formData.chapter_number) };
        if (!editingId && view.level === "subject_details") payload.subject_id = view.subjectId;
        const res = await fetchApi(url, { method: editingId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        if (!res.success) throw new Error(res.message);
        if (view.level === "subject_details") await fetchSubjectDetails(view.subjectId);
      }
      else if (formType === "resource") {
        // Mocking multipart/form-data upload
        if (!selectedFile && !editingId) throw new Error("Please select a file to upload.");
        
        const mockForm = new FormData();
        if (selectedFile) mockForm.append("resourceFile", selectedFile);
        if (view.level === "subject_details") mockForm.append("subject_id", view.subjectId);
        mockForm.append("category", formData.category);
        mockForm.append("title", formData.title || selectedFile?.name || "Untitled");
        if (formData.chapter_id) mockForm.append("chapter_id", formData.chapter_id);
        mockForm.append("price_in_inr", formData.price_in_inr || "0");
        mockForm.append("r2_object_key", `mock_key_${Date.now()}`); // Mock key since upload endpoint isn't fully integrated here
        mockForm.append("is_public", formData.is_public ? "true" : "false");

        const url = editingId ? `/api/resources/${editingId}` : "/api/resources";
        
        // For simplicity in this UI iteration, we will use JSON if editing, FormData if uploading
        if (editingId) {
          const res = await fetchApi(url, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData) });
          if (!res.success) throw new Error(res.message);
        } else {
          // If we had the real /api/upload, we'd use it here. 
          // For now, let's just hit the /api/resources POST endpoint with JSON directly since backend expects JSON.
          const payload = {
            subject_id: (view as any).subjectId,
            chapter_id: formData.chapter_id || null,
            category: formData.category,
            title: formData.title || selectedFile?.name || "Untitled",
            r2_object_key: `mock_key_${Date.now()}`,
            price_in_inr: parseInt(formData.price_in_inr || "0")
          };
          const res = await fetchApi("/api/resources", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
          if (!res.success) throw new Error(res.message);
        }
        if (view.level === "subject_details") await fetchSubjectDetails(view.subjectId);
      }
      setDrawerOpen(false);
    } catch (err: any) { setError(err.message); }
    setFormLoading(false);
  };

  // --- Common Styles ---
  const inputClass = "w-full bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all placeholder-zinc-600";
  const labelClass = "block text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wide";
  
  // RBAC Helpers
  const canEdit = (entity: string) => {
    if (role === "SUPER_ADMIN") return true;
    if (role === "CONTENT_MANAGER") return entity !== "universities";
    if (role === "DATA_ENTRY") return ["chapters", "resources"].includes(entity);
    return false;
  };
  const canDelete = (entity: string) => {
    if (role === "SUPER_ADMIN") return true;
    if (role === "CONTENT_MANAGER") return entity !== "universities";
    if (role === "DATA_ENTRY") return false;
    return false;
  };

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
            {view.level === "subject_details" && `${view.subjectCode} Details`}
          </h1>
          <p className="text-sm text-zinc-400 mt-1.5 font-medium">
            {view.level === "universities" && "Manage parent institutions and academies."}
            {view.level === "courses" && "Manage degree programs and certificates."}
            {view.level === "semesters" && "Select a semester to manage its subjects."}
            {view.level === "subjects" && "Manage subjects and curriculums for this semester."}
            {view.level === "subject_details" && "Manage syllabus chapters and related study materials."}
          </p>
        </div>
        
        {view.level !== "semesters" && canEdit(view.level === "subject_details" ? "chapters" : view.level) && (
          <div className="flex gap-2">
            {view.level === "subject_details" && (
              <button 
                onClick={() => openDrawer("chapter", { title: "", chapter_number: "", unit_name: "" })}
                className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-bold rounded-xl transition-all active:scale-95 border border-zinc-700"
              >
                <Plus className="w-4 h-4" /> Add Chapter
              </button>
            )}
            <button 
              onClick={() => {
                if (view.level === "universities") openDrawer("university", { name: "", slug: "", website_url: "" });
                if (view.level === "courses") openDrawer("course", { name: "", slug: "", duration_years: "", total_semesters: "" });
                if (view.level === "subjects") openDrawer("subject", { name: "", subject_code: "" });
                if (view.level === "subject_details") openDrawer("resource", { title: "", category: "ASSIGNMENT", price_in_inr: "0" });
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-zinc-200 text-black text-sm font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-95"
            >
              <Plus className="w-4 h-4" /> 
              Add New {view.level === "universities" ? "University" : view.level === "courses" ? "Course" : view.level === "subjects" ? "Subject" : "Resource"}
            </button>
          </div>
        )}
      </div>

      {view.level !== "semesters" && (
        <div className="mb-6"><SearchBar placeholder="Search..." value={search} onChange={setSearch} /></div>
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
                      <div className="w-9 h-9 rounded-lg bg-zinc-800/80 border border-zinc-700 flex items-center justify-center text-zinc-400 group-hover:text-white transition-colors"><GraduationCap className="w-4 h-4" /></div>
                      <div><div className="font-semibold text-white text-sm">{u.name}</div><div className="text-xs text-zinc-500 font-mono mt-0.5">{u.slug}</div></div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-400">{u.website_url || "—"}</td>
                  <td className="px-6 py-4"><StatusBadge active={u.is_active === 1} /></td>
                  <td className="px-6 py-4 text-right">
                    {canEdit("universities") && <button onClick={(e) => { e.stopPropagation(); openDrawer("university", u, u.id); }} className="p-2 text-zinc-500 hover:text-white rounded-lg hover:bg-zinc-700 transition-colors"><MoreHorizontal className="w-4 h-4" /></button>}
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
                      <div><div className="font-semibold text-white text-sm">{c.name}</div><div className="text-xs text-zinc-500 font-mono mt-0.5">{c.slug}</div></div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-400">{c.duration_years ? `${c.duration_years} Years` : "—"}</td>
                  <td className="px-6 py-4 text-sm text-zinc-400 font-medium">{c.total_semesters}</td>
                  <td className="px-6 py-4"><StatusBadge active={c.is_active === 1} /></td>
                  <td className="px-6 py-4 text-right">
                    {canEdit("courses") && <button onClick={(e) => { e.stopPropagation(); openDrawer("course", c, c.id); }} className="p-2 text-zinc-500 hover:text-white rounded-lg hover:bg-zinc-700 transition-colors"><MoreHorizontal className="w-4 h-4" /></button>}
                    {canDelete("courses") && <button onClick={(e) => { e.stopPropagation(); handleDelete("courses", c.id, c.name); }} className="p-2 text-zinc-500 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors ml-1"><Trash2 className="w-4 h-4" /></button>}
                  </td>
                </tr>
              ))}
            </DataTable>
          )}

          {/* SEMESTERS GRID */}
          {view.level === "semesters" && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {Array.from({ length: view.totalSemesters }, (_, i) => {
                const sem = i + 1;
                const existing = semesters.find(s => s.semester === sem);
                const hasSubjects = (existing?.subject_count || 0) > 0;
                return (
                  <button key={sem} onClick={() => nav.toSubjects(view.univId, view.univName, view.courseId, view.courseName, sem)}
                    className={`group relative flex flex-col items-center justify-center p-8 rounded-2xl border transition-all duration-300 ${hasSubjects ? "bg-zinc-900/60 border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800/80" : "bg-zinc-950/50 border-zinc-800/50 hover:border-zinc-700 hover:bg-zinc-900"}`}>
                    <div className={`w-12 h-12 rounded-full mb-4 flex items-center justify-center transition-colors ${hasSubjects ? "bg-zinc-800 text-white" : "bg-zinc-900 text-zinc-600"}`}><Layers className="w-5 h-5" /></div>
                    <h3 className="font-bold text-white text-base mb-1">Semester {sem}</h3>
                    <p className={`text-xs font-medium ${hasSubjects ? "text-indigo-400" : "text-zinc-600"}`}>{hasSubjects ? `${existing?.subject_count} Subjects` : "Empty"}</p>
                  </button>
                );
              })}
            </div>
          )}

          {/* SUBJECTS TABLE */}
          {view.level === "subjects" && (
            <DataTable headers={["Subject Code", "Subject Name", "Actions"]} emptyIcon={FileText} emptyText="No subjects found">
              {subjects.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.subject_code.toLowerCase().includes(search.toLowerCase())).map(s => (
                <tr key={s.id} className="group hover:bg-zinc-800/30 transition-colors cursor-pointer" onClick={() => nav.toSubjectDetails(view.univId, view.univName, view.courseId, view.courseName, view.semester, s.id, s.subject_code, s.name)}>
                  <td className="px-6 py-4"><span className="font-mono text-xs font-bold tracking-wide text-zinc-300 bg-zinc-800 border border-zinc-700 px-3 py-1.5 rounded-md">{s.subject_code}</span></td>
                  <td className="px-6 py-4 text-sm font-semibold text-white">{s.name}</td>
                  <td className="px-6 py-4 text-right">
                    {canEdit("subjects") && <button onClick={(e) => { e.stopPropagation(); openDrawer("subject", s, s.id); }} className="p-2 text-zinc-500 hover:text-white rounded-lg hover:bg-zinc-700 transition-colors"><MoreHorizontal className="w-4 h-4" /></button>}
                    {canDelete("subjects") && <button onClick={(e) => { e.stopPropagation(); handleDelete("subjects", s.id, s.name); }} className="p-2 text-zinc-500 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors ml-1"><Trash2 className="w-4 h-4" /></button>}
                  </td>
                </tr>
              ))}
            </DataTable>
          )}

          {/* CHAPTERS AND RESOURCES (SUBJECT DETAILS) */}
          {view.level === "subject_details" && (
            <div className="space-y-8">
              {/* Chapters Section */}
              <div>
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Bookmark className="w-5 h-5 text-indigo-400" /> Syllabus Chapters</h3>
                <DataTable headers={["Chapter", "Title", "Unit", "Actions"]} emptyIcon={Bookmark} emptyText="No chapters added yet">
                  {chapters.map(c => (
                    <tr key={c.id} className="group hover:bg-zinc-800/30 transition-colors">
                      <td className="px-6 py-4"><span className="text-xs font-bold text-zinc-400">CH {c.chapter_number}</span></td>
                      <td className="px-6 py-4 text-sm font-semibold text-white">{c.title}</td>
                      <td className="px-6 py-4 text-sm text-zinc-400">{c.unit_name || "—"}</td>
                      <td className="px-6 py-4 text-right">
                        {canEdit("chapters") && <button onClick={() => openDrawer("chapter", c, c.id)} className="p-2 text-zinc-500 hover:text-white rounded-lg hover:bg-zinc-700 transition-colors"><MoreHorizontal className="w-4 h-4" /></button>}
                        {canDelete("chapters") && <button onClick={() => handleDelete("chapters", c.id, c.title)} className="p-2 text-zinc-500 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors ml-1"><Trash2 className="w-4 h-4" /></button>}
                      </td>
                    </tr>
                  ))}
                </DataTable>
              </div>

              {/* Resources Section */}
              <div>
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><FileText className="w-5 h-5 text-emerald-400" /> Study Materials</h3>
                <DataTable headers={["Title", "Linked To", "Category", "Price", "Actions"]} emptyIcon={File} emptyText="No resources uploaded yet">
                  {resources.map(r => (
                    <tr key={r.id} className="group hover:bg-zinc-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-zinc-800/50 flex items-center justify-center text-zinc-400"><FileText className="w-4 h-4" /></div>
                          <div className="font-semibold text-white text-sm">{r.title}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-zinc-400">
                        {r.chapter_id ? `CH ${chapters.find(c => c.id === r.chapter_id)?.chapter_number || '?'}` : 'Subject Level'}
                      </td>
                      <td className="px-6 py-4"><span className="text-[10px] font-bold text-zinc-300 bg-zinc-800 px-2 py-1 rounded-md">{r.category}</span></td>
                      <td className="px-6 py-4 text-sm font-medium text-emerald-400">{r.price_in_inr > 0 ? `₹${r.price_in_inr}` : "FREE"}</td>
                      <td className="px-6 py-4 text-right">
                        {canEdit("resources") && <button onClick={() => openDrawer("resource", r, r.id)} className="p-2 text-zinc-500 hover:text-white rounded-lg hover:bg-zinc-700 transition-colors"><MoreHorizontal className="w-4 h-4" /></button>}
                        {canDelete("resources") && <button onClick={() => handleDelete("resources", r.id, r.title)} className="p-2 text-zinc-500 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors ml-1"><Trash2 className="w-4 h-4" /></button>}
                      </td>
                    </tr>
                  ))}
                </DataTable>
              </div>
            </div>
          )}
        </>
      )}

      {/* DRAWER FOR ALL FORMS */}
      <SlideOverDrawer 
        title={editingId ? `Edit Form` : `Create New`} 
        open={drawerOpen} onClose={() => setDrawerOpen(false)}
      >
        <form onSubmit={handleFormSubmit} className="space-y-5">
          {error && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm font-medium">{error}</div>}

          {/* University Fields */}
          {formType === "university" && (
            <>
              <div><label className={labelClass}>University Name</label><input type="text" className={inputClass} value={formData.name || ""} onChange={e => setFormData({...formData, name: e.target.value, slug: editingId ? formData.slug : autoSlug(e.target.value)})} placeholder="e.g. Stanford University" required /></div>
              <div><label className={labelClass}>Slug</label><input type="text" className={`${inputClass} font-mono`} value={formData.slug || ""} onChange={e => setFormData({...formData, slug: e.target.value})} placeholder="stanford-univ" required /></div>
              <div><label className={labelClass}>Website URL</label><input type="url" className={inputClass} value={formData.website_url || ""} onChange={e => setFormData({...formData, website_url: e.target.value})} placeholder="https://stanford.edu" /></div>
            </>
          )}

          {/* Course Fields */}
          {formType === "course" && (
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
          {formType === "subject" && (
            <>
              <div><label className={labelClass}>Subject Code</label><input type="text" className={`${inputClass} font-mono uppercase`} value={formData.subject_code || ""} onChange={e => setFormData({...formData, subject_code: e.target.value.toUpperCase()})} placeholder="CS-101" required /></div>
              <div><label className={labelClass}>Subject Name</label><input type="text" className={inputClass} value={formData.name || ""} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Data Structures" required /></div>
            </>
          )}

          {/* Chapter Fields */}
          {formType === "chapter" && (
            <>
              <div><label className={labelClass}>Chapter Number</label><input type="number" min="1" className={inputClass} value={formData.chapter_number || ""} onChange={e => setFormData({...formData, chapter_number: e.target.value})} placeholder="1" required /></div>
              <div><label className={labelClass}>Chapter Title</label><input type="text" className={inputClass} value={formData.title || ""} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Introduction to Arrays" required /></div>
              <div><label className={labelClass}>Unit / Block Name (Optional)</label><input type="text" className={inputClass} value={formData.unit_name || ""} onChange={e => setFormData({...formData, unit_name: e.target.value})} placeholder="Block 1" /></div>
            </>
          )}

          {/* Resource Upload Fields */}
          {formType === "resource" && (
            <>
              {!editingId && (
                <div>
                  <label className={labelClass}>Upload File</label>
                  <div 
                    className={`mt-1 flex justify-center px-6 pt-8 pb-8 border-2 border-dashed rounded-2xl transition-all cursor-pointer ${dragActive ? 'border-indigo-500 bg-indigo-500/10' : selectedFile ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/50'}`}
                    onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={(e) => { e.preventDefault(); setDragActive(false); if (e.dataTransfer.files && e.dataTransfer.files[0]) setSelectedFile(e.dataTransfer.files[0]); }}
                    onClick={() => document.getElementById('file-upload')?.click()}
                  >
                    <div className="space-y-2 text-center">
                      {selectedFile ? <FileUp className="mx-auto h-10 w-10 text-emerald-400" /> : <UploadCloud className="mx-auto h-10 w-10 text-zinc-500" />}
                      <div className="flex text-sm text-zinc-400 justify-center">
                        <span className={selectedFile ? "text-emerald-400 font-semibold" : "text-indigo-400 font-semibold"}>
                          {selectedFile ? selectedFile.name : "Click to upload or drag and drop"}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-600">Max size 100MB</p>
                    </div>
                    <input id="file-upload" type="file" className="hidden" onChange={(e) => { if (e.target.files && e.target.files[0]) setSelectedFile(e.target.files[0]); }} />
                  </div>
                </div>
              )}
              
              <div><label className={labelClass}>Resource Title</label><input type="text" className={inputClass} value={formData.title || ""} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Title (e.g., Assignment 1)" required /></div>

              <div><label className={labelClass}>Link to Chapter</label>
                <select className={inputClass} value={formData.chapter_id || ""} onChange={e => setFormData({...formData, chapter_id: e.target.value})}>
                  <option value="">-- Subject Level (No Chapter) --</option>
                  {chapters.map(ch => (
                    <option key={ch.id} value={ch.id}>CH {ch.chapter_number}: {ch.title}</option>
                  ))}
                </select>
              </div>

              <div><label className={labelClass}>Category</label>
                <select className={inputClass} value={formData.category || "ASSIGNMENT"} onChange={e => setFormData({...formData, category: e.target.value})}>
                  <option value="ASSIGNMENT">Assignment</option>
                  <option value="PROJECT">Project</option>
                  <option value="PYQ">PYQ (Previous Year Question)</option>
                  <option value="SHORTNOTES">Short Notes</option>
                  <option value="SOLUTION">Solution</option>
                  <option value="VIDEO_LECTURE">Video Lecture</option>
                  <option value="EBOOK_MODULE">eBook Module</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelClass}>Price (INR)</label><input type="number" min="0" className={inputClass} value={formData.price_in_inr || ""} onChange={e => setFormData({...formData, price_in_inr: e.target.value})} placeholder="₹ 0 for free" /></div>
                <div>
                  <label className="flex items-center gap-2 text-xs font-semibold text-zinc-400 mt-8 cursor-pointer">
                    <input type="checkbox" className="rounded bg-zinc-900 border-zinc-700 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-zinc-950" 
                           checked={formData.is_public || false} onChange={e => setFormData({...formData, is_public: e.target.checked})} />
                    Is Public?
                  </label>
                </div>
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
