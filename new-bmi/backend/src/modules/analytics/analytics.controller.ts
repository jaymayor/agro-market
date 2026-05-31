import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiResponse } from '../../utils/ApiResponse';
import { analyticsService } from './analytics.service';

export const analyticsController = {
  sellerDashboard: asyncHandler(async (req: Request, res: Response) => {
    const data = await analyticsService.sellerDashboard(req.user.id);
    res.json(new ApiResponse(data));
  }),

  adminDashboard: asyncHandler(async (_req: Request, res: Response) => {
    const data = await analyticsService.adminDashboard();
    res.json(new ApiResponse(data));
  }),

  sellerSales: asyncHandler(async (req: Request, res: Response) => {
    const data = await analyticsService.sellerSales(req.user.id, req.query as any);
    res.json(new ApiResponse(data));
  }),

  adminPlatform: asyncHandler(async (_req: Request, res: Response) => {
    const data = await analyticsService.adminPlatform();
    res.json(new ApiResponse(data));
  }),
};
