import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiResponse } from '../../utils/ApiResponse';
import { authService } from './auth.service';
import { UpdateProfileDto } from './auth.schema';

export const authController = {
  sendOtp: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.sendOtp(req.body);
    res.status(200).json(new ApiResponse(result, 'OTP yuborildi'));
  }),

  verifyOtp: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.verifyOtp(req.body);
    res.status(200).json(new ApiResponse(result, result.isNew ? 'Ro\'yxatdan o\'tdingiz' : 'Kirish muvaffaqiyatli'));
  }),

  refresh: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.refresh(req.body.refresh_token);
    res.status(200).json(new ApiResponse(result, 'Token yangilandi'));
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    await authService.logout(req.body.refresh_token);
    res.status(200).json(new ApiResponse(null, 'Chiqish muvaffaqiyatli'));
  }),

  me: asyncHandler(async (req: Request, res: Response) => {
    res.status(200).json(new ApiResponse(req.user));
  }),

  updateProfile: asyncHandler(async (req: Request, res: Response) => {
    const user = await authService.updateProfile(req.user.id, req.body as UpdateProfileDto);
    res.json(new ApiResponse(user, 'Profil yangilandi'));
  }),
};
