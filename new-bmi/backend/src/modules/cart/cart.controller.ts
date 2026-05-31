import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiResponse } from '../../utils/ApiResponse';
import { cartService } from './cart.service';

export const cartController = {
  get: asyncHandler(async (req: Request, res: Response) => {
    const cart = await cartService.get(req.user.id);
    res.json(new ApiResponse(cart));
  }),

  addItem: asyncHandler(async (req: Request, res: Response) => {
    const item = await cartService.addItem(req.user.id, req.body.product_id, req.body.quantity);
    res.status(201).json(new ApiResponse(item, "Savatga qo'shildi"));
  }),

  updateItem: asyncHandler(async (req: Request, res: Response) => {
    const item = await cartService.updateItem(req.user.id, req.params.itemId, req.body.quantity);
    res.json(new ApiResponse(item, 'Yangilandi'));
  }),

  removeItem: asyncHandler(async (req: Request, res: Response) => {
    await cartService.removeItem(req.user.id, req.params.itemId);
    res.json(new ApiResponse(null, "O'chirildi"));
  }),

  clear: asyncHandler(async (req: Request, res: Response) => {
    await cartService.clear(req.user.id);
    res.json(new ApiResponse(null, 'Savat tozalandi'));
  }),

  validate: asyncHandler(async (req: Request, res: Response) => {
    const result = await cartService.validate(req.user.id);
    res.json(new ApiResponse(result, result.valid ? 'Savat tayyor' : 'Muammolar bor'));
  }),
};
