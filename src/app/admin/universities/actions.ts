"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";

// Assuming we fetch the API since this is frontend
const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://admin-backend.pixraglobal.workers.dev";

export const universitySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "University name is required"),
  slug: z.string().min(1, "Slug is required"),
  acronym: z.string().nullable().optional(),
  website_url: z.string().nullable().optional(),
  logo_url: z.string().nullable().optional(),
  search_aliases: z.string().nullable().optional(),
  is_active: z.number().default(1),
});

export type UniversitySchema = z.infer<typeof universitySchema>;

export async function saveUniversityAction(data: UniversitySchema, token: string) {
  const parsed = universitySchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0].message };
  }

  try {
    const isUpdate = !!data.id;
    const endpoint = isUpdate ? `/api/universities/${data.id}` : `/api/universities`;
    const method = isUpdate ? "PUT" : "POST";

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
