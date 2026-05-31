import { z } from 'zod';

export const createShopSchema = z.object({
  name: z.string().min(2).max(255),
  description: z.string().optional(),
  region: z.string().min(2),
  district: z.string().min(2),
  address: z.string().min(5),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

export const updateShopSchema = createShopSchema.partial();

export const shopStatusSchema = z.object({
  status: z.enum(['active', 'suspended', 'closed']),
  reason: z.string().optional(),
});

export type CreateShopDto = z.infer<typeof createShopSchema>;
