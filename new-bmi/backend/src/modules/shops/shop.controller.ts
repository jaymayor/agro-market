import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiResponse } from '../../utils/ApiResponse';
import { shopService } from './shop.service';

export const shopController = {
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const result = await shopService.getAll(req.query);
    res.json(new ApiResponse(result.data, 'OK', result.meta));
  }),

  getBySlug: asyncHandler(async (req: Request, res: Response) => {
    const shop = await shopService.getBySlug(req.params.slug);
    res.json(new ApiResponse(shop));
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const shop = await shopService.create(req.user.id, req.body);
    res.status(201).json(new ApiResponse(shop, "Do'kon yaratildi, moderatsiya kutilmoqda"));
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const shop = await shopService.update(req.user.id, req.body);
    res.json(new ApiResponse(shop, 'Yangilandi'));
  }),

  changeStatus: asyncHandler(async (req: Request, res: Response) => {
    const shop = await shopService.changeStatus(req.params.id, req.body.status);
    res.json(new ApiResponse(shop, 'Holat o\'zgartirildi'));
  }),

  myShop: asyncHandler(async (req: Request, res: Response) => {
    const shop = await shopService.getMyShop(req.user.id);
    res.json(new ApiResponse(shop));
  }),

  adminList: asyncHandler(async (req: Request, res: Response) => {
    const status = (req.query.status as string) || 'pending';
    const shops = await shopService.adminList(status);
    res.json(new ApiResponse(shops));
  }),
};
