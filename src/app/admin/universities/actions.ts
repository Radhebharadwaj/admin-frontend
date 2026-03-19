"use server";

import { revalidatePath } from "next/cache";
import { universitySchema, type UniversitySchema } from "./schema";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://admin-backend.pixraglobal.workers.dev";

export async function saveUniversityAction(data: UniversitySchema, token: string) {
  const parsed = universitySchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0].message };
  }

  try {
    const isUpdate = !!data.id;
    const endpoint = isUpdate ? `/api/universities/${data.id}` : `/api/universities`;
    const method = isUpdate ? "PATCH" : "POST";

    const res = await fetch(`${API_URL}${endpoint}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(parsed.data),
    });

    const result = await res.json();

    if (!res.ok) {
      return { success: false, message: result.message || "Failed to save university" };
    }

    revalidatePath("/admin/universities");
    return { success: true, message: `University ${isUpdate ? "updated" : "created"} successfully.` };
  } catch (error: any) {
    return { success: false, message: error.message || "An unexpected error occurred." };
  }
}

export async function deleteUniversityAction(id: string, token: string) {
  try {
    const res = await fetch(`${API_URL}/api/universities/${id}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`
      },
    });

    if (!res.ok) {
      const result = await res.json();
      return { success: false, message: result.message || "Failed to delete university" };
    }

    revalidatePath("/admin/universities");
    return { success: true, message: "University deleted successfully." };
  } catch (error: any) {
    return { success: false, message: error.message || "An unexpected error occurred." };
  }
}
