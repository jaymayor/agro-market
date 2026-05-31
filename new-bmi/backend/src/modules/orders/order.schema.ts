import { z } from 'zod';
import { PaymentMethod, DeliveryType } from '@prisma/client';

const addressSchema = z.object({
  region: z.string().min(2),
  district: z.string().min(2),
  street: z.string().min(2),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

export const checkoutSchema = z.object({
  shop_id: z.string().uuid(),
  items: z.array(z.object({
    product_id: z.string().uuid(),
    quantity: z.number().positive(),
  })).min(1),
  payment_method: z.nativeEnum(PaymentMethod),
  delivery_type: z.nativeEnum(DeliveryType),
  delivery_address: addressSchema,
  delivery_zone_id: z.string().uuid().optional(),
  expected_delivery_date: z.string().optional(),
  notes: z.string().max(500).optional(),
});

export const cancelOrderSchema = z.object({
  reason: z.string().min(3).max(500),
});

export const orderQuerySchema = z.object({
  status: z.string().optional(),
  type: z.enum(['standard', 'pre_order']).optional(),
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(20),
});

export type CheckoutDto = z.infer<typeof checkoutSchema>;
