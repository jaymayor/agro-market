import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiResponse } from '../../utils/ApiResponse';
import { orderService } from './order.service';

export const orderController = {
  checkout: asyncHandler(async (req: Request, res: Response) => {
    const order = await orderService.checkout(req.user.id, req.body);
    res.status(201).json(new ApiResponse(order, 'Buyurtma yaratildi'));
  }),

  getList: asyncHandler(async (req: Request, res: Response) => {
    const result = await orderService.getList(req.user.id, req.user.role, req.query as any);
    res.json(new ApiResponse(result.data, 'OK', result.meta));
  }),

  getOne: asyncHandler(async (req: Request, res: Response) => {
    const order = await orderService.getOne(req.params.id, req.user.id, req.user.role);
    res.json(new ApiResponse(order));
  }),

  confirm: asyncHandler(async (req: Request, res: Response) => {
    const order = await orderService.changeStatus(req.params.id, req.user.id, req.user.role, 'confirmed');
    res.json(new ApiResponse(order, 'Tasdiqlandi'));
  }),

  prepare: asyncHandler(async (req: Request, res: Response) => {
    const order = await orderService.changeStatus(req.params.id, req.user.id, req.user.role, 'preparing');
    res.json(new ApiResponse(order, 'Tayyorlanmoqda'));
  }),

  ship: asyncHandler(async (req: Request, res: Response) => {
    const order = await orderService.changeStatus(req.params.id, req.user.id, req.user.role, 'shipped');
    res.json(new ApiResponse(order, "Yo'lda"));
  }),

  deliver: asyncHandler(async (req: Request, res: Response) => {
    const order = await orderService.changeStatus(req.params.id, req.user.id, req.user.role, 'delivered');
    res.json(new ApiResponse(order, 'Yetkazildi'));
  }),

  complete: asyncHandler(async (req: Request, res: Response) => {
    const order = await orderService.changeStatus(req.params.id, req.user.id, req.user.role, 'completed');
    res.json(new ApiResponse(order, 'Yakunlandi'));
  }),

  cancel: asyncHandler(async (req: Request, res: Response) => {
    const order = await orderService.changeStatus(req.params.id, req.user.id, req.user.role, 'cancelled', req.body.reason);
    res.json(new ApiResponse(order, 'Bekor qilindi'));
  }),

  getHistory: asyncHandler(async (req: Request, res: Response) => {
    const history = await orderService.getHistory(req.params.id);
    res.json(new ApiResponse(history));
  }),
};
