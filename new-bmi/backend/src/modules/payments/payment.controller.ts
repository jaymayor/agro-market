import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiResponse } from '../../utils/ApiResponse';
import { paymentService } from './payment.service';

export const paymentController = {
  initiate: asyncHandler(async (req: Request, res: Response) => {
    const result = await paymentService.initiate(req.params.orderId, req.user.id);
    res.json(new ApiResponse(result, "To'lov boshlandi"));
  }),

  getStatus: asyncHandler(async (req: Request, res: Response) => {
    const status = await paymentService.getStatus(req.params.orderId);
    res.json(new ApiResponse(status));
  }),

  clickWebhook: asyncHandler(async (req: Request, res: Response) => {
    const result = await paymentService.handleClickWebhook(req.body);
    res.json(result);
  }),

  paymeWebhook: asyncHandler(async (req: Request, res: Response) => {
    const result = await paymentService.handlePaymeWebhook(req.body);
    res.json({ id: req.body.id, result: result.result, error: result.error });
  }),

  refund: asyncHandler(async (req: Request, res: Response) => {
    const result = await paymentService.refund(req.params.orderId, req.user.id, req.body);
    res.json(new ApiResponse(result, 'Qaytarish amalga oshirildi'));
  }),
};
