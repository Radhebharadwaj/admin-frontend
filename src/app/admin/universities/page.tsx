"use client";

import { useState, useEffect } from "react";
import { GraduationCap, BookOpen, Layers, FileText, Plus, Pencil, Trash2, Globe, Clock, ArrowLeft, Search, X } from "lucide-react";
import { fetchApi } from "@/lib/api";

// ===== TYPES =====
interface University { id: string; name: string; slug: string; website_url: string | null; logo_url: string | null; is_active: number; }
interface Course { id: string; university_id: string; name: string; slug: string; duration_years: number | null; total_semesters: number; is_active: number; }
interface SemesterInfo { semester: number; subject_count: number; }
interface Subject { id: string; course_id: string; semester: number; name: string; subject_code: string; }

// ===== SEARCH BAR =====
function SearchBar({ placeholder, value, onChange }: { placeholder: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative max-w-md">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all" />
      {value && <button onClick={() => onChange("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>}
    </div>
  );
}

// ===== BREADCRUMB =====
function Breadcrumb({ items, onNavigate }: { items: { label: string; onClick?: () => void }[]; onNavigate?: () => void }) {
  return (
    <nav className="flex items-center gap-1.5 text-sm mb-6 flex-wrap">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-slate-600">›</span>}
          {item.onClick ? (
            <button onClick={item.onClick} className="text-slate-400 hover:text-indigo-400 transition-colors">{item.label}</button>
          ) : (
            <span className="text-white font-medium">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

// ===== MODAL WRAPPER =====
function Modal({ title, open, onClose, children }: { title: string; open: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg p-6 animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-white mb-5">{title}</h2>
        {children}
      </div>
    </div>
  );
}

// ===== MAIN PAGE =====
type ViewState = 
  | { level: "universities" }
  | { level: "courses"; univId: string; univName: string }
  | { level: "semesters"; univId: string; univName: string; courseId: string; courseName: string; totalSemesters: number }
  | { level: "subjects"; univId: string; univName: string; courseId: string; courseName: string; semester: number };

export default function UniversitiesPage() {
  const [view, setView] = useState<ViewState>({ level: "universities" });
  const [universities, setUniversities] = useState<University[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [semesters, setSemesters] = useState<SemesterInfo[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState<Record<string, string>>({});

  // ===== FETCH FUNCTIONS =====
  const fetchUniversities = async () => {
    setLoading(true);
    setError("");
    const res = await fetchApi("/api/universities");
    if (res.success) {
      setUniversities(res.data);
    } else {
      setError(res.message || "Failed to load universities");
    }
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

  useEffect(() => { fetchUniversities(); }, []);

  // ===== NAVIGATION =====
  const goToUniversities = () => { setView({ level: "universities" }); setSearch(""); fetchUniversities(); };
  const goToCourses = (univId: string, univName: string) => { setView({ level: "courses", univId, univName }); setSearch(""); fetchCourses(univId); };
  const goToSemesters = (univId: string, univName: string, courseId: string, courseName: string, totalSemesters: number) => {
    setView({ level: "semesters", univId, univName, courseId, courseName, totalSemesters }); setSearch(""); fetchSemesters(courseId);
  };
  const goToSubjects = (univId: string, univName: string, courseId: string, courseName: string, semester: number) => {
    setView({ level: "subjects", univId, univName, courseId, courseName, semester }); setSearch(""); fetchSubjects(courseId, semester);
  };

  // ===== CRUD HELPERS =====
  const handleDelete = async (entity: string, id: string, name: string) => {
    const msgs: Record<string, string> = {
      universities: `Delete "${name}" and ALL its courses, subjects, and resources?`,
      courses: `Delete "${name}" and ALL its subjects and resources?`,
      subjects: `Delete "${name}" and ALL its resources?`,
    };
    if (!confirm(msgs[entity] + " This cannot be undone.")) return;
    await fetchApi(`/api/${entity}/${id}`, { method: "DELETE" });
    if (entity === "universities") fetchUniversities();
    else if (entity === "courses" && view.level === "courses") fetchCourses(view.univId);
    else if (entity === "subjects" && view.level === "subjects") fetchSubjects(view.courseId, view.semester);
  };

  const autoSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const openModal = (data?: Record<string, string>, id?: string) => {
    setEditingId(id || null);
    setFormData(data || {});
    setError("");
    setIsModalOpen(true);
  };

  // ===== BREADCRUMB ITEMS =====
  const breadcrumbItems = (): { label: string; onClick?: () => void }[] => {
    const items: { label: string; onClick?: () => void }[] = [];
    items.push(view.level === "universities" ? { label: "Universities" } : { label: "Universities", onClick: goToUniversities });
    if (view.level === "courses") items.push({ label: view.univName });
    if (view.level === "semesters") {
      items.push({ label: view.univName, onClick: () => goToCourses(view.univId, view.univName) });
      items.push({ label: view.courseName });
    }
    if (view.level === "subjects") {
      items.push({ label: view.univName, onClick: () => goToCourses(view.univId, view.univName) });
      items.push({ label: view.courseName, onClick: () => goToSemesters(view.univId, view.univName, view.courseId, view.courseName, 0) });
      items.push({ label: `Semester ${view.semester}` });
    }
    return items;
  };

  // ===== RENDER LOADING =====
  if (loading) {
    return (
      <div className="animate-in fade-in duration-500">
        <Breadcrumb items={breadcrumbItems()} />
        <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div></div>
      </div>
    );
  }

  // ==============================
  // UNIVERSITIES VIEW
  // ==============================
  if (view.level === "universities") {
    const filtered = universities.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.slug.toLowerCase().includes(search.toLowerCase()));
    
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault(); setModalLoading(true); setError("");
      try {
        const url = editingId ? `/api/universities/${editingId}` : "/api/universities";
        const res = await fetchApi(url, { method: editingId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData) });
        if (!res.success) throw new Error(res.message);
        setIsModalOpen(false); await fetchUniversities();
      } catch (err: any) { setError(err.message); }
      setModalLoading(false);
    };

    return (
      <div className="animate-in fade-in duration-500">
        <Breadcrumb items={breadcrumbItems()} />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Universities</h1>
            <p className="text-sm text-slate-400 mt-1">{universities.length} registered</p>
          </div>
          <button onClick={() => openModal({ name: "", slug: "", website_url: "" })} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition-colors">
            <Plus className="w-4 h-4" /> Add University
          </button>
        </div>
        <SearchBar placeholder="Search universities..." value={search} onChange={setSearch} />
        
        {error && !isModalOpen ? (
          <div className="mt-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl flex items-center justify-center text-sm font-medium">
            {error}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-500"><GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-30" /><p className="font-medium">{search ? "No match" : "No universities yet"}</p></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-6">
            {filtered.map((uni) => (
              <div key={uni.id} className="group bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 hover:border-indigo-500/30 transition-all">
                <div onClick={() => goToCourses(uni.id, uni.name)} className="cursor-pointer">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center"><GraduationCap className="w-5 h-5 text-indigo-400" /></div>
                      <div>
                        <h3 className="font-semibold text-white group-hover:text-indigo-400 transition-colors">{uni.name}</h3>
                        <p className="text-xs text-slate-500 font-mono">{uni.slug}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${uni.is_active ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-zinc-700/50 text-zinc-500 border border-zinc-600"}`}>{uni.is_active ? "ACTIVE" : "HIDDEN"}</span>
                  </div>
                  {uni.website_url && <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2"><Globe className="w-3 h-3" /><span className="truncate">{uni.website_url}</span></div>}
                </div>
                <div className="flex items-center gap-1 pt-3 border-t border-zinc-800">
                  <button onClick={() => goToCourses(uni.id, uni.name)} className="flex-1 text-xs text-slate-400 hover:text-indigo-400 py-1.5 rounded-lg hover:bg-indigo-500/5 transition-colors font-medium">View Courses →</button>
                  <button onClick={() => openModal({ name: uni.name, slug: uni.slug, website_url: uni.website_url || "" }, uni.id)} className="p-2 text-slate-500 hover:text-amber-400 hover:bg-amber-400/5 rounded-lg transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDelete("universities", uni.id, uni.name)} className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-400/5 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Modal title={editingId ? "Edit University" : "Add University"} open={isModalOpen} onClose={() => setIsModalOpen(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="block text-sm font-medium text-zinc-400 mb-1.5">Name *</label><input type="text" value={formData.name || ""} onChange={(e) => setFormData({ ...formData, name: e.target.value, slug: editingId ? formData.slug : autoSlug(e.target.value) })} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50" placeholder="e.g. IGNOU" required /></div>
            <div><label className="block text-sm font-medium text-zinc-400 mb-1.5">Slug *</label><input type="text" value={formData.slug || ""} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50" placeholder="e.g. ignou" required /></div>
            <div><label className="block text-sm font-medium text-zinc-400 mb-1.5">Website URL</label><input type="url" value={formData.website_url || ""} onChange={(e) => setFormData({ ...formData, website_url: e.target.value })} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50" placeholder="https://ignou.ac.in" /></div>
            {error && <p className="text-rose-400 text-sm">{error}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors">Cancel</button>
              <button type="submit" disabled={modalLoading} className="px-5 py-2.5 rounded-xl font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-colors disabled:opacity-50">{modalLoading ? "Saving..." : editingId ? "Update" : "Create"}</button>
            </div>
          </form>
        </Modal>
      </div>
    );
  }

  // ==============================
  // COURSES VIEW
  // ==============================
  if (view.level === "courses") {
    const filtered = courses.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.slug.toLowerCase().includes(search.toLowerCase()));

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault(); setModalLoading(true); setError("");
      try {
        const url = editingId ? `/api/courses/${editingId}` : "/api/courses";
        const payload: any = { name: formData.name, slug: formData.slug, duration_years: formData.duration_years ? parseInt(formData.duration_years) : null, total_semesters: parseInt(formData.total_semesters) };
        if (!editingId) payload.university_id = view.univId;
        const res = await fetchApi(url, { method: editingId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        if (!res.success) throw new Error(res.message);
        setIsModalOpen(false); await fetchCourses(view.univId);
      } catch (err: any) { setError(err.message); }
      setModalLoading(false);
    };

    return (
      <div className="animate-in fade-in duration-500">
        <Breadcrumb items={breadcrumbItems()} />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">{view.univName} — Courses</h1>
            <p className="text-sm text-slate-400 mt-1">{courses.length} courses</p>
          </div>
          <button onClick={() => openModal({ name: "", slug: "", duration_years: "", total_semesters: "" })} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition-colors"><Plus className="w-4 h-4" /> Add Course</button>
        </div>
        <SearchBar placeholder="Search courses..." value={search} onChange={setSearch} />

        {filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-500"><BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" /><p className="font-medium">{search ? "No match" : "No courses yet"}</p></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-6">
            {filtered.map((course) => (
              <div key={course.id} className="group bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 hover:border-blue-500/30 transition-all">
                <div onClick={() => goToSemesters(view.univId, view.univName, course.id, course.name, course.total_semesters)} className="cursor-pointer">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center"><BookOpen className="w-5 h-5 text-blue-400" /></div>
                      <div><h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors">{course.name}</h3><p className="text-xs text-slate-500 font-mono">{course.slug}</p></div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${course.is_active ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-zinc-700/50 text-zinc-500 border border-zinc-600"}`}>{course.is_active ? "ACTIVE" : "HIDDEN"}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    {course.duration_years && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{course.duration_years} Years</span>}
                    <span className="flex items-center gap-1"><Layers className="w-3 h-3" />{course.total_semesters} Semesters</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 pt-3 mt-3 border-t border-zinc-800">
                  <button onClick={() => goToSemesters(view.univId, view.univName, course.id, course.name, course.total_semesters)} className="flex-1 text-xs text-slate-400 hover:text-blue-400 py-1.5 rounded-lg hover:bg-blue-500/5 transition-colors font-medium">View Semesters →</button>
                  <button onClick={() => openModal({ name: course.name, slug: course.slug, duration_years: course.duration_years?.toString() || "", total_semesters: course.total_semesters.toString() }, course.id)} className="p-2 text-slate-500 hover:text-amber-400 hover:bg-amber-400/5 rounded-lg transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDelete("courses", course.id, course.name)} className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-400/5 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Modal title={editingId ? "Edit Course" : "Add Course"} open={isModalOpen} onClose={() => setIsModalOpen(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="block text-sm font-medium text-zinc-400 mb-1.5">Course Name *</label><input type="text" value={formData.name || ""} onChange={(e) => setFormData({ ...formData, name: e.target.value, slug: editingId ? formData.slug : autoSlug(e.target.value) })} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50" placeholder="e.g. BCA" required /></div>
            <div><label className="block text-sm font-medium text-zinc-400 mb-1.5">Slug *</label><input type="text" value={formData.slug || ""} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50" required /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-zinc-400 mb-1.5">Duration (Years)</label><input type="number" min="1" max="10" value={formData.duration_years || ""} onChange={(e) => setFormData({ ...formData, duration_years: e.target.value })} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50" placeholder="e.g. 3" /></div>
              <div><label className="block text-sm font-medium text-zinc-400 mb-1.5">Total Semesters *</label><input type="number" min="1" max="16" value={formData.total_semesters || ""} onChange={(e) => setFormData({ ...formData, total_semesters: e.target.value })} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50" placeholder="e.g. 6" required /></div>
            </div>
            {error && <p className="text-rose-400 text-sm">{error}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors">Cancel</button>
              <button type="submit" disabled={modalLoading} className="px-5 py-2.5 rounded-xl font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-colors disabled:opacity-50">{modalLoading ? "Saving..." : editingId ? "Update" : "Create"}</button>
            </div>
          </form>
        </Modal>
      </div>
    );
  }

  // ==============================
  // SEMESTERS VIEW
  // ==============================
  if (view.level === "semesters") {
    const total = view.totalSemesters || 8;
    const semesterGrid = Array.from({ length: total }, (_, i) => {
      const sem = i + 1;
      const existing = semesters.find(s => s.semester === sem);
      return { semester: sem, subject_count: existing?.subject_count || 0 };
    });

    return (
      <div className="animate-in fade-in duration-500">
        <Breadcrumb items={breadcrumbItems()} />
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">{view.courseName} — Semesters</h1>
          <p className="text-sm text-slate-400 mt-1">{total} semesters • Select one to manage subjects</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
          {semesterGrid.map((sem) => (
            <button key={sem.semester} onClick={() => goToSubjects(view.univId, view.univName, view.courseId, view.courseName, sem.semester)}
              className={`group relative bg-zinc-900/50 border rounded-2xl p-6 text-center transition-all hover:scale-[1.02] ${sem.subject_count > 0 ? "border-indigo-500/20 hover:border-indigo-500/50" : "border-zinc-800 hover:border-zinc-700"}`}>
              <div className={`w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center ${sem.subject_count > 0 ? "bg-indigo-500/10 border border-indigo-500/20" : "bg-zinc-800/50 border border-zinc-700"}`}>
                <span className={`text-lg font-bold ${sem.subject_count > 0 ? "text-indigo-400" : "text-zinc-500"}`}>{sem.semester}</span>
              </div>
              <h3 className="font-semibold text-white text-sm mb-1">Semester {sem.semester}</h3>
              <p className={`text-xs ${sem.subject_count > 0 ? "text-indigo-400" : "text-slate-600"}`}>{sem.subject_count > 0 ? `${sem.subject_count} subjects` : "Empty"}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ==============================
  // SUBJECTS VIEW
  // ==============================
  if (view.level === "subjects") {
    const filtered = subjects.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.subject_code.toLowerCase().includes(search.toLowerCase()));

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault(); setModalLoading(true); setError("");
      try {
        const url = editingId ? `/api/subjects/${editingId}` : "/api/subjects";
        const payload: any = { subject_code: formData.subject_code, name: formData.name, semester: view.semester };
        if (!editingId) payload.course_id = view.courseId;
        const res = await fetchApi(url, { method: editingId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        if (!res.success) throw new Error(res.message);
        setIsModalOpen(false); await fetchSubjects(view.courseId, view.semester);
      } catch (err: any) { setError(err.message); }
      setModalLoading(false);
    };

    return (
      <div className="animate-in fade-in duration-500">
        <Breadcrumb items={breadcrumbItems()} />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Semester {view.semester} — Subjects</h1>
            <p className="text-sm text-slate-400 mt-1">{subjects.length} subjects</p>
          </div>
          <button onClick={() => openModal({ subject_code: "", name: "" })} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition-colors"><Plus className="w-4 h-4" /> Add Subject</button>
        </div>
        <SearchBar placeholder="Search by code or name..." value={search} onChange={setSearch} />

        {filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-500"><FileText className="w-12 h-12 mx-auto mb-3 opacity-30" /><p className="font-medium">{search ? "No match" : "No subjects yet"}</p></div>
        ) : (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden mt-6">
            <table className="w-full">
              <thead><tr className="border-b border-zinc-800">
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Code</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Subject Name</th>
                <th className="text-right px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-zinc-800/50">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-zinc-800/20 transition-colors">
                    <td className="px-6 py-4"><span className="font-mono text-sm text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">{s.subject_code}</span></td>
                    <td className="px-6 py-4 text-white font-medium">{s.name}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openModal({ subject_code: s.subject_code, name: s.name }, s.id)} className="p-2 text-slate-500 hover:text-amber-400 hover:bg-amber-400/5 rounded-lg transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDelete("subjects", s.id, s.subject_code)} className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-400/5 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Modal title={editingId ? "Edit Subject" : "Add Subject"} open={isModalOpen} onClose={() => setIsModalOpen(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="block text-sm font-medium text-zinc-400 mb-1.5">Subject Code *</label><input type="text" value={formData.subject_code || ""} onChange={(e) => setFormData({ ...formData, subject_code: e.target.value.toUpperCase() })} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/50" placeholder="e.g. CS-201" required /></div>
            <div><label className="block text-sm font-medium text-zinc-400 mb-1.5">Subject Name *</label><input type="text" value={formData.name || ""} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50" placeholder="e.g. Data Structures" required /></div>
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5"><span className="text-xs text-slate-500">Semester</span><span className="ml-2 text-white font-semibold">{view.semester}</span></div>
            {error && <p className="text-rose-400 text-sm">{error}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors">Cancel</button>
              <button type="submit" disabled={modalLoading} className="px-5 py-2.5 rounded-xl font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-colors disabled:opacity-50">{modalLoading ? "Saving..." : editingId ? "Update" : "Create"}</button>
            </div>
          </form>
        </Modal>
      </div>
    );
  }

  return null;
}
