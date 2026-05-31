import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiResponse } from '../../utils/ApiResponse';
import { ApiError } from '../../utils/ApiError';
import { categoryService } from './category.service';
import { uploadToCloudinary } from '../../config/cloudinary';

export const categoryController = {
  getAll: asyncHandler(async (_req: Request, res: Response) => {
    const categories = await categoryService.getAll();
    res.json(new ApiResponse(categories));
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const category = await categoryService.create(req.body);
    res.status(201).json(new ApiResponse(category, 'Yaratildi'));
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const category = await categoryService.update(req.params.id, req.body);
    res.json(new ApiResponse(category, 'Yangilandi'));
  }),

  uploadIcon: asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) throw new ApiError(400, 'Rasm yuborilmadi');
    const url = await uploadToCloudinary(req.file.buffer, 'categories');
    const category = await categoryService.uploadIcon(req.params.id, url);
    res.json(new ApiResponse(category, 'Icon yuklandi'));
  }),
};
