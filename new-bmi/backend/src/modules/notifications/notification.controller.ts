import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiResponse } from '../../utils/ApiResponse';
import { notificationService } from './notification.service';

export const notificationController = {
  getList: asyncHandler(async (req: Request, res: Response) => {
    const result = await notificationService.getList(req.user.id, req.query);
    res.json(new ApiResponse(result.data, 'OK', result.meta));
  }),

  markRead: asyncHandler(async (req: Request, res: Response) => {
    await notificationService.markRead(req.params.id, req.user.id);
    res.json(new ApiResponse(null, "O'qildi"));
  }),

  markAllRead: asyncHandler(async (req: Request, res: Response) => {
    await notificationService.markAllRead(req.user.id);
    res.json(new ApiResponse(null, 'Hammasi o\'qildi'));
  }),
};
