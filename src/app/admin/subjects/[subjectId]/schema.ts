import { z } from "zod";

export const chapterSchema = z.object({
  id: z.string().optional(),
  subject_id: z.string().min(1, "Subject ID is required"),
  unit_number: z.number().nullable().optional(),
  unit_name: z.string().nullable().optional(),
  chapter_number: z.number().min(1, "Chapter number is required"),
  title: z.string().min(1, "Title is required"),
  is_active: z.number().default(1),
});

export type ChapterSchema = z.infer<typeof chapterSchema>;

export const masterMaterialSchema = z.object({
  id: z.string().optional(),
  subject_id: z.string().min(1, "Subject ID is required"),
  title: z.string().min(1, "Title is required"),
  category: z.string().min(1, "Category is required"),
  price_in_inr: z.number().default(0),
  r2_object_key: z.string().nullable().optional(),
  is_active: z.number().default(1),
});

export type MasterMaterialSchema = z.infer<typeof masterMaterialSchema>;
