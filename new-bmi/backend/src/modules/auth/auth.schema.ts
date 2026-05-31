import { z } from 'zod';

export const sendOtpSchema = z.object({
  phone: z.string().regex(/^\+998\d{9}$/, "Telefon raqami noto'g'ri (+998XXXXXXXXX)"),
});

export const verifyOtpSchema = z.object({
  phone: z.string().regex(/^\+998\d{9}$/),
  otp: z.string().length(6, 'OTP 6 ta raqam'),
  role: z.enum(['buyer', 'seller']).default('buyer'),
  device_info: z.record(z.string()).optional(),
});

export const refreshSchema = z.object({
  refresh_token: z.string().min(1),
});

export const updateProfileSchema = z.object({
  full_name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  avatar_url: z.string().url().optional(),
});

export type SendOtpDto = z.infer<typeof sendOtpSchema>;
export type VerifyOtpDto = z.infer<typeof verifyOtpSchema>;
export type RefreshDto = z.infer<typeof refreshSchema>;
export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;
