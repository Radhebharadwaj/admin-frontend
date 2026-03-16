"use server";

import { revalidatePath } from "next/cache";
import { chapterSchema, masterMaterialSchema, type ChapterSchema, type MasterMaterialSchema } from "./schema";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://admin-backend.pixraglobal.workers.dev";

export async function saveChapterAction(data: ChapterSchema, token: string) {
  const parsed = chapterSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0].message };
  }

  try {
    const isUpdate = !!data.id;
    const endpoint = isUpdate ? `/api/chapters/${data.id}` : `/api/chapters`;
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
      return { success: false, message: result.message || "Failed to save chapter" };
    }

    revalidatePath(`/admin/subjects/${data.subject_id}`);
    return { success: true, message: `Chapter ${isUpdate ? "updated" : "created"} successfully.` };
  } catch (error: any) {
    return { success: false, message: error.message || "An unexpected error occurred." };
  }
}

export async function deleteChapterAction(id: string, subjectId: string, token: string) {
  try {
    const res = await fetch(`${API_URL}/api/chapters/${id}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`
      },
    });

    if (!res.ok) {
      const result = await res.json();
      return { success: false, message: result.message || "Failed to delete chapter" };
    }

    revalidatePath(`/admin/subjects/${subjectId}`);
    return { success: true, message: "Chapter deleted successfully." };
  } catch (error: any) {
    return { success: false, message: error.message || "An unexpected error occurred." };
  }
}

export async function saveMasterMaterialAction(data: MasterMaterialSchema, token: string) {
  const parsed = masterMaterialSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0].message };
  }

  try {
    const isUpdate = !!data.id;
    const endpoint = isUpdate ? `/api/resources/${data.id}` : `/api/resources`;
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
      return { success: false, message: result.message || "Failed to save master material" };
    }

    revalidatePath(`/admin/subjects/${data.subject_id}`);
    return { success: true, message: `Master material ${isUpdate ? "updated" : "created"} successfully.` };
  } catch (error: any) {
    return { success: false, message: error.message || "An unexpected error occurred." };
  }
}

export async function deleteMasterMaterialAction(id: string, subjectId: string, token: string) {
  try {
    const res = await fetch(`${API_URL}/api/resources/${id}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`
      },
    });

    if (!res.ok) {
      const result = await res.json();
      return { success: false, message: result.message || "Failed to delete master material" };
    }

    revalidatePath(`/admin/subjects/${subjectId}`);
    return { success: true, message: "Master material deleted successfully." };
  } catch (error: any) {
    return { success: false, message: error.message || "An unexpected error occurred." };
  }
}
