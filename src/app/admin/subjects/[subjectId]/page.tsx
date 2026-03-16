import { cookies } from "next/headers";
import SubjectDetailsClient from "./SubjectDetailsClient";

export const metadata = {
  title: "Subject Details | QuduHub Admin",
};

export const runtime = "edge";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://admin-backend.pixraglobal.workers.dev";

export default async function SubjectDetailsPage({ params }: { params: { subjectId: string } }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("sessionToken")?.value || "";

  const subjectId = params.subjectId;
  let initialChapters = [];
  let initialResources = [];

  try {
    // 1. Fetch Chapters
    const chaptersRes = await fetch(`${API_URL}/api/chapters?subject_id=${subjectId}`, {
      headers: { "Authorization": `Bearer ${token}` },
      cache: "no-store",
    });
    if (chaptersRes.ok) {
      const data = await chaptersRes.json();
      initialChapters = Array.isArray(data) ? data : data.data || [];
    } else {
      console.error("Failed to fetch chapters SSR:", chaptersRes.status);
    }

    // 2. Fetch Master Resources (category=MASTER is used strictly for SSR to get all resources for this subject)
    // The API route `api/resources?subject_id=X&category=MASTER` doesn't strictly filter chapter_id IS NULL on the backend
    // since we do it client-side. We fetch without category if we just want all of them.
    // The backend route actually handles subject_id alone.
    const resourcesRes = await fetch(`${API_URL}/api/resources?subject_id=${subjectId}`, {
      headers: { "Authorization": `Bearer ${token}` },
      cache: "no-store",
    });
    if (resourcesRes.ok) {
      const data = await resourcesRes.json();
      initialResources = Array.isArray(data) ? data : data.data || [];
    } else {
      console.error("Failed to fetch resources SSR:", resourcesRes.status);
    }
  } catch (err) {
    console.error("SSR Fetch Error:", err);
  }

  return (
    <SubjectDetailsClient
      subjectId={subjectId}
      initialChapters={initialChapters}
      initialResources={initialResources}
    />
  );
}
