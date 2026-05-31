import { z } from 'zod';

export const updateLocationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const updateDeliveryStatusSchema = z.object({
  status: z.enum(['picked_up', 'in_transit', 'arrived', 'delivered', 'failed']),
  failed_reason: z.string().optional(),
});
