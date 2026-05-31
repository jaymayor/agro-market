import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiResponse } from '../../utils/ApiResponse';
import { ApiError } from '../../utils/ApiError';
import { deliveryService } from './delivery.service';
import { uploadToCloudinary } from '../../config/cloudinary';

export const deliveryController = {
  getZones: asyncHandler(async (_req: Request, res: Response) => {
    const zones = await deliveryService.getZones();
    res.json(new ApiResponse(zones));
  }),

  getMyDeliveries: asyncHandler(async (req: Request, res: Response) => {
    const list = await deliveryService.getMyDeliveries(req.user.id);
    res.json(new ApiResponse(list));
  }),

  assignDriver: asyncHandler(async (req: Request, res: Response) => {
    const delivery = await deliveryService.assignDriver(req.params.orderId, req.body.driver_id);
    res.json(new ApiResponse(delivery, 'Haydovchi biriktirildi'));
  }),

  updateLocation: asyncHandler(async (req: Request, res: Response) => {
    const d = await deliveryService.updateLocation(req.params.orderId, req.user.id, req.body.lat, req.body.lng);
    res.json(new ApiResponse(d));
  }),

  updateStatus: asyncHandler(async (req: Request, res: Response) => {
    let photoUrl: string | undefined;
    if (req.file) photoUrl = await uploadToCloudinary(req.file.buffer, 'delivery');
    if (req.body.status === 'delivered' && !photoUrl) throw new ApiError(400, "Yetkazish rasmi majburiy");
    const d = await deliveryService.updateStatus(req.params.orderId, req.user.id, req.body.status, req.body.failed_reason, photoUrl);
    res.json(new ApiResponse(d, 'Holat yangilandi'));
  }),

  getTracking: asyncHandler(async (req: Request, res: Response) => {
    const tracking = await deliveryService.getTracking(req.params.orderId);
    res.json(new ApiResponse(tracking));
  }),
};
