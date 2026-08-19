import { z } from "zod";

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
