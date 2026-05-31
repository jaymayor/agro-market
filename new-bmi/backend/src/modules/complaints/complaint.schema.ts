import { z } from 'zod';
import { ComplaintType, RefundType } from '@prisma/client';

export const createComplaintSchema = z.object({
  order_id: z.string().uuid(),
  type: z.nativeEnum(ComplaintType),
  description: z.string().min(10).max(2000),
});

export const respondComplaintSchema = z.object({
  response: z.string().min(5).max(2000),
  agree_refund: z.boolean(),
});

export const resolveComplaintSchema = z.object({
  decision: z.string().min(5),
  refund_type: z.nativeEnum(RefundType),
  refund_amount: z.number().min(0).optional(),
});
