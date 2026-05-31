import { z } from 'zod';

export const createCategorySchema = z.object({
  name_uz: z.string().min(2).max(200),
  name_ru: z.string().max(200).optional(),
  parent_id: z.string().uuid().optional(),
  ordering: z.number().int().min(0).default(0),
});

export const updateCategorySchema = createCategorySchema.partial();
