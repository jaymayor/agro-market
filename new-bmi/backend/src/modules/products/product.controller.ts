import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiResponse } from '../../utils/ApiResponse';
import { ApiError } from '../../utils/ApiError';
import { productService } from './product.service';
import { prisma } from '../../lib/prisma';
import { uploadToCloudinary } from '../../config/cloudinary';

export const productController = {
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const result = await productService.getAll(req.query as any);
    res.json(new ApiResponse(result.data, 'OK', result.meta));
  }),

  getBySlug: asyncHandler(async (req: Request, res: Response) => {
    const product = await productService.getBySlug(req.params.slug);
    res.json(new ApiResponse(product));
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const shop = await prisma.shop.findUnique({ where: { owner_id: req.user.id } });
    if (!shop) throw new ApiError(403, "Avval do'kon oching");
    if (shop.status !== 'active') throw new ApiError(403, "Do'koningiz faol emas");
    const product = await productService.create(shop.id, req.body);
    res.status(201).json(new ApiResponse(product, 'Mahsulot qo\'shildi, moderatsiya kutilmoqda'));
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const shop = await prisma.shop.findUnique({ where: { owner_id: req.user.id } });
    if (!shop) throw new ApiError(403, "Do'kon topilmadi");
    const product = await productService.update(req.params.id, shop.id, req.body);
    res.json(new ApiResponse(product, 'Yangilandi'));
  }),

  updateStock: asyncHandler(async (req: Request, res: Response) => {
    const shop = await prisma.shop.findUnique({ where: { owner_id: req.user.id } });
    if (!shop) throw new ApiError(403, "Do'kon topilmadi");
    const product = await productService.updateStock(req.params.id, shop.id, req.body.stock_qty);
    res.json(new ApiResponse(product, 'Stock yangilandi'));
  }),

  approve: asyncHandler(async (req: Request, res: Response) => {
    const product = await productService.approve(req.params.id);
    res.json(new ApiResponse(product, 'Mahsulot tasdiqlandi'));
  }),

  reject: asyncHandler(async (req: Request, res: Response) => {
    const product = await productService.reject(req.params.id, req.body.reason);
    res.json(new ApiResponse(product, 'Mahsulot rad etildi'));
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    const shop = await prisma.shop.findUnique({ where: { owner_id: req.user.id } });
    if (!shop) throw new ApiError(403, "Do'kon topilmadi");
    await productService.softDelete(req.params.id, shop.id);
    res.json(new ApiResponse(null, "O'chirildi"));
  }),

  addImage: asyncHandler(async (req: Request, res: Response) => {
    const shop = await prisma.shop.findUnique({ where: { owner_id: req.user.id } });
    if (!shop) throw new ApiError(403, "Do'kon topilmadi");
    if (!req.file) throw new ApiError(400, 'Rasm yuborilmadi');
    const url = await uploadToCloudinary(req.file.buffer, 'products');
    const image = await productService.addImage(req.params.id, shop.id, url, req.body.is_main === 'true');
    res.status(201).json(new ApiResponse(image, 'Rasm qo\'shildi'));
  }),

  myProducts: asyncHandler(async (req: Request, res: Response) => {
    const shop = await prisma.shop.findUnique({ where: { owner_id: req.user.id } });
    if (!shop) throw new ApiError(403, "Do'kon topilmadi");
    const result = await productService.getShopProducts(shop.id, req.query as any);
    res.json(new ApiResponse(result.data, 'OK', result.meta));
  }),
};
