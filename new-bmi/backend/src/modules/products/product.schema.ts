import { z } from 'zod';
import { ProductUnit } from '@prisma/client';

export const createProductSchema = z.object({
  category_id: z.string().uuid().optional(),
  name_uz: z.string().min(2).max(500),
  name_ru: z.string().max(500).optional(),
  description_uz: z.string().min(10),
  description_ru: z.string().optional(),
  price: z.number().positive(),
  discount_price: z.number().positive().optional(),
  unit: z.nativeEnum(ProductUnit),
  min_order_qty: z.number().positive().default(1),
  stock_qty: z.number().min(0),
  is_perishable: z.boolean().default(false),
  shelf_life_days: z.number().int().positive().optional(),
  requires_cold_chain: z.boolean().default(false),
  harvest_date: z.string().optional(),
  expiry_date: z.string().optional(),
  max_preorder_days: z.number().int().min(0).default(0),
  low_stock_alert_qty: z.number().min(0).default(0),
  origin_region: z.string().optional(),
  is_organic: z.boolean().default(false),
});

export const updateProductSchema = createProductSchema.partial();

export const productQuerySchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  region: z.string().optional(),
  price_min: z.coerce.number().optional(),
  price_max: z.coerce.number().optional(),
  unit: z.nativeEnum(ProductUnit).optional(),
  is_organic: z.coerce.boolean().optional(),
  is_perishable: z.coerce.boolean().optional(),
  in_stock: z.coerce.boolean().optional(),
  rating_min: z.coerce.number().min(1).max(5).optional(),
  sort: z.enum(['price_asc', 'price_desc', 'rating', 'newest', 'popular']).default('newest'),
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(20),
});

export const rejectProductSchema = z.object({
  reason: z.string().min(5),
});

export const updateStockSchema = z.object({
  stock_qty: z.number().min(0),
});

export type CreateProductDto = z.infer<typeof createProductSchema>;
export type UpdateProductDto = z.infer<typeof updateProductSchema>;
export type ProductQueryDto = z.infer<typeof productQuerySchema>;
