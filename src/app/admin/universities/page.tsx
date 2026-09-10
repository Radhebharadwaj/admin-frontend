import { cookies } from "next/headers";
import UniversitiesClient, { University } from "./UniversitiesClient";

export const metadata = {
  title: "Universities | QuduHub Admin",
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://admin-backend.pixraglobal.workers.dev";

export default async function UniversitiesPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("sessionToken")?.value || "";

  let universities: University[] = [];

  try {
    const res = await fetch(`${API_URL}/api/universities`, {
      headers: {
        "Authorization": `Bearer ${token}`
      },
      // Using Next.js cache revalidation tag
      next: { tags: ["universities"] }
    });

    if (res.ok) {
      const data = await res.json();
      // Assume the backend returns { success: true, data: [...] } based on api.ts pattern
      universities = Array.isArray(data) ? data : data.data || [];
    } else {
      console.error("Failed to fetch universities (SSR):", res.status);
    }
  } catch (err) {
    console.error("Failed to fetch universities (SSR Error):", err);
  }

  return (
    <UniversitiesClient universities={universities} />
  );
}
